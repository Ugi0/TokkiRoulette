import { IncomingMessage, ServerResponse } from "http";

const footerTexts: string[] = [
  "The house always wins. TokkiCorp has… extensive data on that.",
  "Remember to gamble responsibly. If you lose, it's not our fault. Probably.",
  "If you think you've found a pattern, congratulations! You've just won a free trip to the bottom of the sea!",
  "90% of gambling addicts quit right before they win it big. Don't be that 90%.",
  "Gambing addiction is only a problem if you lose. If you keep gambling, you're bound to win eventually. Right?",
  "TokkiCorp makes no guarantees about the accuracy of our gambling advice. Make sure to read the fine print before you gamble.",
  "Quitting while you're ahead is a myth. The only way to win is to keep playing until you lose everything.",
  "Forget about luck. The only thing that matters in gambling is the house edge. And TokkiCorp has a very big edge.",
  "TokkiCorp is always right. Even when it's wrong. Especially when it's wrong.",
  "The wheel has no memory. TokkiCorp, however, remembers everything.",
  "This roulette is certified 100% fair by TokkiCorp's independent auditing department, TokkiCorp.",
  "Your losses have been recorded for quality assurance and the monthly report.",
  "Past performance is not indicative of future results. Neither is your gut feeling.",
  "Red came up five times in a row. That's either a sign or a coincidence. TokkiCorp profits either way.",
  "Doubling your bet after a loss is called a strategy. Doing it twice is called a lifestyle.",
  "Someone has to be at the bottom of the leaderboard. TokkiCorp thanks you for your service.",
  "Every lost channel point goes directly towards TokkiCorp's carrot research program.",
  "The odds are never in your favor, but they are always in our spreadsheet.",
  "TokkiCorp is not responsible for any lost channel points, dignity, or friendships.",
  "It's not gambling if you call it an investment in content.",
  "Feeling lucky? TokkiCorp's legal department advises against feelings.",
  "The wheel is totally not rigged. We checked. Twice. With our eyes closed.",
  "Your win rate has been reviewed by our analysts. They would like to remain anonymous.",
  "Green is a rare result indeed. Like a TokkiCorp refund.",
  "Behind every big win is a spreadsheet at TokkiCorp quietly adjusting its expectations.",
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