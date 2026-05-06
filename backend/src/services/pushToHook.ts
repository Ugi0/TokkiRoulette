import { clients } from "../routes/wsServer.js";
import { TwitchPredictionEndEvent } from "../types/events.js";
import { HookData } from "../types/hookData.js";
import { getTotalPredictionResults, getUserSession } from "./db_queries.js";

export async function handlePredictionEndPush(endEvent: TwitchPredictionEndEvent) {
  const sessionId = await getUserSession(endEvent.event.broadcaster_user_id);

  if (!sessionId) {
    console.error("No active session found for broadcaster:", endEvent.event.broadcaster_user_id);
    return;
  }

  const totalResults = await getTotalPredictionResults(endEvent.event.id);

  const payload: Payload = {
    type: "results-ready",
    data: totalResults,
  };

  pushToSession(sessionId, payload);
}

function pushToSession(
  sessionId: string,
  payload: Payload
) {
  const ws = clients.get(sessionId);

  if (!ws || ws.readyState !== ws.OPEN) {
    return;
  }

  ws.send(JSON.stringify(payload));
}

type Payload = {
  type: string;
  data: HookData | null;
}