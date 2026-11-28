import {
  TwitchPredictionBeginEvent,
  TwitchPredictionEndEvent,
  TwitchPredictionLockEvent
} from "../types/events.js";
import { UserTokens } from "../types/helix.js";
import { TwitchTokenResponse, TwitchUser } from "../types/twitch.js";
import { getCachedPredictions, getTotalPredictionResults } from "./cache.js";

import db, { Queryable, withTransaction } from "./db.js";
import { isPredictionRoulette } from "./db_queries.js";

/**
 * votes, results and user_sessions all have a foreign key to participants(user_id),
 * so every user must exist there before any of those rows are written.
 * Updates the name (users can rename) but keeps any stored profile image.
 */
async function upsertParticipants(
  client: Queryable,
  users: { user_id: string; user_name: string }[]
) {
  const unique = new Map<string, string>();
  for (const u of users) {
    if (u.user_id) unique.set(u.user_id, u.user_name || u.user_id);
  }
  if (unique.size === 0) return;

  await client.query(
    `INSERT INTO participants (user_id, user_name)
     SELECT * FROM UNNEST($1::int[], $2::text[])
     ON CONFLICT (user_id) DO UPDATE
     SET user_name = EXCLUDED.user_name`,
    [[...unique.keys()], [...unique.values()]]
  );
}

const insertVoteQuery = `
  INSERT INTO votes (
    prediction_id,
    option_id,
    points_used,
    user_id
  )
  VALUES ($1, $2, $3, $4)
  ON CONFLICT (prediction_id, user_id) DO NOTHING
`;

export async function newPrediction(event: TwitchPredictionBeginEvent) {
  // Twitch delivers EventSub messages at-least-once, so a redelivered BEGIN must not fail.
  await withTransaction(async client => {
    await client.query(
      `INSERT INTO predictions (
        id,
        broadcaster_name,
        title,
        start_time,
        prediction_status,
        roulette_prediction
      )
      VALUES ($1, $2, $3, $4, 'active', false)
      ON CONFLICT (id) DO NOTHING`,
      [
        event.event.id,
        event.event.broadcaster_user_login,
        event.event.title,
        new Date(event.event.started_at),
      ]
    );

    for (const outcome of event.event.outcomes) {
      await client.query(
        `INSERT INTO options (prediction_id, option_id, title)
         VALUES ($1, $2, $3)
         ON CONFLICT (prediction_id, option_id) DO NOTHING`,
        [event.event.id, outcome.id, outcome.title]
      );
    }
  });

  return event.event.id;
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
  const cached = getCachedPredictions(predictionId);

  await withTransaction(async client => {
    await client.query(
      `UPDATE predictions
       SET prediction_status = 'locked'
       WHERE id = $1`,
      [predictionId]
    );

    await upsertParticipants(client, cached);

    for (const user of cached) {
      await client.query(insertVoteQuery, [
        predictionId,
        user.voted_option,
        user.bet_amount,
        user.user_id
      ]);
    }
  });
}

export async function endPrediction(prediction_event: TwitchPredictionEndEvent) {
  const predictionId = prediction_event.event.id;

  const isRoulette = await isPredictionRoulette(predictionId);
  const hookData = await getTotalPredictionResults(prediction_event);
  const allUsers = [...hookData.winners, ...hookData.losers];

  await withTransaction(async client => {
    await client.query(
      `UPDATE predictions
       SET prediction_status = $1
       WHERE id = $2`,
      [prediction_event.event.status, predictionId]
    );

    await client.query(
      `INSERT INTO prediction_outcomes (prediction_id, winning_option_id)
       VALUES ($1, $2)
       ON CONFLICT (prediction_id) DO UPDATE
       SET winning_option_id = EXCLUDED.winning_option_id`,
      [predictionId, prediction_event.event.winning_outcome_id]
    );

    const finalPredictors = prediction_event.event.outcomes.flatMap(outcome =>
      outcome.top_predictors.map(predictor => ({ outcome, predictor }))
    );

    await upsertParticipants(client, [
      ...allUsers,
      ...finalPredictors.map(({ predictor }) => predictor),
    ]);

    // Backfill any missing votes from the final event
    // This is needed because if someone votes right before the prediction ends, twitch might not send the progress event at all,
    //    causing it to not end up in the votes table
    for (const { outcome, predictor } of finalPredictors) {
      await client.query(insertVoteQuery, [
        predictionId,
        outcome.id,
        predictor.channel_points_used,
        predictor.user_id
      ]);
    }

    // Votes cached from progress events but no longer in the final top_predictors (Twitch only sends the top 10 per outcome)
    for (const user of allUsers) {
      await client.query(insertVoteQuery, [
        predictionId,
        user.voted_option,
        user.bet_amount,
        user.user_id
      ]);
    }

    const insertResultQuery = `
      INSERT INTO results (
        prediction_id,
        user_id,
        bet_amount,
        won_amount,
        result_time,
        roulette_prediction
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (prediction_id, user_id) DO NOTHING
    `;

    for (const user of allUsers) {
      await client.query(insertResultQuery, [
        predictionId,
        user.user_id,
        user.bet_amount,
        user.won_amount,
        new Date(),
        isRoulette
      ]);
    }
  });
}

export async function setPredictionRoulette(
  prediction_id: string,
  isRoulette: boolean
) {
  await db.query(
    `UPDATE predictions
     SET roulette_prediction = $2
     WHERE id = $1`,
    [prediction_id, isRoulette]
  );
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

export async function saveUserSession(response: TwitchTokenResponse, userData: TwitchUser, session_id: string) {
  await withTransaction(async client => {
    await upsertParticipants(client, [
      { user_id: userData.id, user_name: userData.display_name ?? userData.login },
    ]);

    await client.query(
      `INSERT INTO user_sessions (session_id, user_id, access_token, refresh_token, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE
       SET
         session_id = EXCLUDED.session_id,
         access_token = EXCLUDED.access_token,
         refresh_token = EXCLUDED.refresh_token,
         expires_at = EXCLUDED.expires_at`,
      [session_id, userData.id, response.access_token, response.refresh_token, new Date(Date.now() + response.expires_in * 1000)]
    );
  });
}

export async function saveUserTokens(user_id: string, tokens: UserTokens): Promise<void> {
  const query = `
    UPDATE user_sessions
    SET
      access_token = $2,
      refresh_token = $3,
      expires_at = $4
    WHERE user_id = $1
  `;

  await db.query(query, [
    user_id,
    tokens.access_token,
    tokens.refresh_token,
    tokens.expires_at,
  ]);
}
