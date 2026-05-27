import "./RouletteAnalyticsPage.css";
import Footer from "../components/Footer";
import RouletteAnalytics from "../components/StatisticsComponents/RouletteAnalytics.tsx";
import SiteHeader from "../components/SiteHeader";
import IntervalMenu from "../components/StatisticsComponents/IntervalMenu.tsx";
import { useEffect, useState } from "react";
import { StatsInterval, type Analytics } from "../types/analytics.ts";

const endpoint = "/api/analytics/data";

export default function RouletteAnalyticsPage() {
    const [interval, setInterval] = useState<StatsInterval>(StatsInterval.ALL.queryParam);
    const [availableIntervals, setAvailableIntervals] = useState<StatsInterval[]>([]);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
            async function loadIntervals() {
                const response = await fetch("/api/analytics/intervals");
                const data = await response.json();
                setAvailableIntervals(data);
            }
    
            loadIntervals();
    
            async function loadIndividual() {
                try {
                    setLoading(true);
                    setError(null);
    
                    const separator = endpoint.includes("?") ? "&" : "?";
                    const requestUrl = `${endpoint}${separator}interval=${interval}`;
    
    
                    const response = await fetch(requestUrl, {
                        credentials: "include",
                    });
    
                    const data = await response.json();
    
                    if (!response.ok) {
                        throw new Error(data.error ?? "Failed to load data;");
                    }
    
                    setAnalytics(data as Analytics | null);
                } catch (err) {
                    setError(err instanceof Error ? err.message : "Unknown error");
                } finally {
                    setLoading(false);
                }
            }
    
            loadIndividual();
        }, [interval]);

        return (
            <>
            {loading || !analytics && <p>Loading...</p>}
            {error && <p>{error}</p>}

            {!loading && !error && (
                <div className="page-root">
                    <SiteHeader titleExtra={"Analytics"} />
                    <IntervalMenu
                        value={interval}
                        options={availableIntervals}
                        onChange={setInterval}
                    />
                    <main className="roulette-stats-page">

                        <RouletteAnalytics analytics={analytics!} />
                    </main>
                    <Footer />
                </div>
            )}
            </>
        );
}
