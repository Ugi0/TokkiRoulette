import { UserTokens } from "../types/helix.js";
import db from "./db.js";

export async function isPredictionRoulette(prediction_id: string): Promise<boolean> {
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

export async function getUserTokens(user_id: string): Promise<UserTokens | null> {
  const query = `
    SELECT access_token, refresh_token, expires_at
    FROM user_sessions
    WHERE user_id = $1
  `;

  const { rows } = await db.query(query, [user_id]);
  return rows.length ? { access_token: rows[0].access_token, refresh_token: rows[0].refresh_token, expires_at: rows[0].expires_at } : null;
}

export async function getPredictionOutcomeId(prediction_id: string, option_texts: string[]): Promise<string | null> {
  const query = `
    SELECT option_id
    FROM options
    WHERE prediction_id = $1
      AND (
        ${option_texts.map((_, i) => `title ILIKE $${i + 2}`).join(" OR ")}
      )
    LIMIT 1
  `;

  const params = [
    prediction_id,
    ...option_texts.map(text => `%${text}%`)
  ];

  const { rows } = await db.query(query, params);

  return rows.length ? rows[0].option_id : null;
}