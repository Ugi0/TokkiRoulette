import { useState } from "react";
import "./RouletteTable.css";
import RouletteWheel from "./RouletteWheel";
import { numbers, zero } from "./RouletteNumber";

type RouletteResult = {
  number: number;
  tags: string[];
};


export default function RouletteTable() {
  const [result, setResult] = useState<RouletteResult | null>(null);
  const [spinCount, setSpinCount] = useState(0);

  return (
    <section className="roulette-table">
      <div className="roulette-table__header">
        <button
          type="button"
          className="spin-button"
          onClick={() => setSpinCount((count) => count + 1)}
        >
          Spin &gt;
        </button>
      </div>

      <RouletteWheel
        spinTrigger={spinCount}
        onFinish={(res) => setResult(res)}
      />

      <div className="table-shell">
        <div className="table-grid">
          <button
            type="button"
            className={`cell cell--zero cell--bet ${zero.color} ${
              result?.number === zero.value ? "winner" : ""
            }`}
            style={{ gridColumn: 1, gridRow: "1 / span 3" }}
          >
            {zero.value}
          </button>

          {numbers.map((number, index) => {
            const row = Math.floor(index / 12) + 1;
            const column = (index % 12) + 2;

            return (
              <button
                key={number.value}
                type="button"
                className={`cell cell--number ${number.color} ${
                  result?.number === number.value ? "winner" : ""
                }`}
                style={{ gridColumn: column, gridRow: row }}
              >
                {number.value}
              </button>
            );
          })}

          <button
            type="button"
            className="cell cell--bet green"
            style={{ gridColumn: 14, gridRow: 1 }}
          >
            2:1
          </button>
          <button
            type="button"
            className="cell cell--bet green"
            style={{ gridColumn: 14, gridRow: 2 }}
          >
            2:1
          </button>
          <button
            type="button"
            className="cell cell--bet green"
            style={{ gridColumn: 14, gridRow: 3 }}
          >
            2:1
          </button>

          <button
            type="button"
            className="cell cell--bet green"
            style={{ gridColumn: "2 / span 4", gridRow: 4 }}
          >
            1st 12
          </button>
          <button
            type="button"
            className="cell cell--bet green"
            style={{ gridColumn: "6 / span 4", gridRow: 4 }}
          >
            2nd 12
          </button>
          <button
            type="button"
            className="cell cell--bet green"
            style={{ gridColumn: "10 / span 4", gridRow: 4 }}
          >
            3rd 12
          </button>

          <button
            type="button"
            className="cell cell--bet green"
            style={{ gridColumn: "2 / span 2", gridRow: 5 }}
          >
            Low
          </button>
          <button
            type="button"
            className="cell cell--bet green"
            style={{ gridColumn: "4 / span 2", gridRow: 5 }}
          >
            Even
          </button>
          <button
            type="button"
            className="cell cell--bet green"
            style={{ gridColumn: "6 / span 2", gridRow: 5 }}
          >
            Red
          </button>
          <button
            type="button"
            className="cell cell--bet green"
            style={{ gridColumn: "8 / span 2", gridRow: 5 }}
          >
            Black
          </button>
          <button
            type="button"
            className="cell cell--bet green"
            style={{ gridColumn: "10 / span 2", gridRow: 5 }}
          >
            Odd
          </button>
          <button
            type="button"
            className="cell cell--bet green"
            style={{ gridColumn: "12 / span 2", gridRow: 5 }}
          >
            High
          </button>
        </div>
      </div>
    </section>
  );
}
