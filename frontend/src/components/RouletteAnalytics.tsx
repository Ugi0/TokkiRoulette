import "./RouletteAnalytics.css"
import TopIndividual from "./TopIndividual.tsx";
import TopLeaders from "./TopLeaders.tsx";

export default function RouletteAnalytics() {

    return (
        <section className="roulette-analytics">

            <div className="recent">
                <div className="recent-winners">
                    <TopLeaders title="Recent Winners" />
                </div>
                <div className="recent-losers">
                    <TopLeaders title="Recent Losers" />
                </div>
            </div>
            <div className="individuals">
                <div className="individual-winner">
                    <TopIndividual title="Top Individual Winner" />
                </div>
                <div className="individual-loser">
                    <TopIndividual title="Top Individual Loser" />
                </div>
            </div>
            <div className="leaderboards">
                <div className="top-winners">
                    <TopLeaders title="Top Winners" />
                </div>
                <div className="top-losers">
                    <TopLeaders title="Top Losers" />
                </div>
            </div>
        </section>

    );
}