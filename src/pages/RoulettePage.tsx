import { Link } from "react-router";
import RouletteTable from "../components/RouletteTable";
import "./RoulettePage.css";

export default function RoulettePage() {
  return (
    <main className="roulette-page">
      <div className="roulette-page__header">
        <h1>Totally not rigged Roulette table</h1>
        <Link className="roulette-page__link" to="/">
          Back Home
        </Link>
      </div>

      <RouletteTable />
    </main>
  );
}
