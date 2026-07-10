import RouletteTable from "../components/RouletteComponents/RouletteTable";
import "./RoulettePage.css";
import Footer from "../components/Footer";
import { useRef, useState } from "react";
import Notification from "../components/Notification";
import SiteHeader from "../components/SiteHeader";
import { useResultsSocket } from "../components/Overlay/UseSocket";
import { AssistantUI } from "../components/ResultsPanel/AssistantUI";
import type { HookData } from "../types/hookData";

export default function RoulettePage() {
  const [notification, _setNotification] = useState<string | null>(null);
  const [results, setResults] = useState<HookData | null>(null);
  const [socketEnabled, setSocketEnabled] = useState(false);


  const [hideNotWord, setHideNotWord] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const handleMouseEnter = () => {
    timeoutRef.current = window.setTimeout(() => {
      setHideNotWord(true);
    }, 1000);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setHideNotWord(false);
  };


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

  useResultsSocket(socketEnabled, (data: HookData) => {
    if (results == null) {
      setSocketEnabled(false);
      setResults(data);
    }
  });

  return (
    <div className="page-root">
      <SiteHeader />
      <main className="roulette-page">
        <div className="roulette-page__header"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <h1 className="roulette-title">
            <span className="start-word">Totally</span>
            <span className={`not-word ${hideNotWord ? "hidden" : ""}`}>not</span> R
            <span className="fancy-i"/>
            gged Roulette
          </h1>
        </div>

        <RouletteTable setNotification={setNotification} />
      </main>

      <Notification
        notification={notification}
        onDismiss={() => setNotification(null)}
      />

      {results != null && <AssistantUI data={results} setResults={() => { setResults(null); setSocketEnabled(false) }} />}

      <Footer />
    </div>
  );
}
