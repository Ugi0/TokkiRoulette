import db from "./db.js";
import { Interval, PredictionDetails, PredictionEntry, UserEntry, WinRatioEntry } from "../types/statistics.js";
import { getIntervalCondition, getResultsIntervalCondition } from "../utils/statisticsHelpers.js";
import { fetchUserProfiles } from "./profiles.js";

const netChangeSql = "COALESCE(r.won_amount, -r.bet_amount)";

export async function getIntervals(): Promise<Interval[]> {
    const query = `
        SELECT MIN(r.result_time) AS oldest_result_time
        FROM results AS r
        WHERE r.roulette_prediction = true;
    `;

    const { rows } = await db.query<{
        oldest_result_time: Date | string | null;
    }>(query);

    const oldestDate = rows[0]?.oldest_result_time;

    if (!oldestDate) {
        return ["RECENT", "ALL_TIME"];
    }

    const oldest = new Date(oldestDate);

    const startOfCurrentMonth = new Date();
    startOfCurrentMonth.setDate(1);
    startOfCurrentMonth.setHours(0, 0, 0, 0);

    const intervals: Interval[] = ["RECENT"];

    intervals.push("CURRENT_MONTH");

    const startOfLastMonth = new Date(startOfCurrentMonth);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

    if (oldest < startOfCurrentMonth) {
        intervals.push("LAST_MONTH");
    }

    const startOf3Months = new Date(startOfCurrentMonth);
    startOf3Months.setMonth(startOf3Months.getMonth() - 3);

    if (oldest < startOf3Months) {
        intervals.push("LAST_3_MONTHS");
    }

    const startOf6Months = new Date(startOfCurrentMonth);
    startOf6Months.setMonth(startOf6Months.getMonth() - 6);

    if (oldest < startOf6Months) {
        intervals.push("LAST_6_MONTHS");
    }

    const startOf12Months = new Date(startOfCurrentMonth);
    startOf12Months.setMonth(startOf12Months.getMonth() - 12);

    if (oldest < startOf12Months) {
        intervals.push("LAST_12_MONTHS");
    }

    intervals.push("ALL_TIME");

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

    if (interval === "RECENT") {
        return [];
    }

    const whereClause = `
        WHERE r.roulette_prediction = true
        ${getResultsIntervalCondition(interval)}
    `;

    const query = `
        SELECT 
            r.user_id, 
            p.user_name, 
            r.prediction_id,
            r.bet_amount, 
            r.won_amount, 
            ${netChangeSql} AS net_change, 
            r.result_time as bet_time
        FROM results AS r
        LEFT JOIN PARTICIPANTS AS p ON r.user_id = p.user_id
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
    if (interval === "RECENT") {
        filterClause = type === "win"
            ? `AND won_amount IS NOT NULL`
            : `AND won_amount IS NULL`;
    } else {
            filterClause = type === "win"
            ? `HAVING SUM(${netChangeSql}) > 0`
            : `HAVING SUM(${netChangeSql}) < 0`;
    }

    const whereClause = interval === "RECENT"
        ? `
            WHERE r.roulette_prediction = true
            AND r.prediction_id = (
                SELECT prediction_id
                FROM results
                WHERE roulette_prediction = true
                ORDER BY result_time DESC
                LIMIT 1
            )
        `
        : `
            WHERE r.roulette_prediction = true
            ${getResultsIntervalCondition(interval)}
        `;

    const query = `
        SELECT
            r.user_id,
            p.user_name,
            SUM(r.bet_amount) AS bet_amount,
            SUM(${netChangeSql}) AS total_net,
            COUNT(*) AS predictions_count
        FROM results AS r
        LEFT JOIN PARTICIPANTS AS p ON r.user_id = p.user_id
            ${whereClause}
            ${interval === "RECENT" ? filterClause : ''}
        GROUP BY r.user_id, p.user_name
        ${interval !== "RECENT" ? `${filterClause}` : ''}
        ORDER BY total_net ${orderDir}
        LIMIT $1;
    `;

    const { rows } = await db.query<UserEntry>(query, [count]);
    return rows;
}

export async function getParticipantsByIds(
    user_ids: string[]
): Promise<Map<string, { user_name: string; profile_image_url: string | null }>> {
    const result = new Map<string, { user_name: string; profile_image_url: string | null }>();
    if (user_ids.length === 0) {
        return result;
    }

    const { rows } = await db.query(
        `SELECT user_id::text AS user_id, user_name, profile_image_url
         FROM participants
         WHERE user_id = ANY($1::int[])`,
        [user_ids]
    );

    for (const row of rows) {
        result.set(row.user_id, { user_name: row.user_name, profile_image_url: row.profile_image_url });
    }
    return result;
}

export async function saveUserProfile(user_id: string, user_name: string, profile_image_url: string | null): Promise<void> {
    const query = `
        INSERT INTO participants (user_id, user_name, profile_image_url)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id) DO UPDATE 
        SET user_name = EXCLUDED.user_name,
            profile_image_url = EXCLUDED.profile_image_url;
    `;
    await db.query(query, [user_id, user_name, profile_image_url]);
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
            r.user_id,
            p.user_name,
            COUNT(*) AS total_predictions,
            SUM(CASE WHEN r.won_amount IS NOT NULL THEN 1 ELSE 0 END) AS won_predictions,
            (SUM(CASE WHEN r.won_amount IS NOT NULL THEN 1 ELSE 0 END)::float / COUNT(*)) * 100 AS win_percentage
        FROM results AS r
        INNER JOIN participants p ON r.user_id = p.user_id
        WHERE r.roulette_prediction = true
        ${getResultsIntervalCondition(interval)}
        GROUP BY r.user_id, p.user_name
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
            par.user_name,
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

        LEFT JOIN participants AS par
            ON par.user_id = r.user_id

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

        if (row.user_id !== null) {
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
                option.votes.map(vote => ({ user_id: String(vote.user_id), user_name: vote.user_name }))
            );

            const profiles = new Map(profilesArray.map(p => [p.user_id, p]));

            option.votes = option.votes.map(vote => {
                const profile = profiles.get(String(vote.user_id));
                return {
                    ...vote,
                    user_name: profile?.user_name ?? vote.user_name,
                    profile_image_url: profile?.profile_image_url ?? null
                };
            });
        })
    );

    return predictionDetails;
}