import db from "./db.js";
import { Interval, PredictionDetails, PredictionEntry, UserEntry, WinRatioEntry } from "../types/statistics.js";
import { getIntervalCondition, getResultsIntervalCondition } from "../utils/statisticsHelpers.js";
import { fetchUserProfiles } from "../routes/stats.js";

const netChangeSql = "COALESCE(won_amount, -bet_amount)";

export async function getIntervals(): Promise<Interval[]> {
    const query = `
        SELECT MIN(result_time) AS oldest_result_time
        FROM results
        WHERE roulette_prediction = true;
    `;

    const { rows } = await db.query<{ oldest_result_time: Date | string | null }>(query);
    const oldestDate = rows[0]?.oldest_result_time;

    if (!oldestDate) {
        return ["RECENT", "ALL"];
    }

    const oldestTime = new Date(oldestDate).getTime();
    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const elapsedDays = Math.floor((Date.now() - oldestTime) / millisecondsPerDay);

    const intervals: Interval[] = ["RECENT"];

    if (elapsedDays >= 30) {
        intervals.push("ONE_MONTH");
    }

    if (elapsedDays >= 90) {
        intervals.push("THREE_MONTHS");
    }

    if (elapsedDays >= 180) {
        intervals.push("SIX_MONTHS");
    }

    if (elapsedDays >= 365) {
        intervals.push("ONE_YEAR");
    }

    intervals.push("ALL");

    return intervals;
}


/**
 * Supported inputs for interval are {1m,3m,6m,1y,all,recent} and supported types for type are {win,loss}
 * @param interval 
 * @param type 
 * @returns 
 */
export async function getSingles(interval: Interval, type: "win" | "loss" ): Promise<UserEntry[]> {
    const orderDir = type === "win" ? 'DESC' : 'ASC';

    let whereClause = 'WHERE roulette_prediction = true';

    if (interval === Interval.RECENT.query_param) {
        return [];
    }

    else if (interval !== Interval.ALL.query_param) {
        whereClause = `
            WHERE roulette_prediction = true
            AND result_time > NOW() - INTERVAL '${Interval[interval].query_param}'
        `;
    }

    const query = `
        SELECT 
            user_id, 
            user_name, 
            prediction_id,
            bet_amount, 
            won_amount, 
            ${netChangeSql} AS net_change, 
            result_time as bet_time
        FROM results
        ${whereClause}
        ORDER BY net_change ${orderDir}
        LIMIT 10;
    `;

    const { rows } = await db.query<UserEntry>(query);
    return rows;
}

/**
 *  Supported inputs for interval are {1m,3m,6m,1y,all,recent} and supported types for type are {win,loss}
 * @param count 
 * @param interval 
 * @param type 
 * @returns 
 */
export async function getLeaderboard(count: number, interval: Interval, type: "win" | "loss" ): Promise<UserEntry[]> {
    const orderDir = type === "win" ? 'DESC' : 'ASC';

    let filterClause = ""
    if (interval === Interval.RECENT.query_param) {
        filterClause = type === "win"
            ? `AND won_amount IS NOT NULL`
            : `AND won_amount IS NULL`;
    } else {
            filterClause = type === "win"
            ? `HAVING SUM(${netChangeSql}) > 0`
            : `HAVING SUM(${netChangeSql}) < 0`;
    }

    let whereClause = 'WHERE roulette_prediction = true';

    if (interval === Interval.RECENT.query_param) {
        whereClause = `
            WHERE roulette_prediction = true
            AND prediction_id = (
                SELECT prediction_id
                FROM results
                WHERE roulette_prediction = true
                ORDER BY result_time DESC
                LIMIT 1
            )
        `;
    }
    else if (interval !== Interval.ALL.query_param) {
        whereClause = `
            WHERE roulette_prediction = true
            AND result_time > NOW() - INTERVAL '${Interval[interval].query_param}'
        `;
    }

    const query = `
        SELECT
            user_id,
            user_name,
            SUM(bet_amount) AS bet_amount,
            SUM(${netChangeSql}) AS total_net,
            COUNT(*) AS predictions_count
        FROM results 
            ${whereClause}
            ${interval === Interval.RECENT.query_param ? filterClause : ''}
        GROUP BY user_id, user_name
        ${interval !== Interval.RECENT.query_param ? `${filterClause}` : ''}
        ORDER BY total_net ${orderDir}
        LIMIT $1;
    `;

    const { rows } = await db.query<UserEntry>(query, [count]);
    return rows;
}

export async function getUserProfiles(user_ids: string[]): Promise<Record<string, string>> {
    if (user_ids.length === 0) {
        return {};
    }

    const query = `
        SELECT user_name, profile_image_url
        FROM participants
        WHERE user_name = ANY($1)
    `;

    const { rows } = await db.query(query, [user_ids.filter((name): name is string => !!name)]);
      return rows.reduce((acc, row) => {
          acc[row.user_name] = row.profile_image_url;
          return acc;
      }, {} as Record<string, string>)
};

export async function saveUserProfile(user_name: string, profile_image_url: string | null): Promise<void> {
    const query = `
        INSERT INTO participants (user_name, profile_image_url)
        VALUES ($1, $2)
        ON CONFLICT (user_name) DO UPDATE SET profile_image_url = EXCLUDED.profile_image_url;
    `;

    await db.query(query, [user_name, profile_image_url]);
}

export async function getPredictionsForInterval(interval: Interval): Promise<PredictionEntry[]> {
    
    const query = `
        SELECT 
            DISTINCT p.id AS prediction_id, 
            p.title AS prediction_title,
            p.start_time as prediction_start_time
        FROM predictions p
        WHERE p.roulette_prediction = true
        ${getIntervalCondition(interval)}
        ORDER BY p.start_time DESC;
    `;

    const { rows } = await db.query<PredictionEntry>(query);
    return rows;
}

export async function getWinRatios(interval: Interval): Promise<{ highest: WinRatioEntry[]; lowest: WinRatioEntry[] }> {
    if (interval === "RECENT") {
        return { highest: [], lowest: [] };
    }

    const query = `
        SELECT 
            user_id,
            user_name,
            COUNT(*) AS total_predictions,
            SUM(CASE WHEN won_amount IS NOT NULL THEN 1 ELSE 0 END) AS won_predictions,
            (SUM(CASE WHEN won_amount IS NOT NULL THEN 1 ELSE 0 END)::float / COUNT(*)) * 100 AS win_percentage
        FROM results
        WHERE roulette_prediction = true
        ${getResultsIntervalCondition(interval)}
        GROUP BY user_id, user_name
        HAVING COUNT(*) >= 3
        ORDER BY win_percentage DESC;
    `;
    
    const { rows } = await db.query<WinRatioEntry>(query);

    const highest = rows.slice(0, 10);
    const lowest = rows.slice(-10).reverse();

    return { highest, lowest };
}

export async function loadPredictionDetails(predictionId: string): Promise<PredictionDetails | null> {
    const query = `
        SELECT
            p.id AS prediction_id,
            p.title AS prediction_title,
            p.start_time AS prediction_start_time,

            o.title AS option_title,
            (o.option_id = po.winning_option_id) AS won,

            r.user_id,
            r.user_name,
            r.bet_amount,
            r.won_amount,
            r.result_time AS bet_time

        FROM predictions p

        JOIN options o 
            ON o.prediction_id = p.id

        LEFT JOIN votes v 
            ON v.prediction_id = p.id 
            AND v.option_id = o.option_id

        LEFT JOIN results r 
            ON r.prediction_id = v.prediction_id 
            AND r.user_id = v.user_id

        LEFT JOIN prediction_outcomes po
            ON po.prediction_id = p.id

        WHERE p.id = $1;
    `;

    const { rows } = await db.query(query, [predictionId]);

    if (rows.length === 0) {
        return null;
    }

    const predictionDetails: PredictionDetails = {
        prediction_id: rows[0].prediction_id,
        prediction_title: rows[0].prediction_title,
        prediction_start_time: rows[0].prediction_start_time,
        options: []
    };

    const optionMap: Record<string, number> = {};

    rows.forEach(row => {
        if (optionMap[row.option_title] === undefined) {
            optionMap[row.option_title] = predictionDetails.options.length;
            predictionDetails.options.push({
                title: row.option_title,
                won: !!row.won,
                votes: []
            });
        }

        const optionIndex = optionMap[row.option_title];

        if (row.user_id !== null && row.user_name !== null) {
            predictionDetails.options[optionIndex].votes.push({
                prediction_id: predictionId,
                user_id: row.user_id,
                user_name: row.user_name,
                bet_amount: row.bet_amount,
                won_amount: row.won_amount,
                bet_time: row.bet_time,
                net_change: "",
                total_net: "",
                predictions_count: ""
            });
        }
    });

    await Promise.all(
        predictionDetails.options.map(async option => {
            const profilesArray = await fetchUserProfiles(
                option.votes.map(vote => vote.user_name)
            );

            const profiles: Record<string, string | null> = {};
            profilesArray.forEach(p => {
                profiles[p.user_name] = p.profile_image_url;
            });

            option.votes = option.votes.map(vote => ({
                ...vote,
                profile_image_url: profiles[vote.user_name] || null
            }));
        })
    );

    return predictionDetails;
}