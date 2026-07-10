import { toNumber } from "./statisticsCommon";

function formatInterval(interval: string): string {
    switch (interval) {
        case "CURRENT_MONTH":
            return "current month";
        case "LAST_MONTH":
            return "previous month";
        case "LAST_3_MONTHS":
            return "last 3 months";
        case "LAST_6_MONTHS":
            return "last 6 months";
        case "LAST_12_MONTHS":
            return "last 12 months";
        case "ALL_TIME":
            return "All Time";
        case "RECENT":
            return "Recent";
        default:
            return interval;
    }
}

export function losersSingleTitle(interval: string): string {
    switch (interval) {
        case "RECENT":
            throw new Error("This should never be shown for recent interval");
        case "ALL_TIME":
            return "Biggest Single Loss";
        default:
            return `Biggest Single Loss in the ${formatInterval(interval)}`;
    }
}

export function winnersSingleTitle(interval: string): string {
    switch (interval) {
        case "RECENT":
            throw new Error("This should never be shown for recent interval");
        case "ALL_TIME":
            return "Biggest Single Win";
        default:
            return `Biggest Single Win in the ${formatInterval(interval)}`;
    }
}

export function losersTotalTitle(interval: string): string {
    switch (interval) {
        case "RECENT":
            return "Sore Losers";
        case "ALL_TIME":
            return "Top Total Losers";
        default:
            return `Top Total Losers in the ${formatInterval(interval)}`;
    }
}

export function winnersTotalTitle(interval: string): string {
    switch (interval) {
        case "RECENT":
            return "Lucky Winners";
        case "ALL_TIME":
            return "Top Total Winners";
        default:
            return `Top Total Winners in the ${formatInterval(interval)}`;
    }
}

export function LosersTotalBetTitle(betAmount: number | string, wonAmount: number | string, interval: string): string {
    if (interval == "RECENT") {
        if (toNumber(wonAmount) < 0) {
            return "";
        }

        return `Bet ${betAmount}`
    }

    return `Bet total ${betAmount}`
}

const SPECIAL_ORDER = [
    "RED",
    "BLACK",
    "GREEN",
    "1st 12",
    "2nd 12",
    "3rd 12"
];

export function sortPredictionOptions(a: { title: string }, b: { title: string }) {
    const aIndex = SPECIAL_ORDER.indexOf(a.title);
    const bIndex = SPECIAL_ORDER.indexOf(b.title);

    const aIsSpecial = aIndex !== -1;
    const bIsSpecial = bIndex !== -1;

    if (aIsSpecial && bIsSpecial) {
        return aIndex - bIndex;
    }

    if (aIsSpecial) return -1;
    if (bIsSpecial) return 1;

    return a.title.localeCompare(b.title);
}