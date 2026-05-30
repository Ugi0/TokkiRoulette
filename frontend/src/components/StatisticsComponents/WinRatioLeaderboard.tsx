import type { WinRatioEntry } from "../../types/analytics";
import { ExpandableList } from "./ExpandableList";

type WinRatioLeaderboardProps = {
  title: string;
  data: WinRatioEntry[];
  expanded: boolean;
};

export default function WinRatioLeaderboard({
  title,
  data,
  expanded,
}: WinRatioLeaderboardProps) {
  return (
    <section className="leaderboard">
      <div className="header">
        <h2>{title}</h2>
      </div>

      <div className="body">
        <ExpandableList
          data={data}
          expanded={expanded}
          initialCount={1}
          expandedCount={10}
          renderItem={(entry) => {
            const winPct = (entry.win_percentage).toFixed(1);

            return (
              <div className="entry" key={entry.user_id}>
                <img
                  className="pfp"
                  src={entry.profile_image_url ?? "/default-pfp.jpg"}
                  alt="pfp"
                />

                <div className="name">
                  {entry.user_name}
                </div>

                <div className="bet">
                  <div className="win-details">
                    {entry.won_predictions} / {entry.total_predictions}
                  </div>
                </div>

                <div
                  className={`net ${
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