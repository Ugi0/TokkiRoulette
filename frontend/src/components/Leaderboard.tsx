import { useEffect, useState } from "react";

import { StatsInterval, type LeaderboardEntry } from "../types/analytics.ts";
import "./Leaderboard.css";


type LeaderboardProps = {
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

export default function Leaderboard({
    title,
    endpoint,
    allowInterval = false,
}: LeaderboardProps) {
    const [interval, setInterval] = useState<StatsInterval>(
        StatsInterval.ALL.queryParam
    );
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadLeaders() {
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
                    throw new Error(data.error ?? "Failed to load leaders");
                }

                setEntries(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
            } finally {
                setLoading(false);
            }
        }

        loadLeaders();
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
                                className={`net ${entry.total_Net < 0 ? "negative" : entry.total_Net > 0 ? "positive" : ""}`}
                            >
                                {formatNet(entry.total_Net)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
