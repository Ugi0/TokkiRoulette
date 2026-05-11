import { useEffect, useRef } from "react";
import type { HookData } from "../../types/hookData";
import { log } from "../../utils/log";

export function useResultsSocket(enabled: boolean, onResults: (data: HookData) => void) {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!enabled) {
      socketRef.current?.close();
      socketRef.current = null;
      return;
    }

    log("Socket started");
    const protocol = location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${protocol}://${location.host}/ws`);

    ws.onmessage = (event) => {
      log("WS message received:", event.data);
      const data = JSON.parse(event.data);

      if (data.type === "results-ready") {
        ws.close();
        socketRef.current = null;
        const resultData = data["data"] as HookData;

        onResults(resultData);
      }
    };

    socketRef.current = ws;

    return () => ws.close();
  }, [enabled, onResults]);
}
