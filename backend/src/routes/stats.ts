import {IncomingMessage, ServerResponse} from "http";
import {getSingles, getLeaderboard, getIntervals, getUserProfiles, getPredictionsForInterval} from "../services/statistics_queries.js";
import sendJson from "../utils/sendJson.js";
import { parseInterval } from "../utils/statisticsHelpers.js";
import { Analytics, Interval, type UserEntry} from "../types/statistics.js";
import { fetchUserProfile } from "../services/helix.js";

export default async function statsRoutes(req: IncomingMessage, res: ServerResponse, url: URL): Promise<IncomingMessage | ServerResponse | void> {
    if (url.pathname.startsWith("/analytics/data")) {
        const limit = Number(url.searchParams.get("limit") ?? "10");
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
            predictions: await getPredictionsForInterval(interval)
        } as Analytics;

        return sendJson(res, 200, result);
    }

    if (url.pathname.startsWith("/analytics/intervals")) {
        const result = await getIntervals();

        return sendJson(res, 200, result);
    }

}

function addMultipleProfileData(entries: UserEntry[]): Promise<UserEntry[]> {
    return fetchUserProfiles(entries.map(entry => entry.user_name)).then(profiles => {
        return entries.map(entry => {
            const profile = profiles.find(p => p.user_name === entry.user_name);
            if (profile) {
                return {
                    ...entry,
                    profile_image_url: profile.profile_image_url
                };
            }
            return entry;
        });
    });
}

async function fetchUserProfiles(userNames: string[]) {
    const savedProfiles = await getUserProfiles(userNames);

    return Promise.all(userNames.map(userName => {
        if (savedProfiles[userName]) {
            return {
                user_name: userName,
                profile_image_url: savedProfiles[userName]
            };
        }
        return fetchUserProfile(userName).then(profile => ({
            user_name: userName,
            profile_image_url: profile ? profile.profile_image_url : null
        }));
    }));
}
