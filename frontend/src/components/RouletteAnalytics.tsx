import "./RouletteAnalytics.css"
import TopIndividual from "./TopIndividual.tsx";
import TopLeaders from "./TopLeaders.tsx";

export default function RouletteAnalytics() {

    return (
        <section className="roulette-analytics">

            <div className="recent">
                <div className="recent-winners">
                    <TopLeaders />
                </div>
                <div className="recent-losers">
                    <TopLeaders />
                </div>
            </div>
            <div className="individuals">
                <div className="individual-winner">
                    <TopIndividual />
                </div>
                <div className="individual-losser">
                    <TopIndividual />
                </div>
            </div>
            <div className="leaderboards">
                <div className="top-winners">
                    <TopLeaders />
                </div>
                <div className="top-losers">
                    <TopLeaders />
                </div>
            </div>
        </section>

    );
}