import "./Leaderboard.css";
import "./IntervalMenu.css";
import { formatNet, parseDateToLocaleStringShort, toNumber } from "../../utils/statisticsCommon.ts";
import type { SingleEntry } from "../../types/analytics.ts";
import { ExpandableList } from "./ExpandableList.tsx";

type IndividualProps = {
    title: string;
    data: SingleEntry[];
    expanded: boolean;
};

export default function Individual({ title, data, expanded }: IndividualProps) {
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
            const netChange = toNumber(entry.net_change);

            return (
              <div className="entry" key={entry.user_id}>
                <img
                  className="pfp"
                  src={entry.profile_image_url ?? "/default-pfp.jpg"}
                  alt="˙◠˙"
                />

                <div className="name">
                  {entry.user_name}
                </div>

                <div className="bet individual">
                        <>
                        {netChange > 0 && (
                        <div className="bet-amount">
                            Bet {entry.bet_amount}
                        </div>
                        )}
                        <div className="bet-time">
                            {parseDateToLocaleStringShort(new Date(entry.bet_time!))}
                        </div>
                        </>
                </div>

                <div
                  className={`net ${
                    netChange < 0
                      ? "negative"
                      : netChange > 0
                      ? "positive"
                      : ""
                  }`}
                >
                  {formatNet(netChange)}
                </div>
              </div>
            );
          }}
        />
      </div>
    </section>
  );
}
