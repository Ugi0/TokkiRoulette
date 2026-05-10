import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";
import { Live2DModel } from "pixi-live2d-display/cubism4";
import { walkAnimation } from "./customAnimations/walk";
import { bringOutTablet, stopWriting } from "./customAnimations/tablet";
import { blink, updateBlink } from "./customAnimations/blink";
import type { HookData } from "../../types/hookData";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sequenceTimings: Record<number, (model: any, time: number, data: HookData, app: PIXI.Application) => void> = {
  0: walkAnimation,
  5: blink,
  10: bringOutTablet,
  27: stopWriting
};

// TODO LIST
// Instead of having the character disappear, have it walk off screen after closing the panel

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function runSequence(time: number): ((model: any, time: number, data: HookData, app: PIXI.Application) => void) | undefined {
  const timings = Object.keys(sequenceTimings)
    .map(Number)
    .sort((a, b) => a - b);

  let selected = null;

  for (const t of timings) {
    if (time >= t) {
      selected = t;
    } else {
      break;
    }
  }

  if (selected !== null) {
    return sequenceTimings[selected];
  }
}

export function ChibiCharacter( { setTime, data }: { setTime: React.Dispatch<React.SetStateAction<number>>; data: HookData }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    (async () => {
      const app = new PIXI.Application({
        width: window.innerWidth,
        height: window.innerHeight,
        transparent: true,
        antialias: true,
        clearBeforeRender: true,
        preserveDrawingBuffer: true,

      });

      containerRef.current!.appendChild(app.view as HTMLCanvasElement);

      try {
        const model = await Live2DModel.from("/models/chibi/TT Tokki.model3.json");

        const pixiModel = model as unknown as PIXI.Container & { tint: number };

        model.anchor.set(0.5, 1);
        model.scale.set(0.2);

        const walkRange = app.renderer.width * 0.25;

        model.x = -walkRange;
        model.y = app.renderer.height - (model.height * 0.1);

        pixiModel.tint = 0xffffff;
        pixiModel.alpha = 1;

        for (const child of model.children) {
          (child as PIXI.Container & { blendMode: PIXI.BLEND_MODES }).blendMode = PIXI.BLEND_MODES.NORMAL;
        }

        app.stage.addChild(model);

        let time = 0;

        app.ticker.add((delta) => {
          
          const dt = delta * 16.6667;
          time += dt / 1000;

          model.update(dt);

          setTime(time);

          const animation = runSequence(time);
          if (animation) {
            animation(model, time, data, app);
          }

          if (animation != blink) {
            updateBlink(model, time);
          }
        });
      } catch (e) {
        console.error("Model failed to load:", e);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100vw",
        height: "100vh",
      }}
    />
  );
}