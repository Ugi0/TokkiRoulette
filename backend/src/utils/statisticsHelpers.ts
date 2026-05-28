import { Interval } from "../types/statistics.js";

export function parseInterval(value: string | null): Interval {
    if (
        value === "ONE_MONTH" ||
        value === "THREE_MONTHS" ||
        value === "SIX_MONTHS" ||
        value === "ONE_YEAR" ||
        value === "ALL" ||
        value === "RECENT"
    ) {
        return value;
    }

    return "ONE_MONTH";
}


export function parseType(value: string | null): "win" | "loss" {
    if (value === "win" || value === "loss") {
        return value;
    }
    return "win";
}

export function getIntervalCondition(interval: Interval): string {
    if (interval === "RECENT") {
        return `AND p.id = (
            SELECT p2.id
            FROM predictions p2
            WHERE p2.roulette_prediction = true
            ORDER BY p2.start_time DESC
            LIMIT 1
        )`;
    }
    if (interval === "ALL") {
        return "";
    }
    return `AND p.start_time > NOW() - INTERVAL '${Interval[interval].query_param}'`;
}