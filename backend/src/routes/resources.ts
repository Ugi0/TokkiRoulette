import fs from "fs";
import { IncomingMessage, ServerResponse } from "http";
import path from "path";
import { parseCookies } from "../utils/sessionCookie.js";
import { sessionExists } from "../services/db_queries.js";
import { IS_DEVELOPMENT } from "../services/devMode.js";

const MODEL_ROOT = "resources/";

const contentTypes: Record<string, string> = {
  ".json": "application/json",
  ".js": "text/javascript",
  ".moc3": "application/octet-stream",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".atlas": "text/plain",
};

export async function handleResourcesRoute(req: IncomingMessage, res: ServerResponse, url: URL) {
  const sessionId = parseCookies(req).session_id;

  if (!IS_DEVELOPMENT && !(sessionId && await sessionExists(sessionId))) {
    res.writeHead(401, { "Content-Type": "text/plain" });
    return res.end("Unauthorized");
  }

  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(url.pathname);
  } catch {
    res.writeHead(400, { "Content-Type": "text/plain" });
    return res.end("Invalid path");
  }

  const strippedPath = decodedPath.replace(/^\/resources/, "").replace(/^\/+/, "");
  const resolvedPath = path.resolve(MODEL_ROOT, strippedPath);

  if (!resolvedPath.startsWith(path.resolve(MODEL_ROOT) + path.sep)) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    return res.end("Invalid path");
  }

  // Directories must be rejected too: streaming one emits EISDIR, which crashed the process.
  const stat = await fs.promises.stat(resolvedPath).catch(() => null);
  if (!stat?.isFile()) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    return res.end("Not found");
  }

  const ext = path.extname(resolvedPath).toLowerCase();

  res.writeHead(200, {
    "Content-Type": contentTypes[ext] || "application/octet-stream",
    "Content-Length": stat.size,
    "Access-Control-Allow-Origin": "*",
  });

  const stream = fs.createReadStream(resolvedPath);
  stream.on("error", err => {
    console.error("Failed to stream resource:", err);
    res.destroy(err);
  });
  stream.pipe(res);
}
