import { StatsInterval, type LeaderboardEntry } from "../../types/analytics.ts";
import "./Leaderboard.css";
import { formatNet, netClassName, toNumber } from "../../utils/statisticsCommon.ts";
import { ProfileAvatar, ProfileName } from "../Profiles/ProfileAvatar";
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
      <header className="lb-header">
        <h3>{title}</h3>
      </header>

      <div className="lb-body">
        <ExpandableList
          data={data}
          expanded={expanded}
          renderItem={(entry) => {
            const totalNet = toNumber(entry.total_net);
            const betAmount = toNumber(entry.bet_amount);

            return (
              <div className="lb-entry" key={entry.user_id}>
                <ProfileAvatar className="lb-avatar" userId={entry.user_id} userName={entry.user_name} imageUrl={entry.profile_image_url} />

                <ProfileName className="lb-name" userId={entry.user_id} userName={entry.user_name} />

                <div className="lb-meta">
                  {LosersTotalBetTitle(betAmount, totalNet, interval)}
                </div>

                <div className={`lb-value ${netClassName(totalNet)}`}>
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
