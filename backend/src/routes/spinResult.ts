import { IncomingMessage, ServerResponse } from "http";
import { getJsonBody } from "../utils/body.js";
import { setPredictionRoulette, recordSpinResult } from "../services/db_updates.js";
import { checkForLockedPrediction, getPredictionOutcomeId, getUserSession } from "../services/db_queries.js";
import { resolveTwitchPrediction } from "../services/helix.js";
import { parseCookies, setSessionCookie } from "../utils/sessionCookie.js";
import sendJson from "../utils/sendJson.js";

type RouletteResult = {
  number: number;
  tags: string[];
};

function isRouletteResult(body: unknown): body is RouletteResult {
  if (typeof body !== "object" || body === null) return false;
  const { number, tags } = body as Record<string, unknown>;
  return (
    Number.isInteger(number) &&
    (number as number) >= 0 &&
    (number as number) <= 36 &&
    Array.isArray(tags) &&
    tags.every(t => typeof t === "string")
  );
}

export default async function spinResult(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL
): Promise<IncomingMessage | ServerResponse | void> {
  if (url.pathname !== "/spin-result") {
    res.writeHead(404, { "Content-Type": "text/plain" });
    return res.end("Not Found");
  }

  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "text/plain" });
    return res.end("Method Not Allowed");
  }

  let body: unknown;
  try {
    body = await getJsonBody(req);
  } catch {
    res.writeHead(400, { "Content-Type": "text/plain" });
    return res.end("Invalid request body");
  }

  if (!isRouletteResult(body)) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    return res.end("Invalid request body");
  }

  try {
    const sessionId = parseCookies(req).session_id;

    await recordSpinResult(body.number);

    const broadcasterSession = await getUserSession(process.env.TOKKI_USER_ID!);

    if (!sessionId || sessionId !== broadcasterSession) {
      return sendJson(res, 200, { status: "Spin result recorded" });
    }

    console.log("Authorized spin result received");
    setSessionCookie(res, sessionId);

    const lockedPredictionId = await checkForLockedPrediction();
    console.log("Checked for locked prediction, ID:", lockedPredictionId);

    if (lockedPredictionId === null) {
      return sendJson(res, 200, { status: "Spin result recorded" });
    }

    const winningOutcomeId = await getPredictionOutcomeId(lockedPredictionId, body.tags);

    if (winningOutcomeId === null) {
      console.warn(
        `No option of prediction ${lockedPredictionId} matches the spin tags ${JSON.stringify(body.tags)}; leaving it for manual resolution`
      );
      return sendJson(res, 200, { status: "no-matching-option" });
    }

    // Mark before resolving: Twitch's END webhook can arrive before the PATCH call returns,
    // and endPrediction reads this flag to decide whether results count as roulette results.
    await setPredictionRoulette(lockedPredictionId, true);

    try {
      await resolveTwitchPrediction(lockedPredictionId, winningOutcomeId);
    } catch (err) {
      // Undo the mark so the prediction can be picked up again by the next spin.
      await setPredictionRoulette(lockedPredictionId, false).catch(() => {});
      throw err;
    }

    return sendJson(res, 200, { status: "authorized" });
  } catch (err) {
    console.error("Error recording spin result:", err);
    res.writeHead(500, { "Content-Type": "text/plain" });
    return res.end("Internal Server Error");
  }
}
