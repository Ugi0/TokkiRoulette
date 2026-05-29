import { toNumber } from "./statisticsCommon";

export function losersSingleTitle(interval: string): string {
    switch (interval) {
        case "RECENT":
            throw new Error("This should never be shown for recent interval");
        case "ALL":
            return "Biggest Single Loss ($TKS)";
        default:
            return `Biggest Losers in the Last ${interval.replace("_", " ")}`;
    }
}

export function winnersSingleTitle(interval: string): string {
    switch (interval) {
        case "RECENT":
            throw new Error("This should never be shown for recent interval");
        case "ALL":
            return "Biggest Single Win ($TKS)";
        default:
            return `Biggest Winners in the Last ${interval.replace("_", " ")}`;
    }
}

export function losersTotalTitle(interval: string): string {
    switch (interval) {
        case "RECENT":
            return "Sore Losers";
        case "ALL":
            return "Top Total Losers ($TKS)";
        default:
            return `Top Losers in the Last ${interval.replace("_", " ")}`;
    }
}

export function winnersTotalTitle(interval: string): string {
    switch (interval) {
        case "RECENT":
            return "Lucky Winners";
        case "ALL":
            return "Top Total Winners ($TKS)";
        default:
            return `Top Winners in the Last ${interval.replace("_", " ")}`;
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