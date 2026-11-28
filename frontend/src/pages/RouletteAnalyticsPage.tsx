import "./RouletteAnalyticsPage.css";
import Footer from "../components/Footer";
import RouletteAnalytics from "../components/StatisticsComponents/RouletteAnalytics.tsx";
import SiteHeader from "../components/SiteHeader";
import IntervalMenu from "../components/StatisticsComponents/IntervalMenu.tsx";
import { useEffect, useState } from "react";
import { StatsInterval, type Analytics, type PredictionEntry } from "../types/analytics.ts";
import PredictionDetails from "../components/StatisticsComponents/PredictionDetailsView.tsx";
import { loadIndividual, loadIntervals } from "../utils/statisticsQueries.ts";
import { ProfileProvider } from "../components/Profiles/ProfileProvider.tsx";

export default function RouletteAnalyticsPage() {
    const [interval, setInterval] = useState<StatsInterval>(StatsInterval.CURRENT_MONTH.queryParam);
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
        <ProfileProvider>
        <div className="page-root">
            {selectedPrediction && (
                <PredictionDetails key={selectedPrediction.prediction_id} prediction={selectedPrediction} onClose={() => setSelectedPrediction(null)} />
            )}
            <SiteHeader titleExtra="Analytics" />

            <main className="roulette-stats-page">
                <div className="analytics-toolbar">
                    <div className="analytics-toolbar__titles">
                        <h1>Prediction analytics</h1>
                        <p>Who's winning, who's losing, and who should probably stop.</p>
                    </div>
                    <IntervalMenu
                        value={interval}
                        options={availableIntervals}
                        onChange={setInterval}
                    />
                </div>

                {error ? (
                    <div className="state-message state-message--error" role="alert">
                        <p>Couldn't load analytics: {error}</p>
                        <button type="button" className="btn-ghost" onClick={() => loadIndividual({ setLoading, setError, setAnalytics, interval })}>
                            Try again
                        </button>
                    </div>
                ) : loading || !analytics ? (
                    <div className="state-message" aria-busy="true">
                        <div className="spinner" />
                        <p>Crunching the numbers…</p>
                    </div>
                ) : (
                    <RouletteAnalytics analytics={analytics} setSelectedPrediction={setSelectedPrediction} />
                )}
            </main>
            <Footer />
        </div>
        </ProfileProvider>
    );
}
