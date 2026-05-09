import { useEffect, useRef } from "react";
import type { HookData } from "../../types/hookData";

export function useResultsSocket(enabled: boolean, onResults: (data: HookData) => void) {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!enabled) {
      socketRef.current?.close();
      socketRef.current = null;
      return;
    }

    console.log("Socket started");
    const protocol = location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${protocol}://${location.host}/ws`);

    ws.onmessage = (event) => {
      console.log("WS message received:", event.data);
      const data = JSON.parse(event.data);

      if (data.type === "results-ready") {
        ws.close();
        socketRef.current = null;
        const resultData = data["data"] as HookData;

        /*const multipliedData: HookData = {
          ...resultData,
          losers: [
            ...resultData.losers,
            ...resultData.losers,
            ...resultData.losers,
          ],
        };*/

        onResults(resultData);
      }
    };

    ws.onopen = () => console.log("WS open");
    ws.onclose = (e) => console.log("WS closed", e.code, e.reason);
    ws.onerror = (e) => console.log("WS error", e);

    socketRef.current = ws;

    return () => ws.close();
  }, [enabled, onResults]);
}
