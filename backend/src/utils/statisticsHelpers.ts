import { Interval } from "../types/statistics.js";

export const LEADERBOARD_TIMEZONE = 'America/Chicago';
const monthStart = `date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE '${LEADERBOARD_TIMEZONE}')`;

export function parseInterval(value: string | null): Interval {
    if (
        value === "CURRENT_MONTH" ||
        value === "LAST_MONTH" ||
        value === "LAST_3_MONTHS" ||
        value === "LAST_6_MONTHS" ||
        value === "LAST_12_MONTHS" ||
        value === "ALL_TIME" ||
        value === "RECENT"
    ) {
        return value;
    }

    return "CURRENT_MONTH";
}


export function parseType(value: string | null): "win" | "loss" {
    if (value === "win" || value === "loss") {
        return value;
    }
    return "win";
}

export function getIntervalCondition(interval: Interval): string {
    switch (interval) {
        case "RECENT":
            return `AND p.id = (
                SELECT p2.id
                FROM predictions p2
                WHERE p2.roulette_prediction = true
                ORDER BY p2.start_time DESC
                LIMIT 1
            )`;

        case "CURRENT_MONTH":
            return `
                AND (p.start_time AT TIME ZONE '${LEADERBOARD_TIMEZONE}')
                    >= ${monthStart}
            `;

        case "LAST_MONTH":
            return `
                AND (p.start_time AT TIME ZONE '${LEADERBOARD_TIMEZONE}')
                    >= ${monthStart} - INTERVAL '1 month'
                AND (p.start_time AT TIME ZONE '${LEADERBOARD_TIMEZONE}')
                    < ${monthStart}
            `;

        case "LAST_3_MONTHS":
            return `
                AND (p.start_time AT TIME ZONE '${LEADERBOARD_TIMEZONE}')
                    >= ${monthStart} - INTERVAL '3 months'
            `;

        case "LAST_6_MONTHS":
            return `
                AND (p.start_time AT TIME ZONE '${LEADERBOARD_TIMEZONE}')
                    >= ${monthStart} - INTERVAL '6 months'
            `;

        case "LAST_12_MONTHS":
            return `
                AND (p.start_time AT TIME ZONE '${LEADERBOARD_TIMEZONE}')
                    >= ${monthStart} - INTERVAL '12 months'
            `;

        default:
            return "";
    }
}

export function getResultsIntervalCondition(interval: Interval): string {
    switch (interval) {
        case "CURRENT_MONTH":
            return `
                AND (results.result_time AT TIME ZONE '${LEADERBOARD_TIMEZONE}')
                    >= ${monthStart}
            `;

        case "LAST_MONTH":
            return `
                AND (results.result_time AT TIME ZONE '${LEADERBOARD_TIMEZONE}')
                    >= ${monthStart} - INTERVAL '1 month'
                AND (results.result_time AT TIME ZONE '${LEADERBOARD_TIMEZONE}')
                    < ${monthStart}
            `;

        case "LAST_3_MONTHS":
            return `
                AND (results.result_time AT TIME ZONE '${LEADERBOARD_TIMEZONE}')
                    >= ${monthStart} - INTERVAL '3 months'
            `;

        case "LAST_6_MONTHS":
            return `
                AND (results.result_time AT TIME ZONE '${LEADERBOARD_TIMEZONE}')
                    >= ${monthStart} - INTERVAL '6 months'
            `;

        case "LAST_12_MONTHS":
            return `
                AND (results.result_time AT TIME ZONE '${LEADERBOARD_TIMEZONE}')
                    >= ${monthStart} - INTERVAL '12 months'
            `;

        default:
            return "";
    }
}