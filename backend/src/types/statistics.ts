export type UserLeaders = {
    user_id: number;
    user_name: string;
    total_net: number;
    predictions_count: number;
};

export type Individual = {
    user_id: number;
    user_name: string;
    prediction_id: number;
    bet_amount: number;
    won_amount: number;
    net_change: number;
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
