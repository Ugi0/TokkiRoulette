import RouletteTable from "../components/RouletteTable";
import "./RoulettePage.css";
import Footer from "../components/Footer";
import { useState } from "react";
import Notification from "../components/Notification";
import {Link} from "react-router";

export default function RoulettePage() {
  const [notification, setNotification] = useState<string | null>(null);

  return (
    <div className="page-root">
      <main className="roulette-page">
        <div className="roulette-page__header">
          <h1>Totally not rigged Roulette table</h1>
            <Link to={"/analytics"}> Analytics </Link>
        </div>

        <RouletteTable setNotification={setNotification}  />
      </main>
      <Notification notification={notification} onDismiss={() => setNotification(null)} />
      <Footer />
    </div>
  );
}
