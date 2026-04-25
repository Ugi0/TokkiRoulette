import db from "./db.js";
import type { TwitchUser, TwitchTokenResponse } from "../types/twitch.js";

export async function saveUserToken(
  user: TwitchUser,
  token: TwitchTokenResponse
): Promise<void> {
  console.log(user);

  await db.query(
    `
      INSERT INTO twitch_tokens (
        twitch_user_id,
        twitch_login,
        access_token,
        refresh_token,
        expires_at
      )
      VALUES ($1, $2, $3, $4, NOW() + ($5 || ' seconds')::interval)
      ON CONFLICT (twitch_user_id)
      DO UPDATE SET
        twitch_login = EXCLUDED.twitch_login,
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        expires_at = EXCLUDED.expires_at
    `,
    [
      user.id,
      user.login,
      token.access_token,
      token.refresh_token,
      token.expires_in,
    ]
  );
}