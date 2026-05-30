import { toNumber } from "./statisticsCommon";

function formatInterval(interval: string): string {
    switch (interval) {
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
        case "ALL":
            return "Biggest Single Loss ($TKS)";
        default:
            return `Biggest Single Loss in the last ${formatInterval(interval)}`;
    }
}

export function winnersSingleTitle(interval: string): string {
    switch (interval) {
        case "RECENT":
            throw new Error("This should never be shown for recent interval");
        case "ALL":
            return "Biggest Single Win ($TKS)";
        default:
            return `Biggest Single Win in the last ${formatInterval(interval)}`;
    }
}

export function losersTotalTitle(interval: string): string {
    switch (interval) {
        case "RECENT":
            return "Sore Losers";
        case "ALL":
            return "Top Total Losers ($TKS)";
        default:
            return `Top Total Losers in the last ${formatInterval(interval)}`;
    }
}

export function winnersTotalTitle(interval: string): string {
    switch (interval) {
        case "RECENT":
            return "Lucky Winners";
        case "ALL":
            return "Top Total Winners ($TKS)";
        default:
            return `Top Total Winners in the last ${formatInterval(interval)}`;
    }
}

export function LosersTotalBetTitle(betAmount: number | string, wonAmount: number | string, interval: string): string {
    if (interval == "RECENT" && toNumber(wonAmount) < 0) {
        return "";
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