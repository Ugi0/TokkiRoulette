import fs from "fs";
import { IncomingMessage, ServerResponse } from "http";
import path from "path";
import { parseCookies } from "./spinResult.js";

const MODEL_ROOT = path.join(process.cwd(), "resources/");
console.log(MODEL_ROOT)

export async function handleResourcesRoute(req: IncomingMessage, res: ServerResponse, url: URL) {
  const cookies = parseCookies(req);
  const sessionId = cookies.session_id;

  if (!sessionId) {
  res.writeHead(401, { "Content-Type": "text/plain" });
    return res.end("Unauthorized");
  }

  const decodedPath = decodeURIComponent(url.pathname);
  let strippedPath = decodedPath.replace(/^\/resources/, "");

  const safePath = path.normalize(strippedPath);

  if (safePath.includes("..")) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    return res.end("Invalid path");
  }

  const filePath = path.join(MODEL_ROOT, safePath);

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    return res.end("Not found");
  }

  const ext = path.extname(filePath).toLowerCase();

  const contentTypes: Record<string, string> = {
    ".json": "application/json",
    ".moc3": "application/octet-stream",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".atlas": "text/plain",
    ".physics3.json": "application/json",
  };

  const contentType = contentTypes[ext] || "application/octet-stream";

  res.writeHead(200, {
    "Content-Type": contentType,
    "Access-Control-Allow-Origin": "*",
  });

  fs.createReadStream(filePath).pipe(res);
}