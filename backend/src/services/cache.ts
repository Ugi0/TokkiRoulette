import { TwitchPredictionEndEvent } from "../types/events.js";
import { HookData, UserData } from "../types/hookData.js";

type CacheEntry = {
  predictionId: string;
  predictionStatus: UserPrediction[];
};

type UserPrediction = {
    user_id: string;
    user_name: string;
    bet_amount: number;
    won_amount: number | null;
    voted_option: string;
}

const cache = new Map<string, CacheEntry>();

export function cacheUserResults(id: string, values: UserPrediction[]) {
    for (const value of values) {
        const existingEntry = cache.get(id);
        if (!existingEntry) {
            cache.set(id, {
                predictionId: id,
                predictionStatus: [value]
            });
        } else {
            const existing = existingEntry.predictionStatus;
            const index = existing.findIndex(pred => pred.user_id === value.user_id);
            if (index !== -1) {
                existing[index] = value;
            } else {
                existing.push(value);
            }
            cache.set(id, existingEntry);
        }
    }
}

export function getCache(key: string): CacheEntry | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;

  return entry;
}

export function deleteCache(key: string) {
  cache.delete(key);
}

export async function getTotalPredictionResults(endEvent: TwitchPredictionEndEvent): Promise<HookData> {
  const { event } = endEvent;

  if (event.status !== "resolved") {
    throw new Error("Prediction not resolved");
  }

  const winningOptionId = event.winning_outcome_id;

  const totalPool = event.outcomes.reduce(
    (sum, o) => sum + o.channel_points,
    0
  );

  const winningOutcome = event.outcomes.find(
    o => o.id === winningOptionId
  );

  if (!winningOutcome) {
    throw new Error("Winning outcome not found");
  }

  const winningPool = winningOutcome.channel_points;

  const cached = getCache(event.id);

  if (!cached) {
    throw new Error("Missing cache for prediction");
  }

  const winners: UserData[] = [];
  const losers: UserData[] = [];

  const ratio =
    winningPool > 0 ? totalPool / winningPool : 0;

  for (const user of cached.predictionStatus) {
    const isWinner = user.voted_option === winningOptionId;

    let won_amount: number | null = null;

    if (isWinner && winningPool > 0) {
      won_amount =
        Math.floor(user.bet_amount * ratio) -
        user.bet_amount;
    }

    const result: UserData = {
      ...user,
      won_amount,
    };

    if (isWinner) {
      winners.push(result);
    } else {
      losers.push(result);
    }
  }

  const options = event.outcomes.map(o => ({
    option_id: o.id,
    title: o.title,
  }));

  return {
    prediction_id: event.id,
    winners,
    losers,
    options,
  };
}