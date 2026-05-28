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

export const Interval = {
    ONE_MONTH: {query_param: '1 month'},
    THREE_MONTHS: {query_param: '3 months'},
    SIX_MONTHS: {query_param: '6 months'},
    ONE_YEAR: {query_param: '1 year'},
    ALL: {query_param: 'ALL'},
    RECENT: {query_param: 'RECENT'}
} as const;

export type Interval = keyof typeof Interval;

export type Analytics = {
    leaderboardEntries: {
        topWinners: UserEntry[];
        topLosers: UserEntry[];
    }
    singleEntries: {
        topProfit: UserEntry[];
        topLost: UserEntry[];
    },
    interval: Interval;
};

export type PredictionEntry = {
    prediction_id: string;
    prediction_start_time: string;
    prediction_title: string;
}