import { motion } from "framer-motion";
import { ChibiCharacter } from "./ChibiCharacter";
import { ResultsPanel } from "./ResultsPanel";
import { useEffect, useRef, useState } from "react";
import type { HookData } from "../../types/hookData";
import { resetWalkAnimation } from "./customAnimations/walk";

export function AssistantUI({data, setResults,}: {data: HookData | null; setResults: React.Dispatch<React.SetStateAction<HookData | null>>;}) {
  const [time, setTime] = useState<number>(0);
  const [isClosing, setIsClosing] = useState(false);
  const [characterState, setCharacterState] = useState<"active" | "walkingOut">("active");
  const characterStateRef = useRef(characterState);

  const showPanel = time >= 10 && data;

  useEffect(() => {
    characterStateRef.current = characterState;
  }, [characterState]);

  useEffect(() => {
    if (data) {
      resetWalkAnimation();
    }
  }, [data]);

  const handleClose = () => {
    console.log("Closing panel...");
    setIsClosing(true);
    setCharacterState("walkingOut");

    setTimeout(() => {
      setResults(null);
      setIsClosing(false);
      setCharacterState("active");
    }, 6000);
  };

  return (
    <>
      <motion.div
        style={{
          position: "fixed",
          width: "100vw",
          height: "100vh",
          zIndex: 20,
          pointerEvents: "none",
        }}
      >
        <ChibiCharacter
          setTime={setTime}
          data={data}
          stateRef={characterStateRef}
        />
      </motion.div>

      {showPanel && (
        <ResultsPanel
          data={data!}
          time={time}
          closing={isClosing}
          onClose={handleClose}
        />
      )}
    </>
  );
}