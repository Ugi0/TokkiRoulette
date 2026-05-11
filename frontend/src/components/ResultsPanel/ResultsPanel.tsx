import { motion } from "framer-motion";
import React from "react";
import type { HookData, UserData } from "../../types/hookData";

export function ResultsPanel({data, time, onClose, closing}: {data: HookData; time: number; onClose: () => void; closing: boolean})
 {
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

  const rowStyle: React.CSSProperties = {
    height: "29px",
    minHeight: "29px",
    display: "flex",
    alignItems: "flex-start",
    paddingLeft: "6px",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
  };

  const sortedLosers = [...losers].sort(
    (a, b) => (b?.bet_amount ?? 0) - (a?.bet_amount ?? 0)
  );

  const sortedWinners = [...winners].sort(
    (a, b) => (b?.won_amount ?? 0) - (a?.won_amount ?? 0)
  );

  const pageStyle: React.CSSProperties = {
    flex: 1,
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    maxHeight: "610px",
    overflow: "hidden",

    backgroundColor: "#fffdf5",
    color: "#333",

    backgroundImage: `
      repeating-linear-gradient(
        to bottom,
        #fffdf5,
        #fffdf5 28px,
        #e0e0e0 29px
      ),
      linear-gradient(to right, #ffaaaa 2px, transparent 2px)
    `,
    backgroundPosition: "0 0, 40px 0",

    fontFamily: "'Patrick Hand', cursive",
  };

  const writeTime = durationPerLine * 0.8;

  return (
    <motion.div
      initial={{ x: 400 }}
      animate={{ x: closing ? 1000 : 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{
        position: "fixed",
        top: "100px",
        right: "100px",

        width: "30vw",
        height: "80vh",
        minWidth: "600px",
        maxHeight: "610px",

        display: "flex",

        borderRadius: "6px",
        boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
        overflow: "hidden",

        zIndex: 10,
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "50px",
          height: "50px",
          zIndex: 30,
          cursor: "pointer",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "45px",
            height: "55px",

            backgroundColor: "#fffdf5",

            backgroundImage: `
              repeating-linear-gradient(
                -90deg,
                #fffdf5,
                #fffdf5 28px,
                #e0e0e0 29px
              ),
              linear-gradient(to right, #ffaaaa 2px, transparent 2px)
            `,
            boxShadow: "-1px 1px 5px rgba(0,0,0,0.25)",

            backgroundPosition: "50px 0, 0 0px",

            display: "flex",
            justifyContent: "flex-end",
            alignItems: "flex-start",

          }}
        >
        </div>

        <div
          style={{
            position: "absolute",
            top: "2px",
            right: "2px",
            width: 0,
            height: 0,

            borderTop: "46px solid rgba(0,0,0,0.2)",
            borderLeft: "46px solid transparent",

            filter: "blur(2px)",
            zIndex: 2,
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,

            clipPath: "polygon(100% 0, 0 0, 100% 100%)",

            backgroundColor: "#fffdf5",

            backgroundImage: `
              repeating-linear-gradient(
                to bottom,
                #fffdf5,
                #fffdf5 28px,
                #e0e0e0 29px
              ),
              linear-gradient(to right, #ffaaaa 2px, transparent 2px)
            `,

            backgroundPosition: "0 0, 40px 0",

            filter: "brightness(0.92)",

            zIndex: 3,
          }}>
            <span
            style={{
              color: "#c33",
              position: "absolute",
              right: "6px",
              fontSize: "16px",
              transform: "rotate(-22deg)",
              fontFamily: "'Patrick Hand', cursive",
              fontWeight: "bold",
            }}
          >
            ✕
          </span>
        </div>

        <div
          style={{
            position: "absolute",
            top: "0px",
            right: "0px",
            width: "60px",
            height: "2px",

            background: "rgba(120, 110, 90, 0.25)",

            transform: "rotate(45deg)",
            transformOrigin: "top right",

            zIndex: 4,
          }}
        />

        <div
          style={{
            position: "absolute",
            top: "1px",
            right: "0px",
            width: "60px",
            height: "1px",

            background: "rgba(255, 255, 255, 0.6)",

            transform: "rotate(45deg)",
            transformOrigin: "top right",

            zIndex: 5,
          }}
        />
      </div>

      <div
        style={{
          ...pageStyle,
          borderRight: "1px solid #ddd",
          boxShadow: "inset -6px 0 10px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            ...rowStyle,
            fontSize: "20px",
            textDecoration: "underline",
            minHeight: "29px",
            justifyContent: "center",
            paddingTop: "15px",
          }}
        >
          Lucky winners
        </div>

        <div
          style={{
            ...rowStyle,
            display: "grid",
            gridTemplateColumns: "1fr minmax(0, 80px) 70px",
            columnGap: "8px",
            minHeight: "29px",

            fontSize: "14px",
            fontWeight: "bold",
            color: "#222",
          }}
        >
          <span style={{ justifySelf: "start", transform: "rotate(-8deg)" }}>Name</span>
          <span style={{ justifySelf: "start", transform: "rotate(-4deg)" }}>Bet</span>
          <span style={{ justifySelf: "end" }}>Won</span>
        </div>

        {[...Array(totalLines)].map((_, i) => {
          if (i >= rowsVisible) return null;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                ...rowStyle,
                
                display: "grid",
                gridTemplateColumns: "1fr minmax(0, 80px) 70px",

                alignItems: "flex-end",
                paddingRight: "6px",
                columnGap: "8px",

              }}
            >
              <span style={{ justifySelf: "start" }}>
                <TypewriterText text={sortedWinners[i]?.user_name ?? ""} />
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

      <div
        style={{
          ...pageStyle,
          boxShadow: "inset 6px 0 10px rgba(0,0,0,0.05)",
          clipPath: "polygon(0 0, calc(100% - 50px) 0, 100% 50px, 100% 100%, 0 100%)",
        }}
      >
        <div
          style={{
            ...rowStyle,
            fontSize: "20px",
            textDecoration: "underline",
            minHeight: "29px",
            justifyContent: "center",
            paddingTop: "15px",
          }}
        >
          Sore losers
        </div>

        <div
          style={{
            ...rowStyle,
            justifyContent: "space-between",
            display: "flex",
            alignItems: "flex-end",
            fontSize: "14px",
          }}
        >
          <span style={{ justifySelf: "start", transform: "rotate(2deg)" }}>Name</span>
          <span style={{ justifySelf: "end", transform: "rotate(6deg)" }}>Lost</span>
        </div>

        {[...Array(sortedLosers.length)].map((_, i) => {
          if (i >= rowsVisible) return null;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                ...rowStyle,
                justifyContent: "space-between",
                display: "flex",
                alignItems: "flex-end",
              }}
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
        {text.toString().split("").map((char, i) => (
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