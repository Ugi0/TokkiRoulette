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
    const existingEntry = cache.get(id);

    for (const value of values) {
        if (!existingEntry) {
            cache.set(id, {
                predictionId: id,
                predictionStatus: [value]
            });
            continue;
        } else {
            if (existingEntry.predictionStatus.some(pred => pred.user_id === value.user_id)) {
                existingEntry.predictionStatus = existingEntry.predictionStatus.map(pred =>
                    pred.user_id === value.user_id ? value : pred
                );
            } else {
                existingEntry.predictionStatus.push(value);
            }
            cache.set(id, existingEntry);
            return;
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