import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import { parseCookies } from "./spinResult.js";

type ClientMap = Map<string, WebSocket>;

export const clients: ClientMap = new Map();

// Messages that could not be delivered because the session's socket was not open yet.
// The prediction END webhook can arrive before the frontend has opened its socket,
// so we hold the message and deliver it as soon as the session connects.
const PENDING_TTL_MS = 5 * 60 * 1000;
const pendingMessages = new Map<string, { message: string; expiresAt: number }>();

export function sendOrQueue(sessionId: string, message: string): boolean {
  const ws = clients.get(sessionId);

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(message);
    return true;
  }

  pendingMessages.set(sessionId, { message, expiresAt: Date.now() + PENDING_TTL_MS });
  return false;
}

function flushPending(sessionId: string, ws: WebSocket) {
  const pending = pendingMessages.get(sessionId);
  if (!pending) return;

  pendingMessages.delete(sessionId);

  if (pending.expiresAt < Date.now()) {
    console.log(`Discarded expired pending WS message for session: ${sessionId}`);
    return;
  }

  ws.send(pending.message);
  console.log(`Delivered pending WS message to session: ${sessionId}`);
}

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

      const removeClient = () => {
        // Only remove if this socket is still the registered one; a newer
        // connection for the same session may have replaced it.
        if (clients.get(sessionId) === ws) {
          clients.delete(sessionId);
        }
      };

      ws.on("close", () => {
        removeClient();
        console.log(`WS disconnected: ${sessionId}`);
      });

      ws.on("error", removeClient);

      flushPending(sessionId, ws);

    } catch {
      ws.close();
    }
  });
}
