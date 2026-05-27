import {IncomingMessage, ServerResponse} from "http";
import {getSingle, getLeaderboard, getIntervals} from "../services/statistics_queries.js";
import sendJson from "../utils/sendJson.js";
import { parseInterval } from "../utils/statisticsHelpers.js";
import { Analytics } from "../types/statistics.js";

export default async function statsRoutes(req: IncomingMessage, res: ServerResponse, url: URL): Promise<IncomingMessage | ServerResponse | void> {
    if (url.pathname.startsWith("/analytics/data")) {
        const limit = Number(url.searchParams.get("limit") ?? "10");
        const interval = parseInterval(url.searchParams.get("interval"));

        const result = {
            leaderboardEntries: {
                topWinners: await getLeaderboard(limit, interval, "win"),
                topLosers: await getLeaderboard(limit, interval, "loss"),
            },
            singleEntries: {
                topProfit: await getSingle(interval, "win"),
                topLost: await getSingle(interval, "loss"),
            }
        } as Analytics;

        return sendJson(res, 200, result);
    }

    if (url.pathname.startsWith("/analytics/intervals")) {
        const result = await getIntervals();

        return sendJson(res, 200, result);
    }

}
