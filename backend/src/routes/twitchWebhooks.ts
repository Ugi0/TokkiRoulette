import { IncomingMessage, ServerResponse } from "node:http";
import {
  TwitchPredictionBeginEvent,
  TwitchPredictionLockEvent,
  TwitchPredictionEndEvent,
  TwitchPredictionEvent,
} from "../types/events.js";
import {
  cancelPrediction,
  endPrediction,
  lockPrediction,
  newPrediction,
} from "../services/db_updates.js";
import { handlePredictionEndPush } from "../services/pushToHook.js";
import { cacheUserResults, deleteCache } from "../services/cache.js";
import { isPredictionRoulette } from "../services/db_queries.js";
import { getWebhookSecret } from "../services/devMode.js";
import { readRawBody } from "../utils/body.js";
import { verifyEventSubMessage } from "../utils/eventsubSignature.js";

// Twitch delivers at-least-once and retries on failure; remember recent message ids to skip duplicates.
const DEDUP_WINDOW_MS = 10 * 60 * 1000;
const seenMessageIds = new Map<string, number>();

function isDuplicate(messageId: string): boolean {
  const now = Date.now();
  for (const [id, seenAt] of seenMessageIds) {
    if (now - seenAt > DEDUP_WINDOW_MS) seenMessageIds.delete(id);
  }
  return seenMessageIds.has(messageId);
}

function header(req: IncomingMessage, name: string): string | undefined {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

export default async function webhookRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL
): Promise<IncomingMessage | ServerResponse | void> {

  if (req.method !== "POST" || url.pathname !== "/webhooks/twitch") {
    res.writeHead(404, { "Content-Type": "text/plain" });
    return res.end("Not Found");
  }

  let rawBody: string;
  try {
    rawBody = await readRawBody(req);
  } catch (err) {
    console.error("Failed to read webhook body:", err);
    res.writeHead(400, { "Content-Type": "text/plain" });
    return res.end("Invalid body");
  }

  const secret = getWebhookSecret();
  if (!secret) {
    console.error("TWITCH_WEBHOOK_SECRET is not set; rejecting webhook");
    res.writeHead(500, { "Content-Type": "text/plain" });
    return res.end("Webhook secret not configured");
  }

  const messageId = header(req, "twitch-eventsub-message-id");
  const verified = verifyEventSubMessage(
    secret,
    {
      messageId,
      timestamp: header(req, "twitch-eventsub-message-timestamp"),
      signature: header(req, "twitch-eventsub-message-signature"),
    },
    rawBody
  );

  if (!verified) {
    console.warn("Rejected webhook with invalid or missing EventSub signature");
    res.writeHead(403, { "Content-Type": "text/plain" });
    return res.end("Invalid signature");
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch (err) {
    console.error("Failed to parse JSON body:", err);
    res.writeHead(400, { "Content-Type": "text/plain" });
    return res.end("Invalid JSON");
  }

  const messageType = header(req, "twitch-eventsub-message-type");

  if (messageType === "webhook_callback_verification") {
    const challenge = (body as { challenge?: unknown })?.challenge;
    if (typeof challenge !== "string") {
      res.writeHead(400, { "Content-Type": "text/plain" });
      return res.end("Missing challenge");
    }
    res.writeHead(200, { "Content-Type": "text/plain" });
    return res.end(challenge);
  }

  if (messageType === "revocation") {
    console.warn("EventSub subscription revoked:", JSON.stringify((body as any)?.subscription));
    res.writeHead(204);
    return res.end();
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("subscription" in body) ||
    !("event" in body)
  ) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    return res.end("Invalid EventSub payload");
  }

  if (isDuplicate(messageId!)) {
    console.log("Skipping duplicate EventSub message:", messageId);
    res.writeHead(204);
    return res.end();
  }

  const event = body as TwitchPredictionEvent;

  try {
    switch (event.subscription.type) {

      case "channel.prediction.begin": {
        const beginEvent = event as TwitchPredictionBeginEvent;

        await newPrediction(beginEvent);
        console.log(`Prediction BEGIN - %s: %s`, beginEvent.event.id, beginEvent.event.broadcaster_user_login);
        break;
      }

      case "channel.prediction.lock": {
        const lockEvent = event as TwitchPredictionLockEvent;

        // The lock payload carries the final bets; cache them in case no progress event covered them.
        progressPrediction(lockEvent);
        await lockPrediction(lockEvent);
        console.log(`Prediction LOCK - %s: %s`, lockEvent.event.id, lockEvent.event.broadcaster_user_login);
        break;
      }

      case "channel.prediction.progress": {
        const progressEvent = event as TwitchPredictionLockEvent;

        progressPrediction(progressEvent);
        console.log(`Prediction PROGRESS - %s: %s`, progressEvent.event.id, progressEvent.event.broadcaster_user_login);
        break;
      }

      case "channel.prediction.end": {
        const endEvent = event as TwitchPredictionEndEvent;

        if (endEvent.event.status === "canceled") {
          console.log(`Prediction CANCELED - %s: %s`, endEvent.event.id, endEvent.event.broadcaster_user_login);
          await cancelPrediction(endEvent);
          deleteCache(endEvent.event.id);
          break;
        }

        progressPrediction(endEvent);

        await endPrediction(endEvent);

        // Only roulette predictions are shown in the results panel. Pushing other predictions would
        // queue them for the broadcaster and show them after the next spin instead of the real results.
        if (await isPredictionRoulette(endEvent.event.id)) {
          await handlePredictionEndPush(endEvent);
        }

        deleteCache(endEvent.event.id);

        console.log(
          `Prediction END - %s: %s`,
          endEvent.event.id,
          endEvent.event.broadcaster_user_login
        );
        break;
      }

      default:
        console.warn(
          "Unhandled EventSub type:",
          event.subscription.type
        );
        break;
    }

    seenMessageIds.set(messageId!, Date.now());

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");

  } catch (err) {
    console.error("Webhook processing error:", err);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  }
}

function progressPrediction(prediction_event: TwitchPredictionLockEvent | TwitchPredictionEndEvent) {
  cacheUserResults(prediction_event.event.id, prediction_event.event.outcomes.flatMap(outcome =>
    outcome.top_predictors.map(pred => ({
      user_id: pred.user_id,
      user_name: pred.user_name,
      bet_amount: pred.channel_points_used,
      won_amount: pred.channel_points_won,
      voted_option: outcome.id,
    }))
  ));
}
