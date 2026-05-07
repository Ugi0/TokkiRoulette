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
