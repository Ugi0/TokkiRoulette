import {IncomingMessage, ServerResponse} from "http";
import {getBiggestIndividual, getTopLeaders} from "../services/statistics_queries.js";
import sendJson from "../utils/sendJson.js";
import {parseInterval} from "../services/statistics_queries.js";
import {parseType} from "../services/statistics_queries.js";

export default async function statsRoutes(
    req: IncomingMessage,
    res: ServerResponse,
    url: URL
): Promise<IncomingMessage | ServerResponse | void> {
    if (url.pathname.startsWith("/analytics/leaderboard")) {
        // call single biggest win/loss function
        const limit = Number(url.searchParams.get("limit") ?? "10");
        const interval = parseInterval(url.searchParams.get("interval"));
        const type = parseType(url.searchParams.get("type"));


        const result = await getTopLeaders(limit, interval, type);

        return sendJson(res, 200, result);
    }


    if (url.pathname.startsWith("/analytics/recent")) {
        return sendJson(res, 501, { error: "Recent analytics not yet implemented" });
    }



    if (url.pathname.startsWith("/analytics/single")) {
        // call single biggest win/loss function

        const interval = parseInterval(url.searchParams.get("interval"));
        const type = parseType(url.searchParams.get("type"));


        const result = await getBiggestIndividual(interval, type);

        return sendJson(res, 200, result);
    }

}

// Top losses, Top Winners
/*

I need to create a function that can get called with a request that asks for one of the databases sorts,
along with a time period like all time, or last month, it should then return a list of the users in sorted order
corresponding to the database type requested

*/
