export type UserEntry = {
    user_id: number;
    user_name: string;
    profile_image_url?: string | null;
    chat_color?: string | null;
    prediction_id: string;
    bet_amount: number;
    won_amount: number | null;
    net_change: number | string;
    total_net: number | string;
    predictions_count: number | string;
    bet_time?: string;
};

export type Interval =
    | "CURRENT_MONTH"
    | "LAST_MONTH"
    | "LAST_3_MONTHS"
    | "LAST_6_MONTHS"
    | "LAST_12_MONTHS"
    | "ALL_TIME"
    | "RECENT";

export type Analytics = {
    leaderboardEntries: {
        topWinners: UserEntry[];
        topLosers: UserEntry[];
    }
    singleEntries: {
        topProfit: UserEntry[];
        topLost: UserEntry[];
    }
    winRatios: {
        highest: WinRatioEntry[];
        lowest: WinRatioEntry[];
    }
    interval: Interval;
};

export type PredictionEntry = {
    prediction_id: string;
    prediction_start_time: string;
    prediction_title: string;
}

export type WinRatioEntry = {
    user_id: number;
    user_name: string;
    profile_image_url?: string | null;
    win_percentage: number;
    total_predictions: number;
    won_predictions: number;
}

export type PredictionDetails = {
    prediction_id: string;
    prediction_title: string;
    prediction_start_time: string;
    options: {
        won: boolean;
        title: string;
        votes: UserEntry[];
    }[];
}