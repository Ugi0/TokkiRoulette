import { motion } from "framer-motion";

export function ResultsPanel({ open }: { open: boolean }) {
  return (
    <motion.div
      initial={{ x: 400 }}
      animate={{ x: open ? 0 : 400 }}
      transition={{ type: "spring", stiffness: 120, damping: 20 }}
      style={{
        position: "fixed",
        bottom: "50px",
        right: "100px",
        width: "300px",
        height: "200px",
        background: "#222",
        color: "white",
        borderRadius: "12px",
        padding: "16px",
        zIndex: 10,
      }}
    >
      <h3>Results</h3>
      <p>Winning option: 🟦 Blue</p>
    </motion.div>
  );
}