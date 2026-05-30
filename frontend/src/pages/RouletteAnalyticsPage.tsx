import "./RouletteAnalyticsPage.css";
import Footer from "../components/Footer";
import RouletteAnalytics from "../components/StatisticsComponents/RouletteAnalytics.tsx";
import SiteHeader from "../components/SiteHeader";
import IntervalMenu from "../components/StatisticsComponents/IntervalMenu.tsx";
import { useEffect, useState } from "react";
import { StatsInterval, type Analytics, type PredictionEntry } from "../types/analytics.ts";
import PredictionDetails from "../components/StatisticsComponents/PredictionDetailsView.tsx";
import { loadIndividual, loadIntervals } from "../utils/statisticsQueries.ts";

export default function RouletteAnalyticsPage() {
    const [interval, setInterval] = useState<StatsInterval>(StatsInterval.ONE_MONTH.queryParam);
    const [availableIntervals, setAvailableIntervals] = useState<StatsInterval[]>([]);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPrediction, setSelectedPrediction] = useState<PredictionEntry | null>(null);

    useEffect(() => {
            loadIntervals(setAvailableIntervals);
            loadIndividual({ setLoading, setError, setAnalytics, interval });
        }, [interval]);

        return (
            <>
            {(loading || !analytics) && <p>Loading...</p>}
            {error && <p>{error}</p>}

            {analytics && !error && (
                <div className="page-root">
                    {selectedPrediction && <PredictionDetails prediction={selectedPrediction} onClose={() => setSelectedPrediction(null)} />}
                    <SiteHeader titleExtra={"Analytics"} />
                    <IntervalMenu
                        value={interval}
                        options={availableIntervals}
                        onChange={setInterval}
                    />
                    <main className="roulette-stats-page">

                        <RouletteAnalytics analytics={analytics!} setSelectedPrediction={setSelectedPrediction} />
                    </main>
                    <Footer />
                </div>
            )}
            </>
        );
}
