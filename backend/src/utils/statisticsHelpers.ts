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