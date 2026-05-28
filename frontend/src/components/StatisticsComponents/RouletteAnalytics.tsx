import "./RouletteAnalytics.css"
import Leaderboard from "./Leaderboard.tsx";
import type { Analytics } from "../../types/analytics.ts";
import { losersSingleTitle, losersTotalTitle, winnersSingleTitle, winnersTotalTitle } from "../../utils/statisticsTitles.ts";
import { parseDateToLocaleString } from "../../utils/statisticsCommon.ts";
import Individual from "./Individual.tsx";
import { ExpandableSection } from "./ExpandableSection.tsx";

export default function RouletteAnalytics({ analytics }: { analytics: Analytics }) {
  console.log("Analytics data:", analytics); // Debugging log
  return (
    <div className="roulette-analytics">
      <div className="stats-container">

        {analytics.interval === "RECENT" &&
          analytics.predictions[0]?.prediction_start_time && (
            <h2>
              {parseDateToLocaleString(
                new Date(analytics.predictions[0].prediction_start_time)
              )}
            </h2>
          )}

        {analytics.interval !== "RECENT" && (
          <ExpandableSection title="Top Singular Bet Stats" interval={analytics.interval}>
            {(expanded) => (
              <>
                <Individual
                  title={winnersSingleTitle(analytics.interval)}
                  data={analytics.singleEntries.topProfit}
                  expanded={expanded}
                />

                <Individual
                  title={losersSingleTitle(analytics.interval)}
                  data={analytics.singleEntries.topLost}
                  expanded={expanded}
                />
              </>
            )}
          </ExpandableSection>
        )}

        <ExpandableSection title="Top Total Stats" interval={analytics.interval}>
          {(expanded) => (
            <>
              <Leaderboard
                title={winnersTotalTitle(analytics.interval)}
                data={analytics.leaderboardEntries.topWinners}
                interval={analytics.interval}
                expanded={expanded}
              />

              <Leaderboard
                title={losersTotalTitle(analytics.interval)}
                data={analytics.leaderboardEntries.topLosers}
                interval={analytics.interval}
                expanded={expanded}
              />
            </>
          )}
        </ExpandableSection>

      </div>
    </div>
  );
}