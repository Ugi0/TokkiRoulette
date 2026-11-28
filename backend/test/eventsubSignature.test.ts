import { test } from "node:test";
import assert from "node:assert/strict";
import { signEventSubMessage, verifyEventSubMessage } from "../src/utils/eventsubSignature.js";

const secret = "test-secret";
const body = JSON.stringify({ subscription: { type: "channel.prediction.begin" }, event: { id: "abc" } });
const now = Date.parse("2026-11-28T12:00:00Z");
const timestamp = new Date(now).toISOString();

function headers(overrides: Partial<Record<"messageId" | "timestamp" | "signature", string | undefined>> = {}) {
  const messageId = overrides.messageId ?? "msg-1";
  const ts = overrides.timestamp ?? timestamp;
  return {
    messageId,
    timestamp: ts,
    signature: "signature" in overrides ? overrides.signature : signEventSubMessage(secret, messageId, ts, body),
  };
}

test("accepts a correctly signed message", () => {
  assert.equal(verifyEventSubMessage(secret, headers(), body, now), true);
});

test("rejects a tampered body", () => {
  assert.equal(verifyEventSubMessage(secret, headers(), body.replace("abc", "xyz"), now), false);
});

test("rejects a signature made with another secret", () => {
  const h = headers({ signature: signEventSubMessage("other", "msg-1", timestamp, body) });
  assert.equal(verifyEventSubMessage(secret, h, body, now), false);
});

test("rejects missing headers", () => {
  assert.equal(verifyEventSubMessage(secret, headers({ signature: undefined }), body, now), false);
});

test("rejects messages older than 10 minutes (replay protection)", () => {
  const old = new Date(now - 11 * 60 * 1000).toISOString();
  const h = headers({ timestamp: old, signature: signEventSubMessage(secret, "msg-1", old, body) });
  assert.equal(verifyEventSubMessage(secret, h, body, now), false);
});
