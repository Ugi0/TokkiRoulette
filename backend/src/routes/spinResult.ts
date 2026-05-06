import { IncomingMessage, ServerResponse } from "http";
import { getJsonBody } from "./twitchWebhooks.js";
import { markPredictionAsRoulette, recordSpinResult } from "../services/db_updates.js";
import { checkForLockedPrediction, getUserSession } from "../services/db_queries.js";
import { SIX_MONTHS } from "./auth.js";
import { handlePredictionEndPush } from "../services/pushToHook.js";

type RouletteResult = {
  number: number;
  tags: string[];
};

export default async function spinResult(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL
): Promise<IncomingMessage | ServerResponse | void> {
    if (url.pathname === "/spin-result") {
        if (req.method !== "POST") {
            res.writeHead(405, { "Content-Type": "text/plain" });
            return res.end("Method Not Allowed");
        }

        try {
            const cookies = parseCookies(req);
            const sessionId = cookies.session_id;

            const rawBody = await getJsonBody(req);
            const body = rawBody as RouletteResult;

            if (typeof body.number !== "number") {
                res.writeHead(400, { "Content-Type": "text/plain" });
                return res.end("Invalid request body");
            }

            const landedNumber = body.number;

            res.writeHead(200, { "Content-Type": "text/plain" });
            return res.end(JSON.stringify({ status: "authorized" }));

            /*await recordSpinResult(landedNumber);

            if (sessionId !== null && sessionId === await getUserSession(process.env.TOKKI_USER_ID!)) {
                const lockedPredictionId = await checkForLockedPrediction();

                res.setHeader("Set-Cookie", [
                    `session_id=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SIX_MONTHS}`
                ]); 

                if (lockedPredictionId === null) {
                    res.writeHead(200, { "Content-Type": "text/plain" });
                    return res.end(JSON.stringify({ status: "Spin result recorded" }));
                }

                await markPredictionAsRoulette(lockedPredictionId);

                res.writeHead(200, { "Content-Type": "text/plain" });
                return res.end(JSON.stringify({ status: "authorized" }));
            }

            res.writeHead(200, { "Content-Type": "text/plain" });
            return res.end(JSON.stringify({ status: "Spin result recorded" }));*/
        }
        catch (err) {
            console.error("Error recording spin result:", err);
            res.writeHead(500, { "Content-Type": "text/plain" });
            return res.end("Internal Server Error");
        }
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    return res.end("Not Found");
}

export function parseCookies(req: IncomingMessage): Record<string, string> {
  const header = req.headers.cookie;
  if (!header) return {};

  return Object.fromEntries(
    header.split("; ").map(cookie => {
      const index = cookie.indexOf("=");
      const name = cookie.substring(0, index);
      const value = cookie.substring(index + 1);
      return [name, decodeURIComponent(value)];
    })
  );
}