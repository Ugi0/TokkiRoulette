import {
  TwitchPredictionBeginEvent,
  TwitchPredictionEndEvent,
  TwitchPredictionLockEvent
} from "../types/events.js";

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

export async function lockPrediction(
  prediction_event: TwitchPredictionLockEvent
) {
  const updateStateQuery = `
    UPDATE predictions
    SET prediction_status = 'locked'
    WHERE id = $1
  `;

  await db.query(updateStateQuery, [
    prediction_event.event.id
  ]);

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

  for (const outcome of prediction_event.event.outcomes) {
    for (const predictor of outcome.top_predictors ?? []) {
      await db.query(insertVoteQuery, [
        prediction_event.event.id,
        outcome.id,
        predictor.channel_points_used,
        predictor.user_name,
        predictor.user_id
      ]);
    }
  }
}

export async function endPrediction(
  prediction_event: TwitchPredictionEndEvent
) {
  const updateStateQuery = `
    UPDATE predictions
    SET prediction_status = $1
    WHERE id = $2
  `;

  await db.query(updateStateQuery, [
    prediction_event.event.status,
    prediction_event.event.id
  ]);

  const insertOutcomeQuery = `
    INSERT INTO prediction_outcomes (
      prediction_id,
      winning_option_id
    )
    VALUES ($1, $2)
    ON CONFLICT (prediction_id) DO UPDATE
      SET winning_option_id = EXCLUDED.winning_option_id
  `;

  await db.query(insertOutcomeQuery, [
    prediction_event.event.id,
    prediction_event.event.winning_outcome_id
  ]);

  if (!(await isPredictionRoulette(prediction_event.event.id))) return;

  const winningOutcomeId = prediction_event.event.winning_outcome_id;

  const insertResultQuery = `
    INSERT INTO results (
      prediction_id,
      user_id,
      user_name,
      bet_amount,
      won_amount,
      result_time
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (prediction_id, user_id) DO NOTHING
  `;

  for (const outcome of prediction_event.event.outcomes) {
    for (const predictor of outcome.top_predictors ?? []) {
      const betAmount = predictor.channel_points_used;
      const wonAmount =
        outcome.id === winningOutcomeId
          ? predictor.channel_points_won - betAmount
          : null;

      await db.query(insertResultQuery, [
        prediction_event.event.id,
        predictor.user_id,
        predictor.user_name,
        betAmount,
        wonAmount,
        new Date()
      ]);
    }
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

  await db.query(query, [user_id, session_id, user_name]);
}