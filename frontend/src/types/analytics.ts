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
};

export type Analytics = {
    recentWinners: LeaderboardEntry[];
    recentLosers: LeaderboardEntry[];
    topWinners: LeaderboardEntry[];
    topLosers: LeaderboardEntry[];
    topProfit: SingleEntry;
    topLost: SingleEntry;
};
