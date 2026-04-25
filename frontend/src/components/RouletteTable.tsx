import { useRef, useState } from "react";
import "./RouletteTable.css";
import RouletteWheel from "./RouletteWheel";
import { numbers, zero } from "./RouletteNumber";

type RouletteResult = {
  number: number;
  tags: string[];
};

export default function RouletteTable() {
  const [result, setResult] = useState<RouletteResult | null>(null);
  const wheelRef = useRef<{ spin: () => void }>(null);

  return (
    <section className="roulette-table">
      <div className="roulette-table__header">
        <button
          type="button"
          className="spin-button"
          onClick={() => wheelRef.current?.spin()}
        >
          Spin &gt;
        </button>
      </div>

      <RouletteWheel
        onFinish={(res) => setResult(res)}
        ref={wheelRef}
      />

      <div className="table-shell">
        <div className="table-stack">
        <div className="table-underlay">
          <div className="underlay left" style={{ gridColumn: 1, gridRow: "1 / span 3" }}/>
          <div className="underlay center" style={{ gridColumn: "2 / span 12", gridRow: "1 / span 5" }}/>
          <div className="underlay right" style={{ gridColumn: 14, gridRow: "1 / span 3" }}/>
        </div>
        <div className="table-grid">
          <button
            type="button"
            className={`cell cell--zero tl bl cell--bet ${zero.color} ${
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
            className="cell cell--bet tr green"
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
            className="cell cell--bet br green"
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
            className="cell bl cell--bet green"
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
            className="cell cell--bet red"
            style={{ gridColumn: "6 / span 2", gridRow: 5 }}
          >
            Red
          </button>
          <button
            type="button"
            className="cell cell--bet black"
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
            className="cell br cell--bet green"
            style={{ gridColumn: "12 / span 2", gridRow: 5 }}
          >
            High
          </button>
        </div>
      </div>
      </div>
    </section>
  );
}
