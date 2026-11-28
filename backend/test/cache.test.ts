import { test } from "node:test";
import assert from "node:assert/strict";
import { cacheUserResults, deleteCache, getTotalPredictionResults } from "../src/services/cache.js";
import type { TwitchPredictionEndEvent } from "../src/types/events.js";

function endEvent(id: string, outcomes: { id: string; points: number }[], winner: string): TwitchPredictionEndEvent {
  return {
    subscription: {} as TwitchPredictionEndEvent["subscription"],
    event: {
      id,
      broadcaster_user_id: "1",
      broadcaster_user_login: "b",
      broadcaster_user_name: "B",
      title: "t",
      winning_outcome_id: winner,
      status: "resolved",
      started_at: "",
      ended_at: "",
      outcomes: outcomes.map(o => ({
        id: o.id, title: o.id, color: "blue", users: 0, channel_points: o.points, top_predictors: [],
      })),
    },
  };
}

test("splits cached bets into winners and losers with net winnings", async () => {
  cacheUserResults("p1", [
    { user_id: "1", user_name: "a", bet_amount: 100, won_amount: null, voted_option: "red" },
    { user_id: "2", user_name: "b", bet_amount: 300, won_amount: null, voted_option: "black" },
  ]);

  const result = await getTotalPredictionResults(endEvent("p1", [{ id: "red", points: 100 }, { id: "black", points: 300 }], "red"));

  assert.deepEqual(result.winners.map(w => [w.user_id, w.won_amount]), [["1", 300]]); // 100 * 400/100 - 100
  assert.deepEqual(result.losers.map(l => [l.user_id, l.won_amount]), [["2", null]]);
  deleteCache("p1");
});

test("later updates for the same user replace the earlier bet", async () => {
  cacheUserResults("p2", [{ user_id: "1", user_name: "a", bet_amount: 10, won_amount: null, voted_option: "red" }]);
  cacheUserResults("p2", [{ user_id: "1", user_name: "a", bet_amount: 50, won_amount: null, voted_option: "red" }]);

  const result = await getTotalPredictionResults(endEvent("p2", [{ id: "red", points: 50 }, { id: "black", points: 0 }], "red"));
  assert.equal(result.winners.length, 1);
  assert.equal(result.winners[0].bet_amount, 50);
  deleteCache("p2");
});

test("a prediction nobody bet on resolves with empty results instead of throwing", async () => {
  const result = await getTotalPredictionResults(endEvent("empty", [{ id: "red", points: 0 }, { id: "black", points: 0 }], "red"));
  assert.deepEqual(result.winners, []);
  assert.deepEqual(result.losers, []);
});
