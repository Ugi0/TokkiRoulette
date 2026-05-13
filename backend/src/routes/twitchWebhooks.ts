import { IncomingMessage, ServerResponse } from "node:http";
import {
  TwitchPredictionBeginEvent,
  TwitchPredictionLockEvent,
  TwitchPredictionEndEvent,
  TwitchPredictionEvent,
} from "../types/events.js";
import {
  endPrediction,
  lockPrediction,
  newPrediction,
} from "../services/db_updates.js";
import { handlePredictionEndPush } from "../services/pushToHook.js";
import { cacheUserResults } from "../services/cache.js";

export default async function webhookRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL
): Promise<IncomingMessage | ServerResponse | void> {

  if (req.method !== "POST" || url.pathname !== "/webhooks/twitch") {
    res.writeHead(404, { "Content-Type": "text/plain" });
    return res.end("Not Found");
  }

  let body: unknown;

  try {
    body = await getJsonBody(req);
  } catch (err) {
    console.error("Failed to parse JSON body:", err);
    res.writeHead(400, { "Content-Type": "text/plain" });
    return res.end("Invalid JSON");
  }

  if (
    typeof body === "object" &&
    body !== null &&
    "challenge" in body &&
    typeof (body as any).challenge === "string"
  ) {
    res.writeHead(200, { "Content-Type": "text/plain" });
    return res.end((body as any).challenge);
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

        await lockPrediction(lockEvent);
        console.log(`Prediction LOCK - %s: %s`, lockEvent.event.id, lockEvent.event.broadcaster_user_login);
        break;
      }

      case "channel.prediction.progress": {
        const progressEvent = event as TwitchPredictionLockEvent;

        await progressPrediction(progressEvent);
        console.log(`Prediction PROGRESS - %s: %s`, progressEvent.event.id, progressEvent.event.broadcaster_user_login);
        break;
      }

      case "channel.prediction.end": {
        const endEvent = event as TwitchPredictionEndEvent;

        if (endEvent.event.status === "canceled") {
          console.log(`Prediction CANCELED - %s: %s`, endEvent.event.id, endEvent.event.broadcaster_user_login);
          break;
        }

        await progressPrediction(endEvent);

        await endPrediction(endEvent);

        await handlePredictionEndPush(endEvent);

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

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");

  } catch (err) {
    console.error("Webhook processing error:", err);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  }
}

export function getJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });

    req.on("error", reject);
  });
}

async function progressPrediction(prediction_event: TwitchPredictionLockEvent | TwitchPredictionEndEvent) {
  await cacheUserResults(prediction_event.event.id, prediction_event.event.outcomes.flatMap(outcome =>
    outcome.top_predictors.map(pred => ({
      user_id: pred.user_id,
      user_name: pred.user_name,
      bet_amount: pred.channel_points_used,
      won_amount: pred.channel_points_won,
      voted_option: outcome.id,
    }))
  ));
}