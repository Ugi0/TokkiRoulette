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

export async function checkForLockedPrediction(): Promise<string | null> {
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

export async function sessionExists(session_id: string): Promise<boolean> {
  const { rows } = await db.query(
    `SELECT 1 FROM user_sessions WHERE session_id = $1`,
    [session_id]
  );
  return rows.length > 0;
}

/**
 * Finds the prediction option matching one of the roulette result tags (e.g. "red", "1st 12").
 * An exact (case-insensitive) title match wins over a substring match so the pick is deterministic.
 */
export async function getPredictionOutcomeId(prediction_id: string, option_texts: string[]): Promise<string | null> {
  if (option_texts.length === 0) {
    return null;
  }

  const query = `
    SELECT option_id
    FROM options
    WHERE prediction_id = $1
      AND title ILIKE ANY($2::text[])
    ORDER BY (LOWER(title) = ANY($3::text[])) DESC, option_id
    LIMIT 1
  `;

  const escapeLike = (text: string) => text.replace(/[\\%_]/g, c => "\\" + c);

  const { rows } = await db.query(query, [
    prediction_id,
    option_texts.map(text => `%${escapeLike(text)}%`),
    option_texts.map(text => text.toLowerCase()),
  ]);

  return rows.length ? rows[0].option_id : null;
}
