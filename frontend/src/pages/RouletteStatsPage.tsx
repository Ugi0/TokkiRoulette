import { Link } from "react-router";
import "./RouletteStatsPage.css";
import Footer from "../components/Footer";
import RouletteTable from "../components/RouletteTable.tsx";
import Notification from "../components/Notification.tsx";
import { useState } from "react";

export default function RouletteStatsPage() {
    const [notification, setNotification] = useState<string | null>(null);

    return (
        <div className="page-root">
            <main className="roulette-stats-page">
                <div className="roulette-stats-page__header">
                    <h1>Tokki Roulette Analytics</h1>
                    <Link className="roulette--page__link" to="/">
                        Back Home
                    </Link>
                </div>

                <RouletteTable setNotification={setNotification}  />
            </main>
            <Notification notification={notification} onDismiss={() => setNotification(null)} />
            <Footer />
        </div>
    );
}