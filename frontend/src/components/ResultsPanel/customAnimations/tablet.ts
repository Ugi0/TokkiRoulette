import type { HookData } from "../../../types/hookData";
import * as PIXI from "pixi.js";
import type { PIXIModel } from "../../../types/pixi";

export function bringOutTablet(model: PIXIModel, time: number, data: HookData | null) {
  model.expression("Tablet");

  const totalTime = 15;

  const totalLines = Math.min(
    Math.max(data?.winners.length || 0, data?.losers.length || 0),
    18
  );

  const durationPerLine = totalTime / totalLines;

  const startDelay = durationPerLine;
  const localTime = time - 10 - startDelay;

  if (localTime <= 0) {
        model.internalModel.coreModel.setParameterValueById("DrawX", 20);
        model.internalModel.coreModel.setParameterValueById("DrawY", 0);
        return;
  }

  const extendedTotalTime = totalTime + durationPerLine;
  const clampedTime = Math.min(localTime, extendedTotalTime);

  const line = Math.min(
        Math.floor((clampedTime + 1e-6) / durationPerLine),
        totalLines
  );

  const tRaw = clampedTime % durationPerLine;
  let t = clampedTime < 0.001 ? 0 : tRaw;

  if (localTime >= totalTime) {
    t = durationPerLine;
  }

  const writeTime = durationPerLine * 0.8;
  const resetTime = durationPerLine * 0.2;

  const lineSpacing = 4;

  let sideMovement;

  if (t < writeTime) {
    const progress = t / writeTime;
    sideMovement = 20 - progress * 40;
  } else {
    const progress = (t - writeTime) / resetTime;
    sideMovement = -20 + progress * 40;
  }

  const lineOffset = -line * lineSpacing;

  let writingWobble = 0;
  if (t < writeTime) {
    writingWobble = Math.sin(localTime * 20) * 4;
  }

  const totalY = lineOffset + writingWobble;

  model.internalModel.coreModel.setParameterValueById("DrawX", sideMovement);
  model.internalModel.coreModel.setParameterValueById("DrawY", totalY);
}

export function hideTablet(model: PIXIModel) {
    model.expression("B1");
}

export function stopWriting(model: PIXIModel, _time: number, _data: HookData | null, app: PIXI.Application) {
    model.expression("Tablet");

    const pos = app.renderer.plugins.interaction.mouse.global;
    const rect = app.view.getBoundingClientRect();

    const normX = ((pos.x - rect.left) / rect.width) * 2 - 1;
    const normY = ((pos.y - rect.top) / rect.height) * 2 - 1;

    const x = -normX * 30;
    const y = -normY * 30;

    model.internalModel.coreModel.setParameterValueById("DrawX", x);
    model.internalModel.coreModel.setParameterValueById("DrawY", y);
}

export function getTiming(data: HookData | null) {
  const totalTime = 15;

  const totalLines = Math.min(
    Math.max(data?.winners.length || 0, data?.losers.length || 0),
    18
  );

  const durationPerLine = totalTime / totalLines;

  return {
    totalTime,
    totalLines,
    durationPerLine,
  };
}