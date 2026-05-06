import { useEffect, useRef } from "react";

export function useResultsSocket(enabled: boolean, onResults: (data: unknown) => void) {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!enabled) {
      socketRef.current?.close();
      socketRef.current = null;
      return;
    }

    console.log("Socket started");
    const ws = new WebSocket("wss://roulette.ugi0.org/ws");

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "results-ready") {
        onResults(data);
      }
    };

    socketRef.current = ws;

    return () => ws.close();
  }, [enabled, onResults]);
}
