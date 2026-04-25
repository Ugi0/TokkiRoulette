import { useEffect, useMemo, useRef, useState } from "react";
import "./RouletteWheel.css";
import { numberColorMap } from "./RouletteNumber";

type RouletteWheelProps = {
  spinTrigger: number;
  onFinish: (value: number) => void;
};

const WHEEL_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17,
  34, 6, 27, 13, 36, 11, 30, 8,
  23, 10, 5, 24, 16, 33, 1,
  20, 14, 31, 9, 22, 18, 29,
  7, 28, 12, 35, 3, 26,
];

const WHEEL_SIZE = 700;
const RADIUS = WHEEL_SIZE / 2;
const FULL_ROTATIONS = 3;
const POINTER_VARIANCE = 1;

export default function RouletteWheel({
  spinTrigger,
  onFinish,
}: RouletteWheelProps) {
  const [rotation, setRotation] = useState(0);
  const isSpinningRef = useRef(false);
  const lastHandledTriggerRef = useRef(0);
  const baseRotationRef = useRef(0);
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  const step = 360 / WHEEL_NUMBERS.length;

  const positionedNumbers = useMemo(
    () =>
      WHEEL_NUMBERS.map((value, i) => ({
        value,
        angle: i * step,
      })),
    [step]
  );

  useEffect(() => {
    if (
      spinTrigger === 0 ||
      spinTrigger === lastHandledTriggerRef.current ||
      isSpinningRef.current
    ) {
      return;
    }

    isSpinningRef.current = true;
    lastHandledTriggerRef.current = spinTrigger;

    const winningIndex = Math.floor(Math.random() * WHEEL_NUMBERS.length);
    const winningNumber = WHEEL_NUMBERS[winningIndex];
    const slotCenterAngle = (winningIndex + 0.5) * step;

    const randomOffset = (Math.random() - 0.5) * step * POINTER_VARIANCE;
    baseRotationRef.current += FULL_ROTATIONS * 360;
    const targetRotation =
      baseRotationRef.current +
      180 -
      slotCenterAngle +
      step / 2 +
      randomOffset;

    setRotation(targetRotation);

    const timeout = setTimeout(() => {
      onFinishRef.current(winningNumber);
      isSpinningRef.current = false;
    }, 5500);

    return () => clearTimeout(timeout);
  }, [spinTrigger, step]);

  return (
    <div className="roulette-window">
      <div
        className="roulette-wheel"
        style={{
          width: WHEEL_SIZE,
          height: WHEEL_SIZE,
          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        }}
      >
        {positionedNumbers.map(({ value, angle }) => (
          <div
            key={value}
            className={`wheel-slot ${numberColorMap.get(value)}`}
            style={{
              transform: `
                translate(-50%, -50%)
                rotate(${angle}deg)
                translateY(${RADIUS}px)
                rotate(180deg)
              `,
            }}
          >
            {value}
          </div>
        ))}
      </div>

      <div className="wheel-indicator" />
    </div>
  );
}
