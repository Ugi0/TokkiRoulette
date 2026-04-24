
import { useState } from "react";
import "./RouletteTable.css";
import RouletteWheel from "./RouletteWheel";
import { numbers, zero } from "./RouletteNumber";

export default function RouletteTable() {
  const [, setSelected] = useState<number | null>(null);
  const [spinCount, setSpinCount] = useState(0);

  return (
    <div className="container">
      <h1>Totally not rigged Roulette table</h1>

      <div className="spinContainer">
        <button className="spinButton" onClick={() => setSpinCount(c => c + 1)}>
          Spin ►
        </button>
      </div>

      <RouletteWheel
        spinTrigger={spinCount}
        onFinish={(value) => setSelected(value)}
      />

      <div className="table">
        <button
            className={`cell hover-ef zero ${zero.color}`}
        >
            0
        </button>
        {numbers.map((n) => (
          <button
            key={n.value}
            className={`cell hover-ef ${n.color}`}
          >
            {n.value}
          </button>
        ))}

        <button
          className={`dozen first hover-ef`}
        >
          1st 12
        </button>
        <button
          className={`dozen hover-ef`}
        >
          2nd 12
        </button>
        <button
          className={`dozen hover-ef`}
        >
          3rd 12
        </button>
      </div>

    </div>
  );
}
