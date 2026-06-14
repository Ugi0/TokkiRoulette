import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import "./RouletteWheel.css";
import { numberColorMap } from "./RouletteNumber";
import { RouletteGen, type RouletteResult } from "./RouletteGen";
import clickSound from "../../sounds/click.mp3";

export type RouletteWheelHandle = {
  spin: () => void;
};

type RouletteWheelProps = {
  onFinish: (result: RouletteResult) => void;
  setNotification: (message: string) => void;
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
const FULL_ROTATIONS = 2;
const POINTER_VARIANCE = 1;

function buildSpinResult(): RouletteResult {
  const randomNumber = Math.floor(Math.random() * 37);
  return RouletteGen(randomNumber);
}

const RouletteWheel = forwardRef<RouletteWheelHandle, RouletteWheelProps>(
  ({ onFinish, setNotification }, ref) => {
    const [rotation, setRotation] = useState(0);

    const isSpinningRef = useRef(false);
    const baseRotationRef = useRef(0);
    const timeoutRef = useRef<number | null>(null);
    const onFinishRef = useRef(onFinish);

    onFinishRef.current = onFinish;

    const step = 360 / WHEEL_NUMBERS.length;

    const lastTickIndexRef = useRef(0);
    const lastRotationRef = useRef(0);
    const lastPlayRef = useRef(0);

    const audioPoolRef = useRef<HTMLAudioElement[]>([]);
    const poolIndexRef = useRef(0);

    if (audioPoolRef.current.length === 0) {
      for (let i = 0; i < 5; i++) {
        const audio = new Audio(clickSound);
        audio.volume = 0.5;
        audioPoolRef.current.push(audio);
      }
    }

    useEffect(() => {
      let rafId: number;

      const element = document.querySelector(".roulette-wheel") as HTMLElement;
      if (!element) return;

      const track = () => {
        const style = window.getComputedStyle(element);
        const transform = style.transform;

        if (transform !== "none") {
          const values = transform.match(/matrix\(([^)]+)\)/);

          if (values) {
            const parts = values[1].split(",");
            const a = parseFloat(parts[0]);
            const b = parseFloat(parts[1]);

            let angle = Math.atan2(b, a) * (180 / Math.PI);
            if (angle < 0) angle += 360;

            lastRotationRef.current = angle;

            const tickIndex = Math.floor(angle / step);

            if (tickIndex !== lastTickIndexRef.current) {
              lastTickIndexRef.current = tickIndex;

              const pool = audioPoolRef.current;
              const index = poolIndexRef.current;

              poolIndexRef.current = (index + 1) % pool.length;

              const now = performance.now();

              if (now - lastPlayRef.current > 20) {
                lastPlayRef.current = now;

                const pool = audioPoolRef.current;
                const index = poolIndexRef.current;
                const audio = pool[index];

                poolIndexRef.current = (index + 1) % pool.length;

                audio.currentTime = 0;
                audio.playbackRate = 0.95 + Math.random() * 0.1;

                audio.play().catch(() => {});
              }
            }
          }
        }

        rafId = requestAnimationFrame(track);
      };

      rafId = requestAnimationFrame(track);

      return () => cancelAnimationFrame(rafId);
    }, [step]);

    const positionedNumbers = useMemo(
      () =>
        WHEEL_NUMBERS.map((value, i) => ({
          value,
          angle: i * step,
        })),
      [step]
    );

    const spin = () => {
      if (isSpinningRef.current) return;

      isSpinningRef.current = true;
      lastTickIndexRef.current = -1;
      lastRotationRef.current = 0;

      const result = buildSpinResult();
      const winningIndex = WHEEL_NUMBERS.indexOf(result.number);

      const slotCenterAngle = (winningIndex + 0.5) * step;
      const randomOffset =
        (Math.random() - 0.5) * step * POINTER_VARIANCE;

      baseRotationRef.current += FULL_ROTATIONS * 360;

      const targetRotation =
        baseRotationRef.current +
        180 -
        slotCenterAngle +
        step / 2 +
        randomOffset;

      setRotation(targetRotation);

      timeoutRef.current = window.setTimeout(() => {
        isSpinningRef.current = false;
        onFinishRef.current(result);
        sendSpinResult(result, setNotification);
      }, 12000);
    };

    useImperativeHandle(ref, () => ({
      spin,
    }));

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
);

async function sendSpinResult(result: RouletteResult, setNotification: (message: string) => void) {
  try {
    const res = await fetch("/api/spin-result", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result)
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    if (data.status === "authorized") {
      setNotification("Prediction data saved successfully!");
    }
  } catch (err) {
    console.error(err);
  }
}

export default RouletteWheel;