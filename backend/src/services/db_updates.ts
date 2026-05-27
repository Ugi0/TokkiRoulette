import {
  TwitchPredictionBeginEvent,
  TwitchPredictionEndEvent,
  TwitchPredictionLockEvent
} from "../types/events.js";
import { getCache, getTotalPredictionResults } from "./cache.js";

import db from "./db.js";
import { isPredictionRoulette } from "./db_queries.js";

export async function newPrediction(event: TwitchPredictionBeginEvent) {
  const insertPredictionQuery = `
    INSERT INTO predictions (
      id,
      broadcaster_name,
      title,
      start_time,
      prediction_status,
      roulette_prediction
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id
  `;

  const { rows } = await db.query(insertPredictionQuery, [
    event.event.id,
    event.event.broadcaster_user_login,
    event.event.title,
    new Date(event.event.started_at),
    "active",
    false
  ]);

  const insertOptionQuery = `
    INSERT INTO options (prediction_id, option_id, title)
    VALUES ($1, $2, $3)
  `;

  for (const outcome of event.event.outcomes) {
    await db.query(insertOptionQuery, [
      rows[0].id,
      outcome.id,
      outcome.title
    ]);
  }

  return rows[0].id;
}

export async function cancelPrediction(prediction_event: TwitchPredictionEndEvent) {
  const predictionId = prediction_event.event.id;

  await db.query(
    `UPDATE predictions
     SET prediction_status = 'canceled'
     WHERE id = $1`,
    [predictionId]
  );
}

export async function lockPrediction(prediction_event: TwitchPredictionLockEvent) {
  const predictionId = prediction_event.event.id;

  await db.query(
    `
    UPDATE predictions
    SET prediction_status = 'locked'
    WHERE id = $1
    `,
    [predictionId]
  );

  const cached = getCache(predictionId);

  if (!cached) {
    throw new Error("Missing cache for prediction");
  }

  const insertVoteQuery = `
    INSERT INTO votes (
      prediction_id,
      option_id,
      points_used,
      user_name,
      user_id
    )
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (prediction_id, user_id) DO NOTHING
  `;

  for (const user of cached.predictionStatus) {
    await db.query(insertVoteQuery, [
      predictionId,
      user.voted_option,
      user.bet_amount,
      user.user_name,
      user.user_id
    ]);
  }
}

export async function endPrediction(prediction_event: TwitchPredictionEndEvent) {
  const predictionId = prediction_event.event.id;

  await db.query("BEGIN");

  try {
    await db.query(
      `UPDATE predictions
       SET prediction_status = $1
       WHERE id = $2`,
      [prediction_event.event.status, predictionId]
    );

    await db.query(
      `INSERT INTO prediction_outcomes (prediction_id, winning_option_id)
       VALUES ($1, $2)
       ON CONFLICT (prediction_id) DO UPDATE
       SET winning_option_id = EXCLUDED.winning_option_id`,
      [predictionId, prediction_event.event.winning_outcome_id]
    );

    const isRoulette = await isPredictionRoulette(predictionId);
    const hookData = await getTotalPredictionResults(prediction_event);

    const insertResultQuery = `
      INSERT INTO results (
        prediction_id,
        user_id,
        user_name,
        bet_amount,
        won_amount,
        result_time,
        roulette_prediction
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (prediction_id, user_id) DO NOTHING
    `;

    const allUsers = [...hookData.winners, ...hookData.losers];

    for (const user of allUsers) {
      await db.query(insertResultQuery, [
        predictionId,
        user.user_id,
        user.user_name,
        user.bet_amount,
        user.won_amount,
        new Date(),
        isRoulette
      ]);
    }

    await db.query("COMMIT");
  } catch (err) {
    await db.query("ROLLBACK");
    throw err;
  }
}

export async function markPredictionAsRoulette(
  prediction_id: number
) {
  const query = `
    UPDATE predictions
    SET roulette_prediction = true
    WHERE id = $1
  `;

  await db.query(query, [prediction_id]);
}

export async function recordSpinResult(
  landed_number: number
) {
  const query = `
    UPDATE spin_counter
    SET count = count + 1
    WHERE number = $1
    RETURNING count
  `;

  const { rows } = await db.query(query, [landed_number]);

  if (!rows.length) {
    throw new Error(`Invalid landed_number: ${landed_number}`);
  }

  return rows[0].count;
}

export async function saveUserSession(user_id: string, session_id: string, user_name: string) {
  const query = `
    INSERT INTO user_sessions (session_id, user_id, user_name)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id) DO UPDATE
      SET session_id = EXCLUDED.session_id
  `;

  await db.query(query, [session_id, user_id, user_name]);
}