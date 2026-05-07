import db from "./db.js";
import { UserLeaders, Individual, Interval } from "../types/statistics.js";

const netChangeSql = "COALESCE(won_amount, -bet_amount)";

export function parseInterval(value: string | null): Interval {
    if (
        value === "ONE_MONTH" ||
        value === "THREE_MONTHS" ||
        value === "SIX_MONTHS" ||
        value === "ONE_YEAR" ||
        value === "ALL" ||
        value === "RECENT"
    ) {
        return value;
    }

    return "ONE_MONTH";
}


export function parseType(value: string | null): "w" | "l" {
    if (value === "w" || value === "l") {
        return value;
    }
    return 'w';
}

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


// Supported inputs for interval are {1m,3m,6m,1y,all,recent} and supported types for type are {w,l}
export async function getSingle(interval: Interval, type: 'w' | 'l' ): Promise<Individual | null> {
    const orderDir = type === 'w' ? 'DESC' : 'ASC';

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
        SELECT user_id, user_name, prediction_id, bet_amount, won_amount, ${netChangeSql} AS net_change
        FROM results
        ${whereClause}
        ORDER BY net_change ${orderDir}
        LIMIT 1;
    `;

    const { rows } = await db.query<Individual>(query);
    return rows[0] ?? null;
}

// Supported inputs for interval are {1m,3m,6m,1y,all,recent} and supported types for type are {w,l}
export async function getLeaderboard(count: number, interval: Interval, type: 'w' | 'l' ): Promise<UserLeaders[]> {
    const orderDir = type === 'w' ? 'DESC' : 'ASC';

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
        ORDER BY total_net ${orderDir}
        LIMIT $1;
    `;

    const { rows } = await db.query<UserLeaders>(query, [count]);
    return rows;
}
