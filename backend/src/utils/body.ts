import { IncomingMessage } from "node:http";

const MAX_BODY_BYTES = 1024 * 1024; // 1 MB, far above any EventSub or spin payload

export class BodyTooLargeError extends Error {}

export function readRawBody(req: IncomingMessage, limit = MAX_BODY_BYTES): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;

    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > limit) {
        reject(new BodyTooLargeError(`Request body exceeds ${limit} bytes`));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

export async function getJsonBody(req: IncomingMessage): Promise<unknown> {
  return JSON.parse(await readRawBody(req));
}
