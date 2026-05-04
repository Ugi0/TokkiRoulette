import RouletteTable from "../components/RouletteTable";
import "./RoulettePage.css";
import Footer from "../components/Footer";
import { useState } from "react";
import Notification from "../components/Notification";
import ResultsButton from "../components/ResultsButton";
import { useEffect, useRef } from "react";
import {Link} from "react-router";

export default function RoulettePage() {
  const [notification, setNotification] = useState<string | null>(null);
  const [resultsAvailable, setResultsAvailable] = useState(false);

  useResultsSocket(!!notification, () => {
    setResultsAvailable(true);
  });

  return (
    <div className="page-root">
      <main className="roulette-page">
        <div className="roulette-page__header">
          <h1>Totally not rigged Roulette table</h1>
            <Link to={"/analytics"}> Analytics </Link>
        </div>

        <RouletteTable setNotification={setNotification} />
      </main>

      <Notification
        notification={notification}
        onDismiss={() => {
          setNotification(null);
        }}
      />

      {resultsAvailable && (
        <ResultsButton />
      )}

      <Footer />
    </div>
  );
}

function useResultsSocket(enabled: boolean, onResults: (data: unknown) => void) {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!enabled) {
      socketRef.current?.close();
      socketRef.current = null;
      return;
    }

    const ws = new WebSocket("wss://your-backend/ws");

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
