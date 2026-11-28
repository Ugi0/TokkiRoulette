import crypto from "node:crypto";

// Twitch rejects (and we should too) messages older than 10 minutes to prevent replays.
const MAX_MESSAGE_AGE_MS = 10 * 60 * 1000;

export type EventSubHeaders = {
  messageId: string | undefined;
  timestamp: string | undefined;
  signature: string | undefined;
};

export function signEventSubMessage(secret: string, messageId: string, timestamp: string, rawBody: string): string {
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(messageId + timestamp + rawBody)
    .digest("hex");
  return `sha256=${hmac}`;
}

/**
 * Verifies a Twitch EventSub webhook message.
 * https://dev.twitch.tv/docs/eventsub/handling-webhook-events/#verifying-the-event-message
 */
export function verifyEventSubMessage(
  secret: string,
  headers: EventSubHeaders,
  rawBody: string,
  now = Date.now()
): boolean {
  const { messageId, timestamp, signature } = headers;
  if (!messageId || !timestamp || !signature) return false;

  const sentAt = Date.parse(timestamp);
  if (Number.isNaN(sentAt) || Math.abs(now - sentAt) > MAX_MESSAGE_AGE_MS) return false;

  const expected = Buffer.from(signEventSubMessage(secret, messageId, timestamp, rawBody));
  const actual = Buffer.from(signature);

  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}
