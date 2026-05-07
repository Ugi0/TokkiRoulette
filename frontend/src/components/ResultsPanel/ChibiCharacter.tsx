import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";
import { Live2DModel } from "pixi-live2d-display/cubism4";

export function ChibiCharacter() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    (async () => {
      const app = new PIXI.Application({
        width: 900,
        height: 900,
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
        model.x = app.screen.width / 2;
        model.y = app.screen.height;

        pixiModel.tint = 0xffffff;
        pixiModel.alpha = 1;

        for (const child of model.children) {
          (child as PIXI.Container & { blendMode: PIXI.BLEND_MODES }).blendMode = PIXI.BLEND_MODES.NORMAL;
        }

        app.stage.addChild(model);
      } catch (e) {
        console.error("Model failed to load:", e);
      }
    })();
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "900px",
        height: "900px",
        //background: "rgba(255,0,0,0.2)", // debug
      }}
    />
  );
}