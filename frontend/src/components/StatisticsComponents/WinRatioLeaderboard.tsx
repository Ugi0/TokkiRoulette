import type { WinRatioEntry } from "../../types/analytics";
import { ProfileAvatar, ProfileName } from "../Profiles/ProfileAvatar";
import { ExpandableList } from "./ExpandableList";
import "./Leaderboard.css";

type WinRatioLeaderboardProps = {
  title: string;
  data: WinRatioEntry[];
  expanded: boolean;
  invertSort?: boolean;
};

export default function WinRatioLeaderboard({
  title,
  data,
  expanded,
  invertSort = false,
}: WinRatioLeaderboardProps) {
  return (
    <section className="leaderboard">
      <header className="lb-header">
        <h3>{title}</h3>
      </header>

      <div className="lb-body">
        <ExpandableList
          data={
            data.sort((a, b) => {
              if (invertSort) {
                return a.win_percentage - b.win_percentage || b.total_predictions - a.total_predictions;
              }
              return b.win_percentage - a.win_percentage || b.total_predictions - a.total_predictions;
            })
          }
          expanded={expanded}
          initialCount={1}
          expandedCount={10}
          emptyText="Needs at least 3 predictions per player."
          renderItem={(entry) => {
            const winPct = (entry.win_percentage).toFixed(1);

            return (
              <div className="lb-entry" key={entry.user_id}>
                <ProfileAvatar className="lb-avatar" userId={entry.user_id} userName={entry.user_name} imageUrl={entry.profile_image_url} />

                <ProfileName className="lb-name" userId={entry.user_id} userName={entry.user_name} />

                <div className="lb-meta">
                  {entry.won_predictions} / {entry.total_predictions} won
                </div>

                <div
                  className={`lb-value ${
                    entry.win_percentage >= 50 ? "positive" : "negative"
                  }`}
                >
                  {winPct}%
                </div>
              </div>
            );
          }}
        />
      </div>
    </section>
  );
}