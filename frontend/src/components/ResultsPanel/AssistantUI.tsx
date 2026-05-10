import { motion } from "framer-motion";
import { ChibiCharacter } from "./ChibiCharacter";
import { ResultsPanel } from "./ResultsPanel";
import { useState } from "react";
import type { HookData } from "../../types/hookData";

export function AssistantUI({ data, setResults }: { data: HookData; setResults: React.Dispatch<React.SetStateAction<HookData | null>> }) {
  const [time, setTime] = useState<number>(0);

  const showPanel = time >= 10;

  return (
    <>
      {/* Character */}
      <motion.div
        style={{
          position: "fixed",
          width: "100vw",
          height: "100vh",
          zIndex: 20,
        }}
      >
        <ChibiCharacter setTime={setTime} data={data} />
      </motion.div>

      {/* Panel appears after 15s */}
      {showPanel && <ResultsPanel data={data} time={time} onClose={() => setResults(null)} />}
    </>
  );
}