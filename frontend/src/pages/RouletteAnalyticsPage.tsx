import { Link } from "react-router";
import "./RouletteAnalyticsPage.css";
import Footer from "../components/Footer";
import RouletteAnalytics from "../components/RouletteAnalytics.tsx";

export default function RouletteAnalyticsPage() {

    return (
        <div className="page-root">
            <main className="roulette-stats-page">
                <div className="roulette-stats-page__header">
                    <h1>Tokki Roulette Analytics</h1>
                    <Link className="roulette--page__link" to="/">
                        Back Home
                    </Link>
                </div>

                <RouletteAnalytics />
            </main>
            <Footer />
        </div>
    );
}
