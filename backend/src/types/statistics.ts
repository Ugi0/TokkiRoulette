export type UserLeaders = {
    user_id: number;
    user_name: string;
    profile_image_url?: string | null;
    chat_color?: string | null;
    bet_amount?: number | string;
    total_net: number | string;
    predictions_count: number | string;
};

export type Individual = {
    user_id: number;
    user_name: string;
    profile_image_url?: string | null;
    chat_color?: string | null;
    prediction_id: string;
    bet_amount: number;
    won_amount: number | null;
    net_change: number | string;
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
        topWinners: UserLeaders[];
        topLosers: UserLeaders[];
    }
    singleEntries: {
        topProfit: Individual;
        topLost: Individual;
    }
};
