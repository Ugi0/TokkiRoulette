import db from "./db.js";
import { UserLeaders, Individual, Interval } from "../types/statistics.js";

// Supported inputs for interval are {1m,3m,6m,1y,all,recent} and supported types for type are {w,l}
export async function getBiggestIndividual( interval: Interval,  type: 'w' | 'l' ): Promise<Individual | null> {
    const orderDir = type === 'w' ? 'DESC' : 'ASC';

    let whereClause = '';

    if (interval === Interval.RECENT.query_param) {
        whereClause = `
            WHERE prediction_id = (
                SELECT id
                FROM predictions
                ORDER BY start_time DESC
                LIMIT 1
            )
        `;
    }
    else if (interval !== Interval.ALL.query_param) {
        whereClause = `
            WHERE result_time > NOW() - INTERVAL '${Interval[interval].query_param}'
        `;
    }

    const query = `
        SELECT user_id, user_name, prediction_id, bet_amount, won_amount, SUM(COALESCE(won_amount, 0) - bet_amount) AS net_change
        FROM results
        ${whereClause}
        AND roulette_prediction = true
        ORDER BY net_change ${orderDir}
        LIMIT 1;
    `;

    const { rows } = await db.query<Individual>(query);
    return rows[0] ?? null;
}

// Supported inputs for interval are {1m,3m,6m,1y,all,recent} and supported types for type are {w,l}
export async function getTopLeaders( count: number,  interval: Interval,  type: 'w' | 'l' ): Promise<UserLeaders[]> {
    const orderDir = type === 'w' ? 'DESC' : 'ASC';

    let whereClause = '';

    if (interval === Interval.RECENT.query_param) {
        whereClause = `
            WHERE prediction_id = (
                SELECT id
                FROM predictions
                ORDER BY start_time DESC
                LIMIT 1
            )
        `;
    }
    else if (interval !== Interval.ALL.query_param) {
        whereClause = `
            WHERE result_time > NOW() - INTERVAL '${Interval[interval].query_param}'
        `;
    }

    const query = `
        SELECT user_id, user_name, SUM(COALESCE(won_amount, 0) - bet_amount) AS total_net, COUNT(*) AS predictions_count
        FROM results 
            ${whereClause}
        AND roulette_prediction = true
        GROUP BY user_id, user_name
        ORDER BY total_net ${orderDir}
        LIMIT $1;
    `;

    const { rows } = await db.query<UserLeaders>(query, [count]);
    return rows;
}
