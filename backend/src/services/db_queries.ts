import db from "./db.js";

export async function isPredictionRoulette(prediction_id: string) {
    const query = `
        SELECT roulette_prediction
        FROM predictions
        WHERE id = $1
    `;

    const result = await db.query(query, [prediction_id]);
    if (result.rows.length === 0) {
        throw new Error(`Prediction with id ${prediction_id} not found`);
    }
    return result.rows[0].roulette_prediction;
}

export async function checkForLockedPrediction(): Promise<number | null> {
  const query = `
    SELECT id
    FROM predictions
    WHERE prediction_status = 'locked'
      AND roulette_prediction = false
      AND start_time > NOW() - INTERVAL '2 hours'
    ORDER BY start_time DESC
    LIMIT 1
  `;

  const { rows } = await db.query(query);
  return rows.length ? rows[0].id : null;
}

export async function getUserSession(user_id: string): Promise<string | null> {
  const query = `
    SELECT session_id
    FROM user_sessions
    WHERE user_id = $1
  `;

  const { rows } = await db.query(query, [user_id]);
  return rows.length ? rows[0].session_id : null;
}



type Individual = {
    user_id: number;
    user_name: string;
    prediction_id: number;
    bet_amount: number;
    won_amount: number;
    net_change: number;
};
// Supported inputs for interval are {1m,3m,6m,1y,all,recent} and supported types for type are {w,l}
export async function getBiggestIndividual( interval: string,  type: 'w' | 'l' ): Promise<Individual | null> {
    let inter = '1 month';

    switch (interval) {
        case '1m': inter = '1 month'; break;
        case '3m': inter = '3 months'; break;
        case '6m': inter = '6 months'; break;
        case '1y': inter = '1 year'; break;
        case 'all': inter = ''; break;
        case 'recent': inter = ''; break;
        default: throw new Error(`Unrecognized interval: ${interval}`);
    }

    const orderDir = type === 'w' ? 'DESC' : 'ASC';

    let whereClause = '';

    if (interval === 'recent') {
        whereClause = `
            WHERE prediction_id = (
                SELECT id
                FROM predictions
                ORDER BY start_time DESC
                LIMIT 1
            )
        `;
    }
    else if (interval !== 'all') {
        whereClause = `
            WHERE result_time > NOW() - INTERVAL '${inter}'
        `;
    }

    const query = `
        SELECT user_id, user_name, prediction_id, bet_amount, won_amount, SUM(COALESCE(won_amount, 0) - bet_amount) AS net_change
        FROM results
        ${whereClause}
        ORDER BY net_change ${orderDir}
        LIMIT 1;
    `;

    const { rows } = await db.query<Individual>(query);
    return rows[0] ?? null;
}


type UserLeaders = {
    user_id: number;
    user_name: string;
    total_net: number;
    predictions_count: number;
};
// Supported inputs for interval are {1m,3m,6m,1y,all,recent} and supported types for type are {w,l}
export async function getTopLeaders( count: number,  interval: string,  type: 'w' | 'l' ): Promise<UserLeaders[]> {
    let inter = '1 month';

    switch (interval) {
        case '1m': inter = '1 month'; break;
        case '3m': inter = '3 months'; break;
        case '6m': inter = '6 months'; break;
        case '1y': inter = '1 year'; break;
        case 'all': inter = ''; break;
        case 'recent': inter = ''; break;
        default: throw new Error(`Unrecognized interval: ${interval}`);
    }

    const orderDir = type === 'w' ? 'DESC' : 'ASC';

    let whereClause = '';

    if (interval === 'recent') {
        whereClause = `
            WHERE prediction_id = (
                SELECT id
                FROM predictions
                ORDER BY start_time DESC
                LIMIT 1
            )
        `;
    }
    else if (interval !== 'all') {
        whereClause = `
            WHERE result_time > NOW() - INTERVAL '${inter}'
        `;
    }

    const query = `
        SELECT user_id, user_name, SUM(COALESCE(won_amount, 0) - bet_amount) AS total_net, COUNT(*) AS predictions_count
        FROM results 
            ${whereClause}
        GROUP BY user_id, user_name
        ORDER BY total_net ${orderDir}
        LIMIT $1;
    `;

    const { rows } = await db.query<UserLeaders>(query, [count]);
    return rows;
}
