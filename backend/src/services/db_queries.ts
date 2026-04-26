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

export async function checkForLockedRoulettePrediction(): Promise<string | null> {
    const query = `
        SELECT id
        FROM predictions
        WHERE prediction_status = 'locked' AND roulette_prediction = false
        AND start_time > NOW() - INTERVAL '2 hour'
    `;

    const result = await db.query(query);
    return result.rows.length > 0 ? result.rows[0].id : null;
}