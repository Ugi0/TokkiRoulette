import { clients } from "../routes/wsServer.js";
import { TwitchPredictionEndEvent } from "../types/events.js";
import { HookData } from "../types/hookData.js";
import { getTotalPredictionResults } from "./cache.js";
import { getUserSession } from "./db_queries.js";

export async function handlePredictionEndPush(endEvent: TwitchPredictionEndEvent) {
  // Change to endEvent.event.broadcaster_user_id if need to support other broadcasters in the future
  const sessionId = await getUserSession(process.env.TOKKI_USER_ID!);

  if (!sessionId) {
    console.error("No active session found for broadcaster:", endEvent.event.broadcaster_user_id);
    return;
  }

  const totalResults = await getTotalPredictionResults(endEvent);

  const payload: Payload = {
    type: "results-ready",
    data: totalResults,
  };

  await pushToSession(sessionId, payload);
}

async function pushToSession(sessionId: string, payload: Payload) {
  const ws = clients.get(sessionId);

  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.log("Websocket not open for session:", sessionId);
    return;
  }

  ws.send(JSON.stringify(payload));
}

type Payload = {
  type: string;
  data: HookData | null;
}