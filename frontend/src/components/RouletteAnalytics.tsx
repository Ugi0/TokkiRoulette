import "./RouletteAnalytics.css"
import Individual from "./Individual.tsx";
import Leaderboard from "./Leaderboard.tsx";
export default function RouletteAnalytics() {
    return (
        <div className="roulette-analytics">
            <div className='stats'>
                <h1>Top Singular Bet Stats</h1>
                <div className="content">
                    <Individual
                        title="Biggest Single Win"
                        endpoint="/api/analytics/single?type=w&interval=ALL"
                    />
                    <Individual
                        title="Biggest Single Loss"
                        endpoint="/api/analytics/single?type=l&interval=ALL"
                    />
                </div>
            </div>
            <div className='stats'>
                <h1>Last Prediction Stats</h1>
                <div className="content">
                    <Leaderboard
                        title='Recent Winners'
                        endpoint='/api/analytics/recent'
                    />
                    <Leaderboard
                        title='Recent Losers'
                        endpoint='/api/analytics/recent'
                    />
                </div>

            </div>
            <div className='stats'>
                <h1>Overall Top Stats</h1>
                <div className="content">
                    <Leaderboard
                        title="Top Winners"
                        endpoint="/api/analytics/leaderboard?type=w&limit=10"
                        allowInterval={true}
                    />

                    <Leaderboard
                        title="Top Losers"
                        endpoint="/api/analytics/leaderboard?type=l&limit=10"
                        allowInterval={true}
                    />
                </div>

            </div>
        </div>

    );
}
