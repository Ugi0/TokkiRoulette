export const StatsInterval = {
    ONE_MONTH: { queryParam: "1m" },
    THREE_MONTHS: { queryParam: "3m" },
    SIX_MONTHS: { queryParam: "6m" },
    ONE_YEAR: { queryParam: "1y" },
    ALL: { queryParam: "all" },
    RECENT: { queryParam: "recent" },
} as const;

export type StatsInterval =
    (typeof StatsInterval)[keyof typeof StatsInterval]["queryParam"];

export type LeaderboardEntry = {
    user_Id: string;
    user_Name: string;
    profile_Image_URL: string | null;
    chat_Color: string | null;
    bet_Amount: number;
    total_Net: number;
    predictions_Count: number;
};

export type SingleEntry = {
    user_Id: string;
    user_Name: string;
    profile_Image_URL: string | null;
    chat_Color: string | null;
    prediction_Id: string;
    bet_Amount: number;
    won_Amount: number | null;
    net_Change: number;
};

export type Analytics = {
    recentWinners: LeaderboardEntry[];
    recentLosers: LeaderboardEntry[];
    topWinners: LeaderboardEntry[];
    topLosers: LeaderboardEntry[];
    topProfit: SingleEntry;
    topLost: SingleEntry;
};
