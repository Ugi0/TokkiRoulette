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
                        title='Biggest Single Win'
                        endpoint='/api/stats/biggest-win'
                    />
                    <Individual
                        title='Biggest Single Loss'
                        endpoint='/api/stats/biggest-loss'
                    />
                </div>
            </div>
            <div className='stats'>
                <h1>Last Prediction Stats</h1>
                <div className="content">
                    <Leaderboard
                        title='Recent Winners'
                        endpoint='/api/stats/recent-winners'
                    />
                    <Leaderboard
                        title='Recent Losers'
                        endpoint='/api/stats/recent-losers'
                    />
                </div>

            </div>
            <div className='stats'>
                <h1>Overall Top Stats</h1>
                <div className="content">
                    <Leaderboard
                        title='Top Winners'
                        endpoint='/api/stats/top-winners'
                        allowInterval={true}
                    />
                    <Leaderboard
                        title='Top Losers'
                        endpoint='/api/stats/top-losers'
                        allowInterval={true}
                    />
                </div>

            </div>
        </div>

    );
}