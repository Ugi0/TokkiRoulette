import { TwitchTokenResponse } from "../types/twitch.js";

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

async function getAppToken(): Promise<string> {
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

export async function registerTwitchHooks(username: string, user_id: string, accessToken: string): Promise<void> {
  await registerPredictionHook(username, user_id, accessToken, "begin");
  await registerPredictionHook(username, user_id, accessToken, "lock");
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
      //"Authorization": `Bearer ${accessToken}`,
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
