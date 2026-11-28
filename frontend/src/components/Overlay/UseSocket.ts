import { useEffect, useRef } from "react";
import type { HookData } from "../../types/hookData";
import { log } from "../../utils/log";

const RECONNECT_DELAY_MS = 2000;

export function useResultsSocket(enabled: boolean, onResults: (data: HookData) => void) {
  const onResultsRef = useRef(onResults);
  useEffect(() => {
    onResultsRef.current = onResults;
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let ws: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    let stopped = false;

    const connect = () => {
      console.log("Socket started");
      const protocol = location.protocol === "https:" ? "wss" : "ws";
      const socket = new WebSocket(`${protocol}://${location.host}/ws`);
      ws = socket;

      socket.onmessage = (event) => {
        log("WS message received:", event.data);

        let data;
        try {
          data = JSON.parse(event.data);
        } catch {
          console.error("Invalid WS message:", event.data);
          return;
        }

        if (data.type === "results-ready") {
          stopped = true;
          socket.close();
          onResultsRef.current(data["data"] as HookData);
        }
      };

      // If the connection drops before the results arrive, reconnect. The backend holds
      // undelivered results for the session and sends them as soon as we are back.
      socket.onclose = () => {
        log("Socket closed");
        if (!stopped) {
          reconnectTimer = window.setTimeout(connect, RECONNECT_DELAY_MS);
        }
      };

      socket.onerror = (error) => {
        console.log("Socket error:", error);
        socket.close();
      };
    };

    connect();

    return () => {
      stopped = true;
      if (reconnectTimer !== null) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [enabled]);
}
