import "./Leaderboard.css";
import "./IntervalMenu.css";
import { formatNet, toNumber } from "../../utils/statisticsCommon.ts";
import type { SingleEntry } from "../../types/analytics.ts";

type IndividualProps = {
    title: string;
    data: SingleEntry;
};

export default function Individual({ title, data }: IndividualProps) {
    const netChange = toNumber(data.net_change);

    return (
        <section className="leaderboard">
            <div className="header">
                <h2>{title}</h2>
            </div>

            <div className="body">
                <div className="entry" key={data.user_id}>
                    <img
                        className="pfp"
                        src={data.profile_image_url ?? "/default-pfp.jpg"}
                        alt={"/default-pfp.jpg"}
                    />
                    <div
                        className="name"
                        style={{ color: data.chat_color ?? "#000000" }}
                    >
                        {data.user_name}
                    </div>
                    <div className="bet">Bet {data.bet_amount} $TKS</div>
                    <div
                        className={`net ${netChange < 0 ? "negative" : netChange > 0 ? "positive" : ""}`}
                    >
                        {formatNet(netChange)}
                    </div>
                </div>
            </div>
        </section>
    );
}
