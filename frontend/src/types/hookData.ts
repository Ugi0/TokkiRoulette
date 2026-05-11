export type HookData = {
    prediction_id: string;
    winners: UserData[];
    losers: UserData[];
    options: {
        title: string;
    }[];
};

export type UserData = {
    user_id: string;
    user_name: string;
    bet_amount: number;
    won_amount: number | null;
    voted_option: string;
}