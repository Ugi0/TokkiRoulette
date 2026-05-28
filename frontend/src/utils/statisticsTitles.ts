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