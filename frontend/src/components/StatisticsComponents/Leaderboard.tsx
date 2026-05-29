import { StatsInterval, type LeaderboardEntry } from "../../types/analytics.ts";
import "./Leaderboard.css";
import { formatNet, netClassName, toNumber } from "../../utils/statisticsCommon.ts";
import { ExpandableList } from "./ExpandableList.tsx";
import { LosersTotalBetTitle } from "../../utils/statisticsTitles.ts";

type LeaderboardProps = {
    title: string;
    data: LeaderboardEntry[];
    interval: StatsInterval;
    expanded: boolean;
};

export default function Leaderboard({ title, data, interval, expanded }: LeaderboardProps) {
  return (
    <section className="leaderboard">
      <div className="header">
        <h2>{title}</h2>
      </div>

      <div className="body">
        <ExpandableList
          data={data}
          expanded={expanded}
          renderItem={(entry) => {
            const totalNet = toNumber(entry.total_net);
            const betAmount = toNumber(entry.bet_amount);

            return (
              <div className="entry" key={entry.user_id}>
                <img
                  className="pfp"
                  src={entry.profile_image_url ?? "/default-pfp.jpg"}
                  alt="˙◠˙"
                />

                <div
                  className="name"
                >
                  {entry.user_name}
                </div>

                <div className="bet">
                  {LosersTotalBetTitle(betAmount, totalNet, interval)}
                </div>

                <div className={`net ${netClassName(totalNet)}`}>
                  {formatNet(totalNet)}
                </div>
              </div>
            );
          }}
        />
      </div>
    </section>
  );
}