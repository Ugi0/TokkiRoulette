import { useEffect, useState } from "react";

import { StatsInterval, type SingleEntry } from "../types/analytics.ts";
import "./Leaderboard.css";

type IndividualProps = {
    title: string;
    endpoint: string;
    allowInterval?: boolean;
};

function formatNet(value: number): string {
    if (value > 0) {
        return `+${value}`;
    }

    if (value < 0) {
        return `-${Math.abs(value)}`;
    }

    return "0";
}

export default function Individual({
    title,
    endpoint,
    allowInterval = false,
}: IndividualProps) {
    const [interval, setInterval] = useState<StatsInterval>(
        StatsInterval.ALL.queryParam
    );
    const [entries, setEntries] = useState<SingleEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadIndividual() {
            try {
                setLoading(true);
                setError(null);

                const separator = endpoint.includes("?") ? "&" : "?";
                const requestUrl = allowInterval
                    ? `${endpoint}${separator}interval=${interval}`
                    : endpoint;

                const response = await fetch(requestUrl, {
                    credentials: "include",
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error ?? "Failed to load individual;");
                }

                setEntries(Array.isArray(data) ? data : data ? [data] : []);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
            } finally {
                setLoading(false);
            }
        }

        loadIndividual();
    }, [endpoint, interval, allowInterval]);

    return (
        <section className="leaderboard">
            <div className="header">
                <h2>{title}</h2>

                {allowInterval && (
                    <div className="interval-buttons">
                        <button onClick={() => setInterval(StatsInterval.ONE_MONTH.queryParam)}>1m</button>
                        <button onClick={() => setInterval(StatsInterval.THREE_MONTHS.queryParam)}>3m</button>
                        <button onClick={() => setInterval(StatsInterval.SIX_MONTHS.queryParam)}>6m</button>
                        <button onClick={() => setInterval(StatsInterval.ONE_YEAR.queryParam)}>1y</button>
                        <button onClick={() => setInterval(StatsInterval.ALL.queryParam)}>All</button>
                    </div>
                )}
            </div>

            {loading && <p>Loading...</p>}
            {error && <p>{error}</p>}

            {!loading && !error && (
                <div className="body">
                    {entries.map((entry) => (
                        <div className="entry" key={entry.user_Id}>
                            <img
                                className="pfp"
                                src={entry.profile_Image_URL ?? "/default-pfp.jpg"}
                                alt={"/default-pfp.jpg"}
                            />
                            <div
                                className="name"
                                style={{ color: entry.chat_Color ?? "#000000" }}
                            >
                                {entry.user_Name}
                            </div>
                            <div className="bet">Bet {entry.bet_Amount} $TKS</div>
                            <div
                                className={`net ${entry.net_Change < 0 ? "negative" : entry.net_Change > 0 ? "positive" : ""}`}
                            >
                                {formatNet(entry.net_Change)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
