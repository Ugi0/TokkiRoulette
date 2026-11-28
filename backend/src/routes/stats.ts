import {IncomingMessage, ServerResponse} from "http";
import {getSingles, getLeaderboard, getIntervals, getPredictionsForInterval, getWinRatios, loadPredictionDetails} from "../services/statistics_queries.js";
import sendJson from "../utils/sendJson.js";
import { parseInterval } from "../utils/statisticsHelpers.js";
import { Analytics, Interval, WinRatioEntry, type UserEntry} from "../types/statistics.js";
import { fetchUserProfiles, refreshUserProfile } from "../services/profiles.js";
import { sessionExists } from "../services/db_queries.js";
import { parseCookies } from "../utils/sessionCookie.js";

// Per-user cooldown for manual profile refreshes, so the button can't be used to spam Twitch.
const REFRESH_COOLDOWN_MS = 30_000;
const lastRefreshAt = new Map<string, number>();

export default async function statsRoutes(req: IncomingMessage, res: ServerResponse, url: URL): Promise<IncomingMessage | ServerResponse | void> {
    const refreshMatch = url.pathname.match(/^\/analytics\/profile\/(\d+)\/refresh$/);
    if (refreshMatch) {
        return refreshProfileRoute(req, res, refreshMatch[1]);
    }

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

async function refreshProfileRoute(req: IncomingMessage, res: ServerResponse, userId: string) {
    if (req.method !== "POST") {
        return sendJson(res, 405, { error: "Method not allowed" });
    }

    const sessionId = parseCookies(req).session_id;
    if (!sessionId || !(await sessionExists(sessionId))) {
        return sendJson(res, 401, { error: "Log in to refresh profiles" });
    }

    const now = Date.now();
    const last = lastRefreshAt.get(userId) ?? 0;
    if (now - last < REFRESH_COOLDOWN_MS) {
        const retryAfter = Math.ceil((REFRESH_COOLDOWN_MS - (now - last)) / 1000);
        res.setHeader("Retry-After", String(retryAfter));
        return sendJson(res, 429, { error: `This profile was just refreshed. Try again in ${retryAfter}s.` });
    }
    lastRefreshAt.set(userId, now);

    for (const [id, at] of lastRefreshAt) {
        if (now - at > REFRESH_COOLDOWN_MS) lastRefreshAt.delete(id);
    }

    try {
        const profile = await refreshUserProfile(userId);
        if (!profile) {
            return sendJson(res, 404, { error: "Twitch doesn't know this user anymore (the account may be deleted)." });
        }
        return sendJson(res, 200, profile);
    } catch (err) {
        console.error("Profile refresh failed:", err);
        lastRefreshAt.delete(userId);
        return sendJson(res, 502, { error: "Couldn't reach Twitch. Try again later." });
    }
}
