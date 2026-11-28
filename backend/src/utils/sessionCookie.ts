import { IncomingMessage, ServerResponse } from "node:http";
import { IS_DEVELOPMENT } from "../services/devMode.js";

export const SIX_MONTHS = 6 * 30 * 24 * 60 * 60;

/**
 * Sets the session cookie. `Secure` is dropped in development so the cookie also works when the
 * dev server is opened over plain http on a LAN address (browsers only exempt "localhost").
 */
export function setSessionCookie(res: ServerResponse, sessionId: string, maxAge = SIX_MONTHS) {
  const secure = IS_DEVELOPMENT ? "" : " Secure;";
  res.setHeader("Set-Cookie", [
    `session_id=${encodeURIComponent(sessionId)}; Path=/; HttpOnly;${secure} SameSite=Lax; Max-Age=${maxAge}`
  ]);
}

export function parseCookies(req: IncomingMessage): Record<string, string> {
  const header = req.headers.cookie;
  if (!header) return {};

  const cookies: Record<string, string> = {};

  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;

    const name = part.substring(0, index).trim();
    const value = part.substring(index + 1).trim();

    try {
      cookies[name] = decodeURIComponent(value);
    } catch {
      cookies[name] = value;
    }
  }

  return cookies;
}
