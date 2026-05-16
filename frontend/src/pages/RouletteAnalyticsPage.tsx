import "./RouletteAnalyticsPage.css";
import Footer from "../components/Footer";
import RouletteAnalytics from "../components/RouletteAnalytics.tsx";
import SiteHeader from "../components/SiteHeader";

export default function RouletteAnalyticsPage() {

    return (
        <div className="page-root">
            <SiteHeader />
            <main className="roulette-stats-page">
                <div className="roulette-stats-page__header">
                    <h1>Tokki Roulette Analytics</h1>
                </div>

                <RouletteAnalytics />
            </main>
            <Footer />
        </div>
    );
}
