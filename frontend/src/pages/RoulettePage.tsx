import RouletteTable from "../components/RouletteTable";
import "./RoulettePage.css";
import Footer from "../components/Footer";
import { useState } from "react";
import Notification from "../components/Notification";
import { useResultsSocket } from "../components/Overlay/UseSocket";
import { AssistantUI } from "../components/ResultsPanel/AssistantUI";

export default function RoulettePage() {
  const [notification, _setNotification] = useState<string | null>(null);
  const [resultsAvailable, setResultsAvailable] = useState(false);
  const [socketEnabled, setSocketEnabled] = useState(false);

  const setNotification: React.Dispatch<React.SetStateAction<string | null>> = (value) => {
    if (typeof value === "function") {
      _setNotification((prev) => {
        const next = value(prev);

        if (next) {
          setSocketEnabled(true);
        }

        return next;
      });
    } else {
      if (value) {
        setSocketEnabled(true);
      }
      _setNotification(value);
    }
  };

  useResultsSocket(socketEnabled, () => {
    setResultsAvailable(true);
  });

  return (
    <div className="page-root">
      <main className="roulette-page">
        <div className="roulette-page__header">
          <h1>Totally not rigged Roulette table</h1>
        </div>

        <RouletteTable setNotification={setNotification} />
      </main>

      <Notification
        notification={notification}
        onDismiss={() => setNotification(null)}
      />

      {resultsAvailable && <AssistantUI show={resultsAvailable} />}

      <Footer />
    </div>
  );
}
