/**
 * Local development switches.
 *
 * TWITCH_MOCK=true replaces every call to Twitch (OAuth, Helix, EventSub) with an in-process fake
 * and enables the /api/dev control panel. It is refused outside NODE_ENV=development because the
 * dev routes allow logging in as the broadcaster without Twitch.
 */
export const IS_DEVELOPMENT = process.env.NODE_ENV === "development";
export const TWITCH_MOCK = process.env.TWITCH_MOCK === "true";

if (TWITCH_MOCK && !IS_DEVELOPMENT) {
  throw new Error("TWITCH_MOCK=true is only allowed when NODE_ENV=development");
}

const MOCK_WEBHOOK_SECRET = "mock-webhook-secret";
const MOCK_BROADCASTER_ID = "100000001";

if (TWITCH_MOCK && !process.env.TOKKI_USER_ID) {
  process.env.TOKKI_USER_ID = MOCK_BROADCASTER_ID;
}

/** Secret used to verify (and, in mock mode, sign) EventSub webhook messages. */
export function getWebhookSecret(): string | undefined {
  return process.env.TWITCH_WEBHOOK_SECRET || (TWITCH_MOCK ? MOCK_WEBHOOK_SECRET : undefined);
}
