import "./RouletteAnalytics.css"
import Individual from "./Individual.tsx";
import Leaderboard from "./Leaderboard.tsx";
import type { Analytics } from "../../types/analytics.ts";

export default function RouletteAnalytics({ analytics }: { analytics: Analytics }) {
    return (
        <div className="roulette-analytics">
            <div className="stats-container">
                <div className='stats'>
                    <h1>Top Singular Bet Stats</h1>
                    <div className="content">
                        <Individual
                            title="Biggest Single Win"
                            data={analytics.singleEntries.topProfit}
                        />
                        <Individual
                            title="Biggest Single Loss"
                            data={analytics.singleEntries.topLost}
                        />
                    </div>
                </div>
                <div className='stats'>
                    <h1>Top Stats</h1>
                    <div className="content">
                        <Leaderboard
                            title="Top Winners"
                            data={analytics.leaderboardEntries.topWinners}
                        />

                        <Leaderboard
                            title="Top Losers"
                            data={analytics.leaderboardEntries.topLosers}
                        />
                    </div>

                </div>
            </div>
        </div>

    );
}
