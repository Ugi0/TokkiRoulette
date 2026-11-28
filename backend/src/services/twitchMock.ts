/**
 * In-process stand-in for Twitch, used when TWITCH_MOCK=true (development only).
 *
 * It keeps the state of one fake prediction and delivers EventSub notifications to our own
 * /api/webhooks/twitch endpoint over HTTP, signed with the webhook secret, so the real webhook
 * code path (signature check, parsing, DB writes, WebSocket push) runs exactly as in production.
 *
 * Payload shapes follow https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpredictionbegin
 * including Twitch's quirk of only sending the top 10 predictors per outcome.
 */
import crypto from "node:crypto";
import type { HelixUser } from "../types/helix.js";
import { signEventSubMessage } from "../utils/eventsubSignature.js";
import { getWebhookSecret } from "./devMode.js";

type MockUser = { id: string; login: string; name: string };

type MockOutcome = {
  id: string;
  title: string;
  color: "blue" | "pink";
  bets: Map<string, { user: MockUser; points: number }>;
};

export type MockPredictionStatus = "active" | "locked" | "resolved" | "canceled";

type MockPrediction = {
  id: string;
  title: string;
  status: MockPredictionStatus;
  startedAt: string;
  locksAt: string;
  winningOutcomeId: string | null;
  outcomes: MockOutcome[];
};

const VIEWER_NAMES = [
  "CarrotEnjoyer", "BunnyHopper42", "LuckyClover", "AllInAndy", "RedOrDead", "BlackjackBetty",
  "ZeroHero", "DozenDave", "ChipStacker", "HouseEdgeHater", "SpinDoctor", "OddsAreEven",
  "GreenMachine", "TokkiStan", "PointsPauper", "WheelWatcher", "RiskyRabbit", "LowRoller",
  "HighRoller", "CroupierCarl", "BetItAllBob", "MartingaleMary", "VelvetFelt", "SnakeEyesSam",
];

const VIEWERS: MockUser[] = VIEWER_NAMES.map((name, i) => ({
  id: String(900000001 + i),
  login: name.toLowerCase(),
  name,
}));

export function getMockBroadcaster(): MockUser {
  return { id: process.env.TOKKI_USER_ID!, login: "tokki_mock", name: "Tokki (mock)" };
}

export function getMockViewer(): MockUser {
  return VIEWERS[0];
}

export const PREDICTION_TEMPLATES: Record<string, { title: string; outcomes: string[] }> = {
  color: { title: "What color will the wheel land on?", outcomes: ["Red", "Black", "Green"] },
  dozen: { title: "Which dozen will hit?", outcomes: ["1st 12", "2nd 12", "3rd 12"] },
  parity: { title: "Odd or even?", outcomes: ["Odd", "Even"] },
  half: { title: "Low (1-18) or high (19-36)?", outcomes: ["Low", "High"] },
};

let current: MockPrediction | null = null;

function requirePrediction(expected?: MockPredictionStatus): MockPrediction {
  if (!current) {
    throw new MockTwitchError("No mock prediction exists. Start one first.");
  }
  if (expected && current.status !== expected) {
    throw new MockTwitchError(`Mock prediction is ${current.status}, expected ${expected}.`);
  }
  return current;
}

export class MockTwitchError extends Error {}

// ---------------------------------------------------------------------------------------------
// Prediction lifecycle (what the streamer / viewers would do on Twitch)
// ---------------------------------------------------------------------------------------------

export async function startPrediction(title: string, outcomeTitles: string[]): Promise<MockPrediction> {
  if (current && (current.status === "active" || current.status === "locked")) {
    throw new MockTwitchError("A mock prediction is already running. Resolve or cancel it first.");
  }
  if (outcomeTitles.length < 2 || outcomeTitles.length > 10) {
    throw new MockTwitchError("A prediction needs between 2 and 10 outcomes.");
  }

  const now = new Date();
  current = {
    id: crypto.randomUUID(),
    title,
    status: "active",
    startedAt: now.toISOString(),
    locksAt: new Date(now.getTime() + 5 * 60_000).toISOString(),
    winningOutcomeId: null,
    outcomes: outcomeTitles.map((t, i) => ({
      id: crypto.randomUUID(),
      title: t,
      color: i === 0 ? "blue" : "pink",
      bets: new Map(),
    })),
  };

  await deliver("channel.prediction.begin", {
    ...baseEvent(current),
    outcomes: current.outcomes.map(o => ({ id: o.id, title: o.title, color: o.color })),
    started_at: current.startedAt,
    locks_at: current.locksAt,
  });

  return current;
}

/** Random viewers who have not bet yet place bets on random outcomes, then a progress event is sent. */
export async function placeRandomBets(count: number): Promise<number> {
  const prediction = requirePrediction("active");
  const alreadyBet = new Set(prediction.outcomes.flatMap(o => [...o.bets.keys()]));
  const available = VIEWERS.filter(v => !alreadyBet.has(v.id));

  const bettors = shuffle(available).slice(0, Math.max(0, count));
  for (const user of bettors) {
    const outcome = prediction.outcomes[Math.floor(Math.random() * prediction.outcomes.length)];
    const points = 10 * Math.ceil(Math.random() * 500);
    outcome.bets.set(user.id, { user, points });
  }

  if (bettors.length > 0) {
    await deliver("channel.prediction.progress", {
      ...baseEvent(prediction),
      outcomes: outcomesPayload(prediction, "progress"),
      started_at: prediction.startedAt,
      locks_at: prediction.locksAt,
    });
  }

  return bettors.length;
}

export async function lockPrediction(): Promise<void> {
  const prediction = requirePrediction("active");
  prediction.status = "locked";

  await deliver("channel.prediction.lock", {
    ...baseEvent(prediction),
    outcomes: outcomesPayload(prediction, "progress"),
    started_at: prediction.startedAt,
    locked_at: new Date().toISOString(),
  });
}

export async function resolvePrediction(winningOutcomeId: string): Promise<void> {
  const prediction = requirePrediction();
  if (prediction.status !== "active" && prediction.status !== "locked") {
    throw new MockTwitchError(`Mock prediction is already ${prediction.status}.`);
  }
  if (!prediction.outcomes.some(o => o.id === winningOutcomeId)) {
    throw new MockTwitchError(`Outcome ${winningOutcomeId} does not belong to the mock prediction.`);
  }

  prediction.status = "resolved";
  prediction.winningOutcomeId = winningOutcomeId;

  await deliver("channel.prediction.end", {
    ...baseEvent(prediction),
    winning_outcome_id: winningOutcomeId,
    outcomes: outcomesPayload(prediction, "end"),
    status: "resolved",
    started_at: prediction.startedAt,
    ended_at: new Date().toISOString(),
  });
}

export async function cancelPrediction(): Promise<void> {
  const prediction = requirePrediction();
  if (prediction.status !== "active" && prediction.status !== "locked") {
    throw new MockTwitchError(`Mock prediction is already ${prediction.status}.`);
  }

  prediction.status = "canceled";

  await deliver("channel.prediction.end", {
    ...baseEvent(prediction),
    winning_outcome_id: null,
    outcomes: outcomesPayload(prediction, "end"),
    status: "canceled",
    started_at: prediction.startedAt,
    ended_at: new Date().toISOString(),
  });
}

export function getMockState() {
  if (!current) return null;
  return {
    id: current.id,
    title: current.title,
    status: current.status,
    winningOutcomeId: current.winningOutcomeId,
    outcomes: current.outcomes.map(o => ({
      id: o.id,
      title: o.title,
      users: o.bets.size,
      channel_points: sumPoints(o),
      bets: [...o.bets.values()].map(b => ({ user: b.user.name, points: b.points })),
    })),
  };
}

// ---------------------------------------------------------------------------------------------
// Helix API replacements (what our backend asks Twitch for)
// ---------------------------------------------------------------------------------------------

/**
 * Mock of PATCH /helix/predictions. Like Twitch, it answers immediately and sends the
 * channel.prediction.end webhook a moment later, so the frontend's "wait for results" path is exercised.
 */
export function mockResolveViaApi(predictionId: string, winningOutcomeId: string, delayMs = 1500) {
  const prediction = requirePrediction();
  if (prediction.id !== predictionId) {
    throw new MockTwitchError(
      `Mock Twitch does not know prediction ${predictionId} (the backend may have restarted). Start a new mock prediction.`
    );
  }
  if (prediction.status !== "active" && prediction.status !== "locked") {
    throw new MockTwitchError(`Mock prediction is already ${prediction.status}.`);
  }

  setTimeout(() => {
    resolvePrediction(winningOutcomeId).catch(err => console.error("[twitch-mock] Failed to send END event:", err));
  }, delayMs);
}

export function mockHelixUsers(ids: string[]): HelixUser[] {
  const known = [getMockBroadcaster(), ...VIEWERS];

  return ids.map(id => {
    const user = known.find(u => u.id === id) ?? { id, login: `user_${id}`, name: `User${id}` };
    return {
      id: user.id,
      login: user.login,
      display_name: user.name,
      type: "",
      broadcaster_type: "",
      description: "Mock Twitch user",
      profile_image_url: "/default-pfp.jpg",
      offline_image_url: "",
      view_count: 0,
      created_at: "2020-01-01T00:00:00Z",
    };
  });
}

// ---------------------------------------------------------------------------------------------
// EventSub delivery
// ---------------------------------------------------------------------------------------------

function baseEvent(prediction: MockPrediction) {
  const broadcaster = getMockBroadcaster();
  return {
    id: prediction.id,
    broadcaster_user_id: broadcaster.id,
    broadcaster_user_login: broadcaster.login,
    broadcaster_user_name: broadcaster.name,
    title: prediction.title,
  };
}

function sumPoints(outcome: MockOutcome): number {
  return [...outcome.bets.values()].reduce((sum, b) => sum + b.points, 0);
}

function outcomesPayload(prediction: MockPrediction, phase: "progress" | "end") {
  const totalPool = prediction.outcomes.reduce((sum, o) => sum + sumPoints(o), 0);

  return prediction.outcomes.map(outcome => {
    const pool = sumPoints(outcome);
    const isWinner = prediction.status === "resolved" && outcome.id === prediction.winningOutcomeId;

    const topPredictors = [...outcome.bets.values()]
      .sort((a, b) => b.points - a.points)
      .slice(0, 10)
      .map(({ user, points }) => ({
        user_id: user.id,
        user_login: user.login,
        user_name: user.name,
        channel_points_used: points,
        // Twitch: null during progress/lock, 0 for losing outcomes or refunds, payout for winners.
        channel_points_won:
          phase === "progress" ? null : isWinner && pool > 0 ? Math.floor((points * totalPool) / pool) : 0,
      }));

    return {
      id: outcome.id,
      title: outcome.title,
      color: outcome.color,
      users: outcome.bets.size,
      channel_points: pool,
      top_predictors: topPredictors,
    };
  });
}

async function deliver(type: string, event: Record<string, unknown>) {
  const secret = getWebhookSecret()!;
  const port = Number(process.env.PORT) || 8080;
  const callback = `http://127.0.0.1:${port}/api/webhooks/twitch`;

  const body = JSON.stringify({
    subscription: {
      id: crypto.randomUUID(),
      status: "enabled",
      type,
      version: "1",
      cost: 0,
      condition: { broadcaster_user_id: getMockBroadcaster().id },
      transport: { method: "webhook", callback },
      created_at: new Date().toISOString(),
    },
    event,
  });

  const messageId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  const resp = await fetch(callback, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Twitch-Eventsub-Message-Id": messageId,
      "Twitch-Eventsub-Message-Timestamp": timestamp,
      "Twitch-Eventsub-Message-Signature": signEventSubMessage(secret, messageId, timestamp, body),
      "Twitch-Eventsub-Message-Type": "notification",
      "Twitch-Eventsub-Subscription-Type": type,
      "Twitch-Eventsub-Subscription-Version": "1",
    },
    body,
  });

  console.log(`[twitch-mock] Delivered ${type} -> ${resp.status}`);

  if (!resp.ok) {
    throw new Error(`Webhook rejected ${type}: ${resp.status} ${await resp.text()}`);
  }
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
