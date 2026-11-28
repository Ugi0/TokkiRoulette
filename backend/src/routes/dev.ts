/**
 * Development-only routes for driving the app without Twitch. Mounted only when TWITCH_MOCK=true
 * (which itself requires NODE_ENV=development). Open http://localhost/api/dev for the control panel.
 */
import crypto from "node:crypto";
import { IncomingMessage, ServerResponse } from "node:http";
import sendJson from "../utils/sendJson.js";
import { getJsonBody } from "../utils/body.js";
import { parseCookies, setSessionCookie } from "../utils/sessionCookie.js";
import { saveUserSession, setPredictionRoulette } from "../services/db_updates.js";
import { getPredictionOutcomeId, getUserSession } from "../services/db_queries.js";
import { clearPendingMessages } from "./wsServer.js";
import {
  MockTwitchError,
  PREDICTION_TEMPLATES,
  cancelPrediction,
  getMockBroadcaster,
  getMockState,
  getMockViewer,
  lockPrediction,
  placeRandomBets,
  resolvePrediction,
  startPrediction,
} from "../services/twitchMock.js";

export default async function devRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL
): Promise<IncomingMessage | ServerResponse | void> {
  const route = `${req.method} ${url.pathname}`;

  try {
    switch (route) {
      case "GET /dev":
      case "GET /dev/":
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        return res.end(PANEL_HTML);

      case "GET /dev/state":
        return sendJson(res, 200, await getState(req));

      case "GET /dev/login": {
        const user = url.searchParams.get("as") === "viewer" ? getMockViewer() : getMockBroadcaster();
        const sessionId = crypto.randomUUID();
        await saveUserSession(
          { access_token: "mock-access", refresh_token: "mock-refresh", expires_in: 3600 * 24 * 365, token_type: "bearer" },
          { id: user.id, login: user.login, display_name: user.name },
          sessionId
        );
        setSessionCookie(res, sessionId);
        res.writeHead(302, { Location: url.searchParams.get("redirect") === "panel" ? "/api/dev" : "/" });
        return res.end();
      }

      case "GET /dev/logout":
        setSessionCookie(res, "", 0);
        res.writeHead(302, { Location: "/api/dev" });
        return res.end();

      case "POST /dev/prediction": {
        const body = (await readBody(req)) as { template?: string; title?: string; outcomes?: string[] };
        const template = PREDICTION_TEMPLATES[body.template ?? "color"];
        const title = body.title || template?.title || "Mock prediction";
        const outcomes = body.outcomes?.length ? body.outcomes : template?.outcomes;
        if (!outcomes) return sendJson(res, 400, { error: `Unknown template ${body.template}` });
        await startPrediction(title, outcomes);
        return sendJson(res, 200, getMockState());
      }

      case "POST /dev/prediction/bets": {
        const body = (await readBody(req)) as { count?: number };
        const placed = await placeRandomBets(Number(body.count) || 5);
        return sendJson(res, 200, { placed, state: getMockState() });
      }

      case "POST /dev/prediction/lock":
        await lockPrediction();
        return sendJson(res, 200, getMockState());

      case "POST /dev/prediction/resolve": {
        const body = (await readBody(req)) as { outcome_id?: string };
        if (!body.outcome_id) return sendJson(res, 400, { error: "outcome_id is required" });
        await resolvePrediction(body.outcome_id);
        return sendJson(res, 200, getMockState());
      }

      case "POST /dev/prediction/cancel":
        await cancelPrediction();
        return sendJson(res, 200, getMockState());

      case "POST /dev/simulate": {
        const body = (await readBody(req)) as { rounds?: number };
        const rounds = Math.min(Math.max(Number(body.rounds) || 1, 1), 50);
        const summary = [];
        for (let i = 0; i < rounds; i++) summary.push(await simulateRound());
        // Simulated rounds would otherwise be queued for the broadcaster and shown after their next spin.
        clearPendingMessages();
        return sendJson(res, 200, { rounds: summary });
      }
    }

    return sendJson(res, 404, { error: `No dev route for ${route}` });
  } catch (err) {
    if (err instanceof MockTwitchError) {
      return sendJson(res, 409, { error: err.message });
    }
    console.error("Dev route error:", err);
    return sendJson(res, 500, { error: err instanceof Error ? err.message : String(err) });
  }
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  try {
    return await getJsonBody(req);
  } catch {
    return {};
  }
}

async function getState(req: IncomingMessage) {
  const sessionId = parseCookies(req).session_id;
  const broadcaster = getMockBroadcaster();
  const broadcasterSession = await getUserSession(broadcaster.id);

  let you = "logged out";
  if (sessionId && sessionId === broadcasterSession) you = `broadcaster (${broadcaster.name})`;
  else if (sessionId && sessionId === (await getUserSession(getMockViewer().id))) you = `viewer (${getMockViewer().name})`;
  else if (sessionId) you = "unknown/stale session";

  return { you, prediction: getMockState(), templates: PREDICTION_TEMPLATES };
}

/** Same tags the frontend's RouletteGen produces for the options we use in templates. */
function tagsForNumber(n: number): string[] {
  if (n === 0) return ["green"];
  const red = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
  return [
    red.has(n) ? "red" : "black",
    n % 2 === 0 ? "even" : "odd",
    n <= 12 ? "1st 12" : n <= 24 ? "2nd 12" : "3rd 12",
    n <= 18 ? "low" : "high",
  ];
}

/** A full roulette round: begin -> bets -> lock -> spin -> resolve, as if the broadcaster spun the wheel. */
async function simulateRound() {
  const templateNames = Object.keys(PREDICTION_TEMPLATES);
  const template = PREDICTION_TEMPLATES[templateNames[Math.floor(Math.random() * templateNames.length)]];

  const prediction = await startPrediction(template.title, template.outcomes);
  await placeRandomBets(8 + Math.floor(Math.random() * 12));
  await lockPrediction();

  const number = Math.floor(Math.random() * 37);
  const outcomeId = await getPredictionOutcomeId(prediction.id, tagsForNumber(number));

  if (!outcomeId) {
    await cancelPrediction();
    return { title: template.title, number, result: "canceled (no matching option)" };
  }

  await setPredictionRoulette(prediction.id, true);
  await resolvePrediction(outcomeId);

  const winner = prediction.outcomes.find(o => o.id === outcomeId)!;
  return { title: template.title, number, result: `resolved: ${winner.title}` };
}

const PANEL_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Tokki Roulette – Twitch mock</title>
<style>
  body { background:#0e0e10; color:#efeff1; font-family: system-ui, sans-serif; max-width: 900px; margin: 2rem auto; padding: 0 1rem; }
  h1 { color:#9147ff; margin-bottom: .25rem; }
  section { background:#18181b; border-radius:8px; padding:1rem 1.25rem; margin:1rem 0; }
  button, select, input { background:#2f2f35; color:#efeff1; border:1px solid #444; border-radius:4px; padding:.4rem .8rem; margin:.15rem; font-size: .95rem; }
  button:hover { background:#9147ff; cursor:pointer; }
  a { color:#bf94ff; }
  pre { background:#000; padding:.75rem; border-radius:6px; overflow:auto; max-height: 320px; font-size: .85rem; }
  .muted { color:#adadb8; font-size:.9rem; }
  .outcome { display:inline-block; margin-right:.5rem; }
</style>
</head>
<body>
<h1>Twitch mock control panel</h1>
<p class="muted">TWITCH_MOCK=true: no requests go to Twitch. Events below are delivered to <code>/api/webhooks/twitch</code> as signed EventSub messages.</p>

<section>
  <h3>1. Session</h3>
  <p>You are: <strong id="you">…</strong></p>
  <a href="/api/dev/login?as=broadcaster&redirect=panel"><button>Log in as broadcaster</button></a>
  <a href="/api/dev/login?as=viewer&redirect=panel"><button>Log in as viewer</button></a>
  <a href="/api/dev/logout"><button>Log out</button></a>
  <p class="muted">Only the broadcaster's spins resolve predictions and receive the results panel.</p>
</section>

<section>
  <h3>2. Prediction (what the streamer & chat do on Twitch)</h3>
  <select id="template"></select>
  <button onclick="post('/api/dev/prediction', { template: val('template') })">Start prediction</button>
  <input id="betCount" type="number" value="8" min="1" max="24" style="width:4rem" />
  <button onclick="post('/api/dev/prediction/bets', { count: Number(val('betCount')) })">Place random bets</button>
  <button onclick="post('/api/dev/prediction/lock')">Lock</button>
  <button onclick="post('/api/dev/prediction/cancel')">Cancel</button>
  <div id="resolveButtons" style="margin-top:.5rem"></div>
  <p class="muted">To test the real flow: start, bet, lock, then open <a href="/" target="_blank">the roulette page</a> as the broadcaster and spin. The mock resolves the prediction ~1.5s later, like Twitch does.</p>
</section>

<section>
  <h3>3. Seed analytics data</h3>
  <input id="rounds" type="number" value="5" min="1" max="50" style="width:4rem" />
  <button onclick="post('/api/dev/simulate', { rounds: Number(val('rounds')) })">Simulate full roulette rounds</button>
  <a href="/analytics" target="_blank">Open analytics</a>
</section>

<section>
  <h3>State</h3>
  <pre id="state"></pre>
  <h3>Last response</h3>
  <pre id="log"></pre>
</section>

<script>
  const val = id => document.getElementById(id).value;
  async function post(path, body) {
    const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) });
    const text = await res.text();
    document.getElementById('log').textContent = res.status + ' ' + text;
    refresh();
  }
  async function refresh() {
    const state = await (await fetch('/api/dev/state')).json();
    document.getElementById('you').textContent = state.you;
    document.getElementById('state').textContent = JSON.stringify(state.prediction, null, 2);
    const select = document.getElementById('template');
    if (!select.options.length) {
      for (const [key, t] of Object.entries(state.templates)) select.add(new Option(key + ': ' + t.outcomes.join(' / '), key));
    }
    const box = document.getElementById('resolveButtons');
    box.innerHTML = '';
    const p = state.prediction;
    if (p && (p.status === 'active' || p.status === 'locked')) {
      box.append('Resolve manually (as streamer on Twitch): ');
      for (const o of p.outcomes) {
        const b = document.createElement('button');
        b.textContent = o.title;
        b.onclick = () => post('/api/dev/prediction/resolve', { outcome_id: o.id });
        box.append(b);
      }
    }
  }
  refresh();
</script>
</body>
</html>`;
