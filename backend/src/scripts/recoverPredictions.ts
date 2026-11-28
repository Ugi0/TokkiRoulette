/**
 * Rebuilds the outcome and results of predictions whose END event was never saved, using
 * Twitch's record of the prediction (GET /helix/predictions).
 *
 * The Twitch data is turned into the same channel.prediction.end payload the webhook receives and
 * saved through the normal endPrediction() code (same payout calculation, one transaction).
 *
 * Usage, inside the backend container:
 *   node dist/scripts/recoverPredictions.js <prediction-id> [...]            # preview only
 *   node dist/scripts/recoverPredictions.js <prediction-id> [...] --apply    # write to the database
 */
import db from "../services/db.js";
import { getUserToken } from "../services/helix.js";
import { cacheUserResults, deleteCache, getTotalPredictionResults } from "../services/cache.js";
import { endPrediction } from "../services/db_updates.js";
import type { TwitchPredictionEndEvent } from "../types/events.js";

type HelixPrediction = {
  id: string;
  broadcaster_id: string;
  broadcaster_name: string;
  broadcaster_login: string;
  title: string;
  winning_outcome_id: string | null;
  status: "ACTIVE" | "LOCKED" | "RESOLVED" | "CANCELED";
  created_at: string;
  ended_at: string | null;
  outcomes: {
    id: string;
    title: string;
    color: string;
    users: number;
    channel_points: number;
    top_predictors: {
      user_id: string;
      user_name: string;
      user_login: string;
      channel_points_used: number;
      channel_points_won: number | null;
    }[] | null;
  }[];
};

async function fetchPredictions(ids: string[]): Promise<HelixPrediction[]> {
  const broadcasterId = process.env.TOKKI_USER_ID;
  const clientId = process.env.TWITCH_CLIENT_ID;
  if (!broadcasterId || !clientId) {
    throw new Error("TOKKI_USER_ID and TWITCH_CLIENT_ID must be set");
  }

  const url = new URL("https://api.twitch.tv/helix/predictions");
  url.searchParams.set("broadcaster_id", broadcasterId);
  for (const id of ids) url.searchParams.append("id", id);

  const resp = await fetch(url, {
    headers: {
      "Client-Id": clientId,
      "Authorization": `Bearer ${await getUserToken(broadcasterId)}`,
    },
  });

  if (!resp.ok) {
    throw new Error(`Twitch returned ${resp.status}: ${await resp.text()}`);
  }

  return ((await resp.json()) as { data: HelixPrediction[] }).data ?? [];
}

function toEndEvent(p: HelixPrediction): TwitchPredictionEndEvent {
  return {
    subscription: {
      id: "recovered",
      type: "channel.prediction.end",
      version: "1",
      cost: 0,
      condition: { broadcaster_user_id: p.broadcaster_id },
      transport: { method: "webhook", callback: "" },
      created_at: p.created_at,
    },
    event: {
      id: p.id,
      broadcaster_user_id: p.broadcaster_id,
      broadcaster_user_login: p.broadcaster_login,
      broadcaster_user_name: p.broadcaster_name,
      title: p.title,
      winning_outcome_id: p.winning_outcome_id!,
      status: "resolved",
      started_at: p.created_at,
      ended_at: p.ended_at ?? p.created_at,
      outcomes: p.outcomes.map(o => ({
        id: o.id,
        title: o.title,
        color: o.color,
        users: o.users,
        channel_points: o.channel_points,
        top_predictors: (o.top_predictors ?? []).map(t => ({
          user_id: t.user_id,
          user_name: t.user_name,
          user_login: t.user_login,
          channel_points_used: t.channel_points_used,
          channel_points_won: t.channel_points_won ?? 0,
        })),
      })),
    },
  };
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const ids = args.filter(a => a !== "--apply");

  if (ids.length === 0 || ids.length > 25) {
    console.error("Usage: node dist/scripts/recoverPredictions.js <prediction-id> [...up to 25] [--apply]");
    process.exitCode = 2;
    return;
  }

  const predictions = await fetchPredictions(ids);

  for (const id of ids.filter(id => !predictions.some(p => p.id === id))) {
    console.log(`\n${id}: Twitch no longer returns this prediction, it can't be recovered from Twitch.`);
  }

  for (const p of predictions) {
    console.log(`\n=== ${p.title} (${p.id})`);
    console.log(`Twitch status: ${p.status}, ended at ${p.ended_at}`);

    if (p.status !== "RESOLVED" || !p.winning_outcome_id) {
      console.log("Skipped: not resolved on Twitch, so there is no winner to record.");
      continue;
    }

    for (const o of p.outcomes) {
      const marker = o.id === p.winning_outcome_id ? "  <- winner" : "";
      const listed = o.top_predictors?.length ?? 0;
      console.log(`  ${o.title}: ${o.users} users, ${o.channel_points} points (${listed} listed by Twitch)${marker}`);
    }

    const event = toEndEvent(p);

    // Same as the webhook: cache the final bets, then compute and save results.
    cacheUserResults(p.id, event.event.outcomes.flatMap(outcome =>
      outcome.top_predictors.map(t => ({
        user_id: t.user_id,
        user_name: t.user_name,
        bet_amount: t.channel_points_used,
        won_amount: t.channel_points_won,
        voted_option: outcome.id,
      }))
    ));

    const preview = await getTotalPredictionResults(event);
    console.log("  Results to save:");
    for (const u of [...preview.winners, ...preview.losers]) {
      const outcome = u.won_amount === null ? `lost ${u.bet_amount}` : `bet ${u.bet_amount}, won +${u.won_amount}`;
      console.log(`    ${u.user_name.padEnd(24)} ${outcome}`);
    }

    const totalUsers = p.outcomes.reduce((sum, o) => sum + o.users, 0);
    const listedUsers = preview.winners.length + preview.losers.length;
    if (listedUsers < totalUsers) {
      console.log(`  Note: Twitch lists ${listedUsers} of ${totalUsers} bettors (top 10 per option); the rest can't be recovered.`);
    }

    if (apply) {
      await endPrediction(event);
      console.log("  Saved.");
    }

    deleteCache(p.id);
  }

  if (!apply) {
    console.log("\nPreview only. Run again with --apply to save.");
  }
}

main()
  .catch(err => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.end());
