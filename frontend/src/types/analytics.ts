export const StatsInterval = {
    ONE_MONTH: { queryParam: "ONE_MONTH" },
    THREE_MONTHS: { queryParam: "THREE_MONTHS" },
    SIX_MONTHS: { queryParam: "SIX_MONTHS" },
    ONE_YEAR: { queryParam: "ONE_YEAR" },
    ALL: { queryParam: "ALL" },
    RECENT: { queryParam: "RECENT" },
} as const;

export type StatsInterval =
    (typeof StatsInterval)[keyof typeof StatsInterval]["queryParam"];

export type LeaderboardEntry = {
    user_id: number;
    user_name: string;
    profile_image_url?: string | null;
    chat_color?: string | null;
    bet_amount?: number | string;
    total_net: number | string;
    predictions_count: number | string;
};

export type SingleEntry = {
    user_id: number;
    user_name: string;
    profile_image_url?: string | null;
    chat_color?: string | null;
    prediction_id: string;
    bet_amount: number;
    won_amount: number | null;
    net_change: number | string;
    bet_time?: string;
};

export type Analytics = {
    leaderboardEntries: {
        topWinners: LeaderboardEntry[];
        topLosers: LeaderboardEntry[];
    }
    singleEntries: {
        topProfit: SingleEntry[];
        topLost: SingleEntry[];
    },
    interval: StatsInterval;
    predictions: PredictionEntry[];
};

export type PredictionEntry = {
    prediction_id: string;
    prediction_start_time: string;
    prediction_title: string;
};
