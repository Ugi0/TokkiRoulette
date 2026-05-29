import type { Analytics, PredictionDetails, StatsInterval } from "../types/analytics";

const endpoint = "/api/analytics/data";

export async function loadIntervals(setAvailableIntervals: React.Dispatch<React.SetStateAction<StatsInterval[]>>) {
    const response = await fetch("/api/analytics/intervals");
    const data = await response.json();
    setAvailableIntervals(data);
}

type loadIndividualProps = {
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
    setError: React.Dispatch<React.SetStateAction<string | null>>;
    setAnalytics: React.Dispatch<React.SetStateAction<Analytics | null>>;
    interval: StatsInterval;
}
    
export async function loadIndividual({ setLoading, setError, setAnalytics, interval }: loadIndividualProps) {
    try {
        setLoading(true);
        setError(null);

        const separator = endpoint.includes("?") ? "&" : "?";
        const requestUrl = `${endpoint}${separator}interval=${interval}`;


        const response = await fetch(requestUrl, {
            credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error ?? "Failed to load data;");
        }

        setAnalytics(data as Analytics | null);
    } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
        setLoading(false);
    }
}

export async function loadPredictionDetails(predictionId: string): Promise<PredictionDetails | null> {
    try {
        const response = await fetch(`/api/analytics/prediction/${predictionId}`);

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error ?? "Failed to load prediction details;");
        }

        return data as PredictionDetails | null;
    } catch (err) {
        console.error(err instanceof Error ? err.message : "Unknown error");
        return null;
    }
}