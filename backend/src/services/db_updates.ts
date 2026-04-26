import { TwitchPredictionBeginEvent, TwitchPredictionEndEvent, TwitchPredictionLockEvent } from "../types/events.js";
import db from "./db.js";
import { isPredictionRoulette } from "./db_queries.js";

export async function newPrediction(event: TwitchPredictionBeginEvent) {
  const new_prediction_query = `
    INSERT INTO predictions (broadcaster_name, title, start_time, prediction_status, roulette_prediction)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `;

  const result = await db.query(new_prediction_query, [
    event.event.broadcaster_user_login,
    event.event.title,
    new Date(event.event.started_at),
    "active",
    false
  ]);

  const option_query = `
    INSERT INTO options (prediction_id, title, color)
    VALUES ($1, $2, $3)
  `;

    for (const outcome of event.event.outcomes) {
        await db.query(option_query, [
            result.rows[0].id,
            outcome.title,
            outcome.color
        ]);
    }

  return result.rows[0].id;
}

export async function lockPrediction(prediction_event: TwitchPredictionLockEvent) {
    const update_state_query = `
        UPDATE predictions
        SET prediction_status = 'locked'
        WHERE id = $1
    `;

    await db.query(update_state_query, [prediction_event.event.id]);

    const insert_outcome_query = `
        INSERT INTO votes (prediction_id, option_id, points_used, user_name, user_id)
        VALUES ($1, $2, $3, $4, $5)
    `;

    for (const outcome of prediction_event.event.outcomes) {
        await db.query(insert_outcome_query, [
            prediction_event.event.id,
            outcome.id,
            outcome.channel_points,
            outcome.top_predictors[0]?.user_name || null,
            outcome.top_predictors[0]?.user_id || null

        ]);
    }
}

export async function endPrediction(prediction_event: TwitchPredictionEndEvent) {
    const update_state_query = `
        UPDATE predictions
        SET prediction_status = $1, winning_option_id = $2
        WHERE id = $3
    `;

    await db.query(update_state_query, [prediction_event.event.status, prediction_event.event.winning_outcome_id, prediction_event.event.id]);

    const update_prediction_outcomes_query = `
        INSERT INTO prediction_outcomes (prediction_id, winning_option_id)
        VALUES ($1, $2)
    `;

    await db.query(update_prediction_outcomes_query, [prediction_event.event.id, prediction_event.event.winning_outcome_id]);

    if (await isPredictionRoulette(prediction_event.event.id)) {
      const winning_outcome_id = prediction_event.event.winning_outcome_id;

      for (const outcome of prediction_event.event.outcomes) {
        for (const predictor of outcome.top_predictors) {
          const prediction_won = outcome.id === winning_outcome_id;
          const bet_amount = predictor.channel_points_used;
          const won_amount = prediction_won ? predictor.channel_points_won - bet_amount : 0;
          const update_votes_query = `
              INSERT INTO results (prediction_id, user_id, bet_amount, won_amount, result_time)
              VALUES ($1, $2, $3, $4, $5)
          `;
          
          await db.query(update_votes_query, [
              prediction_event.event.id,
              predictor.user_id,
              bet_amount,
              won_amount,
              new Date()
          ]);
        }
      }
    }
}