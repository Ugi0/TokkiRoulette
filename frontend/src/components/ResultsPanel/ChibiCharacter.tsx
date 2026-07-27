import { useEffect, useRef } from "react";
import type { Application, BLEND_MODES, Container } from "pixi.js";
import { walkAnimation, walkOff } from "./customAnimations/walk";
import { bringOutTablet, stopWriting } from "./customAnimations/tablet";
import {
  blinkAnimation,
  updateBlink,
} from "./customAnimations/random-wait-animations/blink";
import type { HookData } from "../../types/hookData";
import type { PIXIModel } from "../../types/pixi";
import { log } from "../../utils/log";
import { applyTransformations } from "./customAnimations/random-model-transform";
import { starsAnimation } from "./customAnimations/random-wait-animations/stars";
import { headRotateAnimation } from "./customAnimations/random-wait-animations/head-rotate";
import { nodAnimation } from "./customAnimations/random-wait-animations/nod";
import { heartsAnimation } from "./customAnimations/random-wait-animations/hearts";
import { shakeHeadAnimation } from "./customAnimations/random-wait-animations/shake-head";
import { earShakeAnimation } from "./customAnimations/random-wait-animations/ear-shake";
import type { Animation } from "./customAnimations/random-wait-animations/Animation";

async function loadCubismCore() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(window as any).Live2DCubismCore) {
    const script = document.createElement("script");

    script.src = "/api/resources/model/live2dcubismcore.min.js";
    script.async = true;

    document.body.appendChild(script);

    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = reject;
    });
  }
}

export function ChibiCharacter({
  setTime,
  data,
  stateRef,
}: {
  setTime: React.Dispatch<React.SetStateAction<number>>;
  data: HookData | null;
  stateRef: React.MutableRefObject<"active" | "walkingOut">;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const currentAnimationRef = useRef<Animation | null>(null);
  const animationStartRef = useRef<number>(0);
  const randomAnimationStartedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    let app: Application | null = null;
    let tickerFn: ((delta: number) => void) | null = null;

    let destroyed = false;

    function startAnimation(
      animation: Animation,
      model: PIXIModel,
      currentTime: number
    ) {
      currentAnimationRef.current?.teardown(model);

      currentAnimationRef.current = animation;
      animationStartRef.current = currentTime;

      animation.setup(model);
    }

    function updateCurrentAnimation(
      model: PIXIModel,
      currentTime: number
    ) {
      const animation = currentAnimationRef.current;

      if (!animation) {
        return;
      }

      const localTime = currentTime - animationStartRef.current;

      animation.update(model, localTime);

      if (localTime >= 4.95) {
        console.log("Animation finished:", animation);
        animation.teardown(model);
        currentAnimationRef.current = null;
      }
    }

    async function setup() {
      try {
        await loadCubismCore();

        const PIXI = await import("pixi.js");
        const { Live2DModel } = await import(
          "pixi-live2d-display/cubism4"
        );

        if (destroyed) {
          return;
        }

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
            child as Container & {
              blendMode: BLEND_MODES;
            }
          ).blendMode = PIXI.BLEND_MODES.NORMAL;
        }

        app.stage.addChild(model);

        let time = 0;

        applyTransformations(model);

        const randomAnimations: Animation[] = [
          blinkAnimation,
          earShakeAnimation,
          shakeHeadAnimation,
          heartsAnimation,
          nodAnimation,
          headRotateAnimation,
          starsAnimation,
        ];

        const randomAnimation = (model: PIXIModel, time: number) => {
          updateCurrentAnimation(model, time);
        };

        const sequenceTimings: Record<
          number,
          (
            model: PIXIModel,
            time: number,
            data: HookData | null,
            app: Application
          ) => void
        > = {
          0: walkAnimation,
          5: randomAnimation,
          10: bringOutTablet,
          28: stopWriting,
        };

        function runSequence(
          time: number
        ):
          | ((
              model: PIXIModel,
              time: number,
              data: HookData | null,
              app: Application
            ) => void)
          | undefined {
          const timings = Object.keys(sequenceTimings)
            .map(Number)
            .sort((a, b) => a - b);

          let selected: number | null = null;

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

          if (
            !randomAnimationStartedRef.current &&
            time >= 5
          ) {
            randomAnimationStartedRef.current = true;

            const selectedAnimation =
              randomAnimations[
                Math.floor(
                  Math.random() * randomAnimations.length
                )
              ];

            startAnimation(
              selectedAnimation,
              model,
              time
            );
          }

          const animation = runSequence(time);

          updateBlink(model, time);

          if (animation) {
            animation(model, time, data, app!);
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

      log("Cleaning up PIXI");

      if (app) {
        if (tickerFn) {
          app.ticker.remove(tickerFn);
        }

        app.ticker.stop();
        app.destroy(true);

        if (containerRef.current && app.view) {
          try {
            containerRef.current.removeChild(
              app.view as HTMLCanvasElement
            );
          } catch {
            // Ignore if already removed
          }
        }
      }
    };
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