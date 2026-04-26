import { IncomingMessage, ServerResponse } from "node:http";
import { TwitchPredictionBeginEvent, TwitchPredictionEndEvent, TwitchPredictionEvent, TwitchPredictionLockEvent } from "../types/events.js";
import { endPrediction, lockPrediction, newPrediction } from "../services/db_updates.js";

export default async function webhookRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL
): Promise<IncomingMessage | ServerResponse | void> {

    
const user = url.searchParams.get("user");

  if (url.pathname !== "/twitch") {
    res.writeHead(404, { "Content-Type": "text/plain" });
    return res.end("Not Found");
  }

  try {
    
    const rawBody = await getJsonBody(req);
    const body = rawBody as TwitchPredictionEvent;


    switch (body.subscription.type) {
        case "channel.prediction.begin": {
            const event = body as TwitchPredictionBeginEvent;

            await newPrediction(event);

            console.log("New prediction started for broadcaster", event.event.broadcaster_user_login);
            break;
        }

        case "channel.prediction.lock": {
            const event = body as TwitchPredictionLockEvent;

            await lockPrediction(event);

            console.log("Prediction locked for broadcaster", event.event.broadcaster_user_login);
            break;
        }

        case "channel.prediction.end": {
            const event = body as TwitchPredictionEndEvent;

            await endPrediction(event);

            console.log("Prediction ended for broadcaster", event.event.broadcaster_user_login);
            break;
        }

        default:
            throw new Error("Unknown prediction event type");
        }

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");

  } catch (err) {
    console.error("Invalid JSON body:", err);
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("Bad Request");
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