import { TwitchPredictionEndEvent } from "../types/events.js";
import { HookData, UserData } from "../types/hookData.js";
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

export async function getTotalPredictionResults(predictionId: string): Promise<HookData> {
  const { rows } = await db.query(`
    WITH totals AS (
    SELECT
      v.prediction_id,
      SUM(v.points_used) AS total_pool
    FROM votes v
    WHERE v.prediction_id = $1
    GROUP BY v.prediction_id
  ),
  winning AS (
    SELECT
      v.prediction_id,
      SUM(v.points_used) AS winning_pool
    FROM votes v
    JOIN prediction_outcomes po
      ON po.prediction_id = v.prediction_id
      AND po.winning_option_id = v.option_id
    WHERE v.prediction_id = $1
    GROUP BY v.prediction_id
  )
  SELECT
      p.id AS prediction_id,
      o.option_id,
      o.title AS option_title,
      v.user_id,
      v.user_name,
      v.points_used AS bet_amount,
      po.winning_option_id,
      t.total_pool,
      w.winning_pool
  FROM predictions p
  JOIN options o ON o.prediction_id = p.id
  LEFT JOIN votes v
    ON v.prediction_id = o.prediction_id
    AND v.option_id = o.option_id
  LEFT JOIN prediction_outcomes po
    ON po.prediction_id = p.id
  LEFT JOIN totals t
    ON t.prediction_id = p.id
  LEFT JOIN winning w
    ON w.prediction_id = p.id
  WHERE p.id = $1;
`, [predictionId]);

  if (rows.length === 0) {
    throw new Error("Prediction not found");
  }

  const prediction_id = rows[0].prediction_id;
  const winningOption = rows[0].winning_option_id;

  const totalPool = rows[0].total_pool;
  const winningPool = rows[0].winning_pool;

  const optionsMap = new Map<string, { title: string }>();
  const winners: UserData[] = [];
  const losers: UserData[] = [];

  for (const row of rows) {
    if (!optionsMap.has(row.option_id)) {
      optionsMap.set(row.option_id, {
        title: row.option_title,
      });
    }

    if (!row.user_id) continue;

    const isWinner = row.option_id === winningOption;

    let won_amount: number | null = null;

    if (isWinner && winningPool > 0) {
      won_amount = Math.floor(row.bet_amount * (totalPool / winningPool));
    } else if (!isWinner) {
      won_amount = null;
    }

    const user: UserData = {
      user_id: String(row.user_id),
      user_name: row.user_name,
      bet_amount: row.bet_amount,
      won_amount,
      voted_option: row.option_id,
    };

    if (isWinner) {
      winners.push(user);
    } else {
      losers.push(user);
    }
  }

  return {
    prediction_id,
    winners,
    losers,
    options: Array.from(optionsMap.values()),
  };
}