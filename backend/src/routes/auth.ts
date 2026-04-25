import { IncomingMessage, ServerResponse } from "node:http";
import { URL } from "node:url";
import crypto from "node:crypto";

import sendJson from "../utils/sendJson.js";
import { saveUserToken } from "../services/tokens.js";
import type { TwitchUser, TwitchTokenResponse } from "../types/twitch.js";
import { HelixUsersResponse } from "../types/helix.js";

/**
 * Tracks pending OAuth states to protect against CSRF.
 * In production, consider expiring states or storing them in Redis.
 */
const pendingStates = new Set<string>();

export default async function authRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL
): Promise<IncomingMessage | ServerResponse | void> {
  if (url.pathname === "/auth/login") {
    const state = crypto.randomUUID();
    pendingStates.add(state);

    const authUrl = new URL("https://id.twitch.tv/oauth2/authorize");
    authUrl.searchParams.set("client_id", requiredEnv("TWITCH_CLIENT_ID"));
    authUrl.searchParams.set("redirect_uri", requiredEnv("TWITCH_REDIRECT_URI"));
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set(
      "scope",
      "analytics:read:extensions user:read:email bits:read"
    );
    authUrl.searchParams.set("state", state);

    res.writeHead(302, { Location: authUrl.toString() });
    return res.end();
  }

  if (url.pathname === "/auth/callback") {
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code || !state) {
      return sendJson(res, 400, { error: "Missing code or state" });
    }

    if (!pendingStates.has(state)) {
      return sendJson(res, 400, { error: "Invalid OAuth state" });
    }

    pendingStates.delete(state);

    const tokenData: TwitchTokenResponse =
      await exchangeCodeForToken(code);

    const userData: TwitchUser = await getUserProfile(tokenData.access_token);

    if (!userData) {
      return sendJson(res, 500, { error: "Failed to fetch user profile" });
    }

    await saveUserToken(userData, tokenData);

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(renderSuccessPage(userData.display_name ?? userData.login));
  }

  /* -------------------------------- FALLBACK ------------------------------ */

  sendJson(res, 404, { error: "Not found" });
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is not set`);
  }
  return value;
}

function renderSuccessPage(username: string): string {
  return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Twitch Authentication Successful</title>
  <style>
    body {
      background: #0e0e10;
      color: #fff;
      font-family: Arial, sans-serif;
      text-align: center;
      padding-top: 5rem;
    }
    .box {
      display: inline-block;
      padding: 2rem 3rem;
      background: #18181b;
      border-radius: 12px;
      box-shadow: 0 0 20px rgba(0,0,0,0.4);
    }
    h1 { color: #9147ff; }
  </style>
</head>
<body>
  <div class="box">
    <h1>✅ Authentication Successful</h1>
    <p>Welcome, <strong>${escapeHtml(username)}</strong>!</p>
    <p>Your Twitch account is now linked.</p>
    <p>You may close this window.</p>
  </div>
</body>
</html>
`;
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


export async function exchangeCodeForToken(
  code: string
): Promise<TwitchTokenResponse> {
  const resp = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.TWITCH_CLIENT_ID!,
      client_secret: process.env.TWITCH_CLIENT_SECRET!,
      code,
      grant_type: "authorization_code",
      redirect_uri: process.env.TWITCH_REDIRECT_URI!,
    }),
  });

  if (!resp.ok) {
    throw new Error(`Exchange code failed: ${resp.status}`);
  }

  return resp.json();
}

export async function getUserProfile(
  accessToken: string
): Promise<TwitchUser> {
  const resp = await fetch("https://api.twitch.tv/helix/users", {
    headers: {
      "Client-ID": process.env.TWITCH_CLIENT_ID!,
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!resp.ok) {
    throw new Error(`User profile failed: ${resp.status}`);
  }

  const json = (await resp.json()) as HelixUsersResponse;
  return json.data?.[0] ?? null;
}


