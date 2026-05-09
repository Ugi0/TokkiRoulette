import { motion } from "framer-motion";
import { ChibiCharacter } from "./ChibiCharacter";
import { ResultsPanel } from "./ResultsPanel";
import { useState } from "react";
import type { HookData } from "../../types/hookData";

export function AssistantUI({ data, setResults }: { data: HookData; setResults: React.Dispatch<React.SetStateAction<HookData | null>> }) {
  const [x, setX] = useState<number>(0);
  const [time, setTime] = useState<number>(0);

  const showPanel = time >= 10;

  return (
    <>
      {/* Character */}
      <motion.div
        style={{
          position: "fixed",
          width: "600px",
          height: "600px",
          left: "-25vw",
          bottom: "200px",
          zIndex: 20,
          transform: `translateX(${x}vw)`,
        }}
      >
        <ChibiCharacter setX={setX} setTime={setTime} data={data} />
      </motion.div>

      {/* Panel appears after 15s */}
      {showPanel && <ResultsPanel data={data} time={time} onClose={() => setResults(null)} />}
    </>
  );
}