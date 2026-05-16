import { IncomingMessage, ServerResponse } from "node:http";
import { getAppToken } from "../services/helix.js";
import { SIX_MONTHS } from "./auth.js";

const TWITCH_API = "https://api.twitch.tv/helix";

export default async function debugRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL
): Promise<IncomingMessage | ServerResponse | void> {

  if (!url.pathname.startsWith("/debug/twitch")) {
    res.writeHead(404);
    return res.end("Not Found");
  }

  if (process.env.DEBUG !== "true") {
    res.writeHead(403);
    return res.end("Debug is not enabled");
  }

  try {
    if (req.method === "GET" && url.pathname === "/debug/twitch/webhooks") {
      return await listWebhooks(res);
    }

    if (req.method === "DELETE" && url.pathname === "/debug/twitch/webhooks") {
      return await deleteWebhooks(req, res, url);
    }

    if (req.method === "GET" && url.pathname === "/debug/twitch/token") {
      const sessionId = "";
      res.setHeader("Set-Cookie", [
          `session_id=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SIX_MONTHS}`
      ]); 

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ status: "Spin result recorded" }));
    }

    res.writeHead(404);
    res.end("Not Found");

  } catch (err) {
    console.error(err);
    res.writeHead(500);
    res.end("Internal Server Error");
  }
}

async function listWebhooks(res: ServerResponse) {
  const subs = await fetchSubscriptions();

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(subs, null, 2));
}

async function deleteWebhooks(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL
) {
  const type = url.searchParams.get("type");
  const callbackContains = url.searchParams.get("callbackContains");
  const broadcasterId = url.searchParams.get("broadcaster_id");

  const subs = await fetchSubscriptions();

  const toDelete = subs.filter(sub => {
    if (type && sub.type !== type) return false;
    if (callbackContains && !sub.transport?.callback?.includes(callbackContains)) {
      return false;
    }
    if (broadcasterId && sub.condition?.broadcaster_user_id !== broadcasterId) {
      return false;
    }
    return true;
  });

  for (const sub of toDelete) {
    await deleteSubscription(sub.id);
  }

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({
    deleted: toDelete.map(s => ({
      id: s.id,
      type: s.type,
      callback: s.transport.callback,
    })),
  }, null, 2));
}

async function fetchSubscriptions(): Promise<any[]> {
  const res = await fetch(`${TWITCH_API}/eventsub/subscriptions`, {
    headers: await authHeaders(),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  const json = await res.json();
  return json.data ?? [];
}

async function deleteSubscription(id: string): Promise<void> {
  const res = await fetch(
    `${TWITCH_API}/eventsub/subscriptions?id=${id}`,
    {
      method: "DELETE",
      headers: await authHeaders(),
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to delete ${id}: ${await res.text()}`);
  }
}

async function authHeaders() {
  return {
    "Client-Id": process.env.TWITCH_CLIENT_ID!,
    "Authorization": `Bearer ${await getAppToken()}`,
  };
}