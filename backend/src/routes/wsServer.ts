import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import { parseCookies } from "./spinResult.js";
import { handlePredictionEndPush } from "../services/pushToHook.js";

type ClientMap = Map<string, WebSocket>;

export const clients: ClientMap = new Map();

export function initWebSocketServer(server: any) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws, req: IncomingMessage) => {
    console.log("New WS connection");
    try {
      const cookies = parseCookies(req);
      const sessionId = cookies.session_id;

      if (!sessionId) {
        console.log("Websocket connected without session_id cookie, closing connection");
        ws.close(1008, "No session");
        return;
      }

      setTimeout(async () => {
        await handlePredictionEndPush({
          event: {
            id: "39a07654-8522-4867-9f35-2c71320a9eed",
            broadcaster_user_id: "61785838",
            broadcaster_user_login: "test",
            broadcaster_user_name: "test",
            title: "Test Prediction",
            winning_outcome_id: "1",
            outcomes: [
              {
                id: "1",
                title: "Outcome 1",
                color: "blue",
                users: 10,
                channel_points: 1000,
                top_predictors: [],
              },
            ],
            status: "resolved",
            started_at: new Date().toISOString(),
            ended_at: new Date().toISOString(),
          },
          subscription: {
            type: "channel.prediction.end",
            version: "1",
            condition: { broadcaster_user_id: "123" },
            transport: {
              method: "webhook",
              callback: "https://example.com/webhooks/twitch",
            },
          },
        } as any);
      }, 1000);

      clients.set(sessionId, ws);

      console.log(`WS connected: ${sessionId}`);

      ws.on("close", () => {
        clients.delete(sessionId);
        console.log(`WS disconnected: ${sessionId}`);
      });

      ws.on("error", () => {
        clients.delete(sessionId);
      });

    } catch {
      ws.close();
    }
  });
}