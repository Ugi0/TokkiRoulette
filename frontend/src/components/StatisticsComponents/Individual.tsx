import "./Leaderboard.css";
import { formatNet, netClassName, parseDateToLocaleStringShort, toNumber } from "../../utils/statisticsCommon.ts";
import type { SingleEntry } from "../../types/analytics.ts";
import { ProfileAvatar, ProfileName } from "../Profiles/ProfileAvatar";
import { ExpandableList } from "./ExpandableList.tsx";

type IndividualProps = {
    title: string;
    data: SingleEntry[];
    expanded: boolean;
};

export default function Individual({ title, data, expanded }: IndividualProps) {
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
            const netChange = toNumber(entry.net_change);

            return (
              <div className="lb-entry" key={`${entry.user_id}-${entry.bet_time}`}>
                <ProfileAvatar className="lb-avatar" userId={entry.user_id} userName={entry.user_name} imageUrl={entry.profile_image_url} />

                <ProfileName className="lb-name" userId={entry.user_id} userName={entry.user_name} />

                <div className="lb-meta lb-meta--stacked">
                  {netChange > 0 && (
                    <span className="lb-meta__primary">Bet {entry.bet_amount}</span>
                  )}
                  <span className="lb-meta__secondary">
                    {parseDateToLocaleStringShort(new Date(entry.bet_time!))}
                  </span>
                </div>

                <div className={`lb-value ${netClassName(netChange)}`}>
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
