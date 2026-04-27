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

export async function checkForLockedRoulettePrediction(): Promise<number | null> {
  const query = `
    SELECT id
    FROM predictions
    WHERE prediction_status = 'locked'
      AND roulette_prediction = true
      AND start_time > NOW() - INTERVAL '2 hours'
    ORDER BY start_time DESC
    LIMIT 1
  `;

  const { rows } = await db.query(query);
  return rows.length ? rows[0].id : null;
}