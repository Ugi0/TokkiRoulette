import { TwitchTokenResponse } from "../types/twitch.js";
import db from "./db.js";

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

export async function helixUserRequest(
  path: string,
  accessToken: string,
  params: Record<string, string | string[]> = {},
  userId?: string
): Promise<unknown> {
  async function makeRequest(token: string): Promise<Response> {
    const url = new URL(`https://api.twitch.tv/helix/${path}`);

    for (const [k, v] of Object.entries(params)) {
      if (Array.isArray(v)) v.forEach(val => url.searchParams.append(k, val));
      else url.searchParams.set(k, v);
    }

    return fetch(url.toString(), {
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID!,
        "Authorization": `Bearer ${token}`,
      },
    });
  }

  let resp = await makeRequest(accessToken);

  if (resp.status === 401 && userId) {
    console.log(`Access token expired for user ${userId}`);

    const result = await db.query<{ refresh_token: string }>(
      "SELECT refresh_token FROM twitch_tokens WHERE twitch_user_id=$1",
      [userId]
    );

    if (!result.rows[0]?.refresh_token) {
      throw new Error("User must re-authenticate");
    }

    const refreshed = await refreshUserToken(result.rows[0].refresh_token);

    await db.query(
      `
        UPDATE twitch_tokens
        SET access_token=$1,
            refresh_token=$2,
            expires_at=NOW() + ($3 || ' seconds')::interval
        WHERE twitch_user_id=$4
      `,
      [
        refreshed.access_token,
        refreshed.refresh_token,
        refreshed.expires_in,
        userId,
      ]
    );

    resp = await makeRequest(refreshed.access_token);
  }

  if (!resp.ok) {
    throw new Error(`Helix user request failed: ${resp.status}`);
  }

  return resp.json();
}


export async function refreshUserToken(
  refreshToken: string
): Promise<TwitchTokenResponse> {
  const resp = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.TWITCH_CLIENT_ID!,
      client_secret: process.env.TWITCH_CLIENT_SECRET!,
    }),
  });

  if (!resp.ok) {
    throw new Error(`Failed to refresh token: ${resp.status}`);
  }

  return resp.json();
}

