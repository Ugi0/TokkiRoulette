import { motion } from "framer-motion";
import { ChibiCharacter } from "./ChibiCharacter";
import { ResultsPanel } from "./ResultsPanel";

export function AssistantUI({ show }: { show: boolean }) {
  return (
    <>
      {/* Character */}
      <motion.div
        initial={{ x: 500 }}
        animate={{ x: show ? 100 : 500 }}
        transition={{ type: "spring", stiffness: 120 }}
        style={{
          position: "fixed",
          width: "600px",
          height: "600px",
          right: '1000px',
          bottom: '320px',
          zIndex: 20,
          pointerEvents: "none",
        }}
      >
        <ChibiCharacter />
      </motion.div>

      {/* Panel <ResultsPanel open={show} /> */}
      <ResultsPanel open={show} />
    </>
  );
}