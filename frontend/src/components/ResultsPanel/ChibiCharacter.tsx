import { useEffect, useRef } from "react";
import type { Application, BLEND_MODES, Container } from "pixi.js";
import { walkAnimation, walkOff } from "./customAnimations/walk";
import { bringOutTablet, stopWriting } from "./customAnimations/tablet";
import { blink, updateBlink } from "./customAnimations/blink";
import type { HookData } from "../../types/hookData";
import type { PIXIModel } from "../../types/pixi";

async function loadCubismCore() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(window as any).Live2DCubismCore) {
    const script = document.createElement("script");
    script.src =
      "/api/resources/model/live2dcubismcore.min.js";

    script.async = true;

    document.body.appendChild(script);

    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = reject;
    });
  }
}

const sequenceTimings: Record<number, (model: PIXIModel, time: number, data: HookData | null, app: Application) => void> = {
  0: walkAnimation,
  5: blink,
  10: bringOutTablet,
  28: stopWriting
};

function runSequence(time: number): ((model: PIXIModel, time: number, data: HookData | null, app: Application) => void) | undefined {
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


export function ChibiCharacter({setTime, data, stateRef,}: {setTime: React.Dispatch<React.SetStateAction<number>>; data: HookData | null; stateRef: React.MutableRefObject<"active" | "walkingOut">;}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let app: Application | null = null;
    let tickerFn: ((delta: number) => void) | null = null;

    let destroyed = false;

    async function setup() {
      try {
        await loadCubismCore();

        const PIXI = await import("pixi.js");
        const { Live2DModel } = await import(
          "pixi-live2d-display/cubism4"
        );

        if (destroyed) return;

        app = new PIXI.Application({
          width: window.innerWidth,
          height: window.innerHeight,
          transparent: true,
          antialias: true,
          clearBeforeRender: true,
          preserveDrawingBuffer: true,
        });

        containerRef.current!.appendChild(
          app.view as HTMLCanvasElement
        );

        const model = (await Live2DModel.from(
          "/api/resources/model/chibi/TT Tokki.model3.json"
        )) as unknown as PIXIModel;

        model.anchor.set(0.5, 1);
        model.scale.set(0.2);

        const walkRange = app.renderer.width * 0.05;

        model.x = -walkRange;
        model.y = app.renderer.height + model.height * 0.1;

        model.tint = 0xffffff;
        model.alpha = 1;

        for (const child of model.children) {
          (
            child as Container & { blendMode: BLEND_MODES }
          ).blendMode = PIXI.BLEND_MODES.NORMAL;
        }

        app.stage.addChild(model);

        let time = 0;

        tickerFn = (delta: number) => {
          const dt = delta * 16.6667;
          time += dt / 1000;

          model.update(dt);
          setTime(time);

          if (stateRef.current === "walkingOut") {
            walkOff(model, time);
            updateBlink(model, time);
            return;
          }

          const animation = runSequence(time);
          if (animation) {
            animation(model, time, data, app!);
          }

          if (animation !== blink) {
            updateBlink(model, time);
          }
        };

        app.ticker.add(tickerFn);
      } catch (e) {
        console.error("Model setup failed:", e);
      }
    }

    setup();

    return () => {
      destroyed = true;
      console.log("Cleaning up PIXI");

      if (app) {
        if (tickerFn) {
          app.ticker.remove(tickerFn);
        }

        app.ticker.stop();
        app.destroy(true);

        if (containerRef.current && app.view) {
          try {
            // eslint-disable-next-line react-hooks/exhaustive-deps
            containerRef.current.removeChild(
              app.view as HTMLCanvasElement
            );
          } catch {
            // Ignore if already removed
          }
        }
      }
    };
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