type SubscriptionType = {
    id: string;
    type: string;
    version: string;
    cost: number;
    condition: Record<string, string>;
    transport: {
        method: string;
        callback: string;
    };
    created_at: string;
}

export type TwitchPredictionBeginEvent = {
    subscription: SubscriptionType;
    event: {
        id: string;
        broadcaster_user_id: string;
        broadcaster_user_login: string;
        broadcaster_user_name: string;
        title: string;
        outcomes: {
            id: string;
            title: string;
            color: string;
        }[];
        started_at: string;
        locks_at: string;
    }
}

export type TwitchPredictionLockEvent = {
    subscription: SubscriptionType;
    event: {
        id: string;
        broadcaster_user_id: string;
        broadcaster_user_login: string;
        broadcaster_user_name: string;
        title: string;
        outcomes: PredictionOutcome[];
        started_at: string;
        locks_at: string;
    }
}

export type TwitchPredictionEndEvent = {
    subscription: SubscriptionType;
    event: {
        id: string;
        broadcaster_user_id: string;
        broadcaster_user_login: string;
        broadcaster_user_name: string;
        title: string;
        winning_outcome_id: string;
        outcomes: PredictionOutcome[];
        status: "resolved" | "canceled";
        started_at: string;
        ended_at: string;
    }
}

export type PredictionOutcome = {
    id: string;
    title: string;
    color: string;
    users: number;
    channel_points: number;
    top_predictors: TopPrediction[];
}

export type TopPrediction = {
    user_name: string;
    user_login: string;
    user_id: string;
    channel_points_won: number;
    channel_points_used: number;
}

export type TwitchPredictionEvent = TwitchPredictionBeginEvent | TwitchPredictionLockEvent | TwitchPredictionEndEvent;