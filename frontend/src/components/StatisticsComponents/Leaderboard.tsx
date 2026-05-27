import { type LeaderboardEntry } from "../../types/analytics.ts";
import "./Leaderboard.css";
import { formatNet, netClassName, toNumber } from "../../utils/statisticsCommon.ts";

type LeaderboardProps = {
    title: string;
    data: LeaderboardEntry[];
};

export default function Leaderboard({ title, data }: LeaderboardProps) {

    return (
        <section className="leaderboard">
            <div className="header">
                <h2>{title}</h2>
            </div>

            <div className="body">
                {data.map((entry) => {
                    const totalNet = toNumber(entry.total_net);
                    const betAmount = toNumber(entry.bet_amount);

                    return (
                    <div className="entry" key={entry.user_id}>
                        <img
                            className="pfp"
                            src={entry.profile_image_url ?? "/default-pfp.jpg"}
                            alt={"/default-pfp.jpg"}
                        />
                        <div
                            className="name"
                            style={{ color: entry.chat_color ?? "#000000" }}
                        >
                            {entry.user_name}
                        </div>
                        <div className="bet">Bet {betAmount} $TKS</div>
                        <div
                            className={`net ${netClassName(totalNet)}`}
                        >
                            {formatNet(totalNet)}
                        </div>
                    </div>
                )})}
            </div>
        </section>
    );
}
