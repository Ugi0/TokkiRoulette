import RouletteTable from "../components/RouletteTable";
import "./RoulettePage.css";
import Footer from "../components/Footer";
import { useState } from "react";
import Notification from "../components/Notification";
import ResultsButton from "../components/ResultsButton";
import { useResultsSocket } from "../components/Overlay/UseSocket";

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
