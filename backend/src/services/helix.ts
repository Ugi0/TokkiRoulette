import { HelixUser, UserTokens } from "../types/helix.js";
import { TwitchTokenResponse } from "../types/twitch.js";
import { getUserTokens } from "./db_queries.js";
import { saveUserTokens } from "./db_updates.js";
import { TWITCH_MOCK } from "./devMode.js";
import { mockHelixUsers, mockResolveViaApi } from "./twitchMock.js";

let cachedToken: string | null = null;
let tokenExpiry = 0;

function assertEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

export async function helixAppRequest(
  path: string,
  params: Record<string, string | string[]> = {}
): Promise<unknown> {
  const token = await getAppToken();
  const url = new URL(`https://api.twitch.tv/helix/${path}`);

  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) v.forEach(val => url.searchParams.append(k, val));
    else url.searchParams.set(k, v);
  }

  const resp = await fetch(url.toString(), {
    headers: {
      "Client-ID": assertEnv("TWITCH_CLIENT_ID"),
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!resp.ok) {
    throw new Error(`Helix app request failed: ${resp.status}`);
  }

  return resp.json();
}

export async function getAppToken(): Promise<string> {
  if (TWITCH_MOCK) return "mock-app-token";

  const now = Date.now();

  if (cachedToken && now < tokenExpiry - 60_000) {
    return cachedToken;
  }

  const resp = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: assertEnv("TWITCH_CLIENT_ID"),
      client_secret: assertEnv("TWITCH_CLIENT_SECRET"),
      grant_type: "client_credentials",
    }),
  });

  if (!resp.ok) {
    throw new Error(`App token request failed: ${resp.status}`);
  }

  const data = (await resp.json()) as TwitchTokenResponse;

  cachedToken = data.access_token;
  tokenExpiry = now + data.expires_in * 1000;

  return cachedToken;
}

async function refreshAccessToken(refreshToken: string): Promise<UserTokens> {
  const response = await fetch(
    "https://id.twitch.tv/oauth2/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.TWITCH_CLIENT_ID!,
        client_secret: process.env.TWITCH_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to refresh Twitch token");
  }

  const data = await response.json();

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? refreshToken,
    expires_at: new Date(Date.now() + data.expires_in * 1000),
  };
}

export async function getUserToken(user_id: string): Promise<string> {
  if (TWITCH_MOCK) return "mock-user-token";

  const tokens = await getUserTokens(user_id);

  if (!tokens) {
    throw new Error(`No tokens found for user_id: ${user_id}`);
  }

  const isExpired =
    Date.now() >= new Date(tokens.expires_at).getTime() - 60_000;

  if (!isExpired) {
    return tokens.access_token;
  }

  const refreshed = await refreshAccessToken(tokens.refresh_token);

  await saveUserTokens(user_id, refreshed);

  return refreshed.access_token;
}

export async function registerTwitchHooks(username: string, user_id: string, accessToken: string): Promise<void> {
  await registerPredictionHook(username, user_id, accessToken, "begin");
  await registerPredictionHook(username, user_id, accessToken, "lock");
  await registerPredictionHook(username, user_id, accessToken, "progress");
  await registerPredictionHook(username, user_id, accessToken, "end");
}

export async function registerPredictionHook(
  username: string, 
  user_id: string, 
  accessToken: 
  string, eventName: "begin" | "progress" | "lock" | "end"
): Promise<void> {
  const resp = await fetch(`https://api.twitch.tv/helix/eventsub/subscriptions`, {
    method: "POST",
    headers: { 
      "Client-Id": process.env.TWITCH_CLIENT_ID!,
      "Content-Type": "application/json",
      "Authorization": `Bearer ${await getAppToken()}`,
    },
    body: JSON.stringify({
      type: `channel.prediction.${eventName}`,
      version: "1",
      condition: {
        broadcaster_user_id: user_id,
      },
      transport: {
        method: "webhook",
        callback: `${assertEnv("TWITCH_WEBHOOK_CALLBACK_URL")}?user=${username}`,
        secret: assertEnv("TWITCH_WEBHOOK_SECRET"),
      },
    }),
  });

  if (!resp.ok) {
    const error = await resp.text();
    throw new Error(`Failed to register EventSub hook: ${error}`);
  }
  
}

/**
 * Resolves a prediction on Twitch. Twitch answers right away and sends the
 * channel.prediction.end webhook afterwards.
 */
export async function resolveTwitchPrediction(prediction_id: string, winningOutcomeId: string): Promise<void> {
  if (TWITCH_MOCK) {
    mockResolveViaApi(prediction_id, winningOutcomeId);
    return;
  }

  const resp = await fetch(`https://api.twitch.tv/helix/predictions`, {
    method: "PATCH",
    headers: {
      "Client-Id": assertEnv("TWITCH_CLIENT_ID"),
      "Content-Type": "application/json",
      "Authorization": `Bearer ${await getUserToken(process.env.TOKKI_USER_ID!)}`,
    },
    body: JSON.stringify({
      broadcaster_id: process.env.TOKKI_USER_ID!,
      id: prediction_id,
      status: "RESOLVED",
      winning_outcome_id: winningOutcomeId,
    }),
  });

  if (!resp.ok) {
    const error = await resp.text();
    throw new Error(`Failed to resolve prediction: ${error}`);
  }
}

const HELIX_USERS_BATCH = 100; // Helix accepts up to 100 ids per /users request

/** Looks up Twitch users by id, batching requests. Unknown or deleted users are simply absent. */
export async function fetchHelixUsers(userIds: string[]): Promise<HelixUser[]> {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (ids.length === 0) return [];

  if (TWITCH_MOCK) return mockHelixUsers(ids);

  const users: HelixUser[] = [];

  for (let i = 0; i < ids.length; i += HELIX_USERS_BATCH) {
    const batch = ids.slice(i, i + HELIX_USERS_BATCH);
    const data = (await helixAppRequest("users", { id: batch })) as { data?: HelixUser[] };
    users.push(...(data.data ?? []));
  }

  return users;
}
