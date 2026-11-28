import {IncomingMessage, ServerResponse} from "http";
import {getSingles, getLeaderboard, getIntervals, getPredictionsForInterval, getWinRatios, loadPredictionDetails} from "../services/statistics_queries.js";
import sendJson from "../utils/sendJson.js";
import { parseInterval } from "../utils/statisticsHelpers.js";
import { Analytics, Interval, WinRatioEntry, type UserEntry} from "../types/statistics.js";
import { fetchUserProfiles } from "../services/profiles.js";

export default async function statsRoutes(req: IncomingMessage, res: ServerResponse, url: URL): Promise<IncomingMessage | ServerResponse | void> {
    if (url.pathname.startsWith("/analytics/data")) {
        const requestedLimit = Number.parseInt(url.searchParams.get("limit") ?? "10", 10);
        const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 10;
        const interval: Interval = parseInterval(url.searchParams.get("interval"));

        const result = {
            leaderboardEntries: {
                topWinners: await addMultipleProfileData(
                    await getLeaderboard(limit, interval, "win")
                ),
                topLosers: await addMultipleProfileData(
                    await getLeaderboard(limit, interval, "loss")
                ),
            },
            singleEntries: {
                topProfit: await addMultipleProfileData(
                    await getSingles(interval, "win")
                ),
                topLost: await addMultipleProfileData(
                    await getSingles(interval, "loss")
                ),
            },
            interval,
            predictions: await getPredictionsForInterval(interval),
            winRatios: await addMultipleProfileDataToWinRatios(await getWinRatios(interval))
        } as Analytics;

        return sendJson(res, 200, result);
    }

    if (url.pathname.startsWith("/analytics/intervals")) {
        const result = await getIntervals();

        return sendJson(res, 200, result);
    }

    if (url.pathname.startsWith("/analytics/prediction/")) {
        const predictionId = decodeURIComponent(url.pathname.split("/").pop() ?? "");
        if (!predictionId) {
            return sendJson(res, 400, { error: "Missing prediction id" });
        }
        const result = await loadPredictionDetails(predictionId);

        return sendJson(res, 200, result);
    }

    return sendJson(res, 404, { error: "Not found" });
}

function addMultipleProfileDataToWinRatios(
    entries: { highest: WinRatioEntry[]; lowest: WinRatioEntry[] }
): Promise<{ highest: WinRatioEntry[]; lowest: WinRatioEntry[] }> {
    return Promise.all([
        fetchUserProfiles(
            entries.highest.map(e => ({ user_id: String(e.user_id), user_name: e.user_name }))
        ).then(profiles => {
            return entries.highest.map(entry => {
                const profile = profiles.find(p => p.user_id === String(entry.user_id));
                return { ...entry, profile_image_url: profile?.profile_image_url ?? null };
            });
        }),
        fetchUserProfiles(
            entries.lowest.map(e => ({ user_id: String(e.user_id), user_name: e.user_name }))
        ).then(profiles => {
            return entries.lowest.map(entry => {
                const profile = profiles.find(p => p.user_id === String(entry.user_id));
                return { ...entry, profile_image_url: profile?.profile_image_url ?? null };
            });
        })
    ]).then(([highest, lowest]) => ({ highest, lowest }));
}

function addMultipleProfileData(entries: UserEntry[]): Promise<UserEntry[]> {
    return fetchUserProfiles(
        entries.map(e => ({ user_id: String(e.user_id), user_name: e.user_name }))
    ).then(profiles => {
        return entries.map(entry => {
            const profile = profiles.find(p => p.user_id === String(entry.user_id));
            return {
                ...entry,
                user_name: profile?.user_name ?? entry.user_name,
                profile_image_url: profile?.profile_image_url ?? null
            };
        });
    });
}
