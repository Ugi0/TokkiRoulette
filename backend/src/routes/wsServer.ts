import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import { parseCookies } from "./spinResult.js";

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