import { motion } from "framer-motion";
import React from "react";
import type { HookData, UserData } from "../../types/hookData";
import "./ResultsPanel.css";

type ResultsPanelProps = {
  data: HookData;
  time: number;
  onClose: () => void;
  closing: boolean;
};

export function ResultsPanel({data, time, onClose, closing}: ResultsPanelProps) {
  const winners: UserData[] = data.winners;
  const losers: UserData[] = data.losers;

  const totalTime = 15;

  const totalLines = Math.min(
    Math.max(winners.length, losers.length, 1),
    18
  );

  const durationPerLine = totalTime / totalLines;

  const localTime = Math.max(time - 10, 0);

  let rowsVisible = Math.floor(localTime / durationPerLine);

  if (localTime >= totalTime) {
    rowsVisible = totalLines;
  }

  rowsVisible = Math.min(rowsVisible, totalLines);

  const writeTime = durationPerLine * 0.8;

  const sortedLosers = [...losers].sort(
    (a, b) => (b?.bet_amount ?? 0) - (a?.bet_amount ?? 0)
  );

  const sortedWinners = [...winners].sort(
    (a, b) => (b?.won_amount ?? 0) - (a?.won_amount ?? 0)
  );

  return (
    <motion.div
      initial={{ x: 400 }}
      animate={{ x: closing ? 1000 : 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="results-panel"
    >
      <div onClick={onClose} className="close-area">
        <div className="close-bg" />
        <div className="close-fold-shadow" />
        <div className="close-fold">
          <span className="close-x">✕</span>
        </div>
        <div className="close-line1" />
        <div className="close-line2" />
      </div>

      <div className="page page-left">
        <div className="row results-header">Lucky winners</div>

        <div className="row grid-row subheader">
          <span style={{ transform: "rotate(-8deg)" }}>Name</span>
          <span style={{ justifySelf: "center", transform: "rotate(-4deg)" }}>
            Bet
          </span>
          <span style={{ justifySelf: "end" }}>Won</span>
        </div>

        {[...Array(totalLines)].map((_, i) => {
          if (i >= rowsVisible) return null;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              className="row grid-row"
            >
              <span style={{ justifySelf: "start" }}>
                <TypewriterText
                  text={sortedWinners[i]?.user_name ?? ""}
                />
              </span>

              <span style={{ justifySelf: "center" }}>
                <TypewriterText
                  text={sortedWinners[i]?.bet_amount ?? ""}
                  delay={Math.max(0, writeTime * 0.2)}
                />
              </span>

              <span style={{ justifySelf: "end" }}>
                <TypewriterText
                  text={sortedWinners[i]?.won_amount ?? ""}
                  delay={Math.max(0, writeTime * 0.4)}
                />
              </span>
            </motion.div>
          );
        })}
      </div>

      <div className="page page-right">
          <div className="row results-header">Sore losers</div>

        <div className="row grid-row subheader loser-header">
          <span style={{ transform: "rotate(3deg)", paddingTop: "8px" }}>Name</span>
          <span style={{ transform: "rotate(6deg)" }}>Lost</span>
        </div>

        {[...Array(sortedLosers.length)].map((_, i) => {
          if (i >= rowsVisible) return null;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              className="row loser-header"
            >
              <TypewriterText
                text={sortedLosers[i]?.user_name ?? ""}
                delay={writeTime * 0.5}
              />
              <TypewriterText
                text={sortedLosers[i]?.bet_amount ?? ""}
                delay={writeTime * 0.8}
              />
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

const TypewriterText = React.memo(
  ({ text, delay = 0 }: { text: string | number; delay?: number }) => {
    return (
      <span>
        {text
          .toString()
          .split("")
          .map((char, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: delay + i * 0.04,
                duration: 0.1,
              }}
              style={{ display: "inline-block" }}
            >
              {char}
            </motion.span>
          ))}
      </span>
    );
  }
);