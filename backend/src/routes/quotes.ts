import { IncomingMessage, ServerResponse } from "http";

const footerTexts: string[] = [
  "The house always wins. TokkiCorp has… extensive data on that.",
  "Remember to gamble responsibly. If you lose, it's not our fault. Probably.",
  "If you think you've found a pattern, congratulations! You've just won a free trip to the bottom of the sea!",
]

export async function handleQuotesRoute(req: IncomingMessage, res: ServerResponse, url: URL) {
    if (req.method !== "GET") {
        res.writeHead(405, { "Content-Type": "text/plain" });
        return res.end("Method Not Allowed");
    }

    const now = new Date();
    const dateKey = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}`;

    let hash = 0;
    for (let i = 0; i < dateKey.length; i++) {
        hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0;
    }

    const index = hash % footerTexts.length;
    const text = footerTexts[index];

    res.writeHead(200, { "Content-Type": "text/plain" });
    return res.end(text);
}