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

function toNumber(value: number | string | undefined): number {
    return Number(value ?? 0);
}


function intervalLabel(value: StatsInterval): string {
    switch (value) {
        case "RECENT":
            return "Recent";
        case "ONE_MONTH":
            return "1 Month";
        case "THREE_MONTHS":
            return "3 Months";
        case "SIX_MONTHS":
            return "6 Months";
        case "ONE_YEAR":
            return "1 Year";
        case "ALL":
            return "All Time";
    }
}


export default function Leaderboard({
    title,
    endpoint,
}: LeaderboardProps) {
    const [interval, setInterval] = useState<StatsInterval>(
        StatsInterval.RECENT.queryParam
    );
    const [availableIntervals, setAvailableIntervals] = useState<StatsInterval[]>([])
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadIntervals() {
            const response = await fetch("/api/analytics/intervals");
            const data = await response.json();
            setAvailableIntervals(data);
        }

        loadIntervals();

        async function loadLeaders() {
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
    }, [endpoint, interval]);

    return (
        <section className="leaderboard">
            <div className="header">
                <h2>{title}</h2>
                    <div className="interval-buttons">
                        {availableIntervals.map((value) => (
                            <button key={value} onClick={() => setInterval(value)}>
                                {intervalLabel(value)}
                            </button>
                        ))}
                    </div>
            </div>

            {loading && <p>Loading...</p>}
            {error && <p>{error}</p>}

            {!loading && !error && (
                <div className="body">
                    {entries.map((entry) => {
                        const totalNet = toNumber(entry.total_net);
                        const betAmount = toNumber(entry.bet_amount);

                        return (
                        <div className="entry" key={entry.user_id}>
                            <img
                                className="pfp"
                                src={entry.profile_image_url ?? "/default-pfp.jpg"}
                                alt={"/default-pfp.jpg"}
                            />
                            <div
                                className="name"
                                style={{ color: entry.chat_color ?? "#000000" }}
                            >
                                {entry.user_name}
                            </div>
                            <div className="bet">Bet {betAmount} $TKS</div>
                            <div
                                className={`net ${totalNet < 0 ? "negative" : totalNet > 0 ? "positive" : ""}`}
                            >
                                {formatNet(totalNet)}
                            </div>
                        </div>
                    )})}
                </div>
            )}
        </section>
    );
}
