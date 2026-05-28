import db from "./db.js";
import { Interval, PredictionEntry, UserEntry } from "../types/statistics.js";
import { getIntervalCondition } from "../utils/statisticsHelpers.js";

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

    const havingClause = type === "win"
        ? `HAVING SUM(${netChangeSql}) > 0`
        : `HAVING SUM(${netChangeSql}) < 0`;

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
        GROUP BY user_id, user_name
        ${havingClause}
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

    const { rows } = await db.query(query, [user_ids]);
      return rows.reduce((acc, row) => {
          acc[row.user_name] = row.profile_image_url;
          return acc;
      }, {} as Record<string, string>)
};

export async function saveUserProfile(user_name: string, profile_image_url: string): Promise<void> {
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

    await db.query(query);

    const { rows } = await db.query<PredictionEntry>(query);
    return rows;
}