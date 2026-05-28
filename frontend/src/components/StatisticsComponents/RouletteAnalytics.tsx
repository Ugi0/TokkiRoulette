import "./RouletteAnalytics.css"
import Leaderboard from "./Leaderboard.tsx";
import type { Analytics, PredictionEntry } from "../../types/analytics.ts";
import { losersSingleTitle, losersTotalTitle, winnersSingleTitle, winnersTotalTitle } from "../../utils/statisticsTitles.ts";
import { parseDateToLocaleString } from "../../utils/statisticsCommon.ts";
import Individual from "./Individual.tsx";
import { ExpandableSection } from "./ExpandableSection.tsx";
import WinRatioLeaderboard from "./WinRatioLeaderboard.tsx";
import PredictionsList from "./PredictionsList.tsx";
import { useState } from "react";
import PredictionDetails from "./PredictionDetails.tsx";

export default function RouletteAnalytics({ analytics }: { analytics: Analytics }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState<PredictionEntry | null>(null);

  return (
    <div className="roulette-analytics">
      {selectedPrediction && <PredictionDetails prediction={selectedPrediction} />}

      <div className="stats-container">
        
      {analytics.interval !== "RECENT" && analytics.predictions.length !== 0 && (
        <div className={`predictions-sidebar ${sidebarOpen ? "open" : "collapsed"}`}>
            
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen((prev) => !prev)}
          >
            {sidebarOpen ? "‹" : "›"}
          </button>

          <div className="sidebar-content">
            <PredictionsList predictions={analytics.predictions} onSelect={setSelectedPrediction} />
          </div>
        </div>
      )}


        {analytics.interval === "RECENT" &&
          analytics.predictions[0]?.prediction_start_time && (
            <>
            <h2>
                {analytics.predictions[0].prediction_title}
            </h2>
            <h2>
              {parseDateToLocaleString(
                new Date(analytics.predictions[0].prediction_start_time)
              )}
            </h2>
            </>
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
                expanded={expanded || analytics.interval === "RECENT"}
              />

              <Leaderboard
                title={losersTotalTitle(analytics.interval)}
                data={analytics.leaderboardEntries.topLosers}
                interval={analytics.interval}
                expanded={expanded || analytics.interval === "RECENT"}
              />
            </>
          )}
        </ExpandableSection>

        {analytics.interval !== "RECENT" && (
            <ExpandableSection title="Win Ratio Stats" interval={analytics.interval}>
                {(expanded) => (
                    <>
                    <WinRatioLeaderboard
                        title="Highest Win Rate"
                        data={analytics.winRatios.highest}
                        expanded={expanded}
                    />

                    <WinRatioLeaderboard
                        title="Lowest Win Rate"
                        data={analytics.winRatios.lowest}
                        expanded={expanded}
                    />
                    </>
                )}
            </ExpandableSection>
        )}

      </div>
    </div>
  );
}