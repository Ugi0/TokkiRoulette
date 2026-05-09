import type { HookData } from "../../../types/hookData";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function bringOutTablet(model: any, time: number, _setX: React.Dispatch<React.SetStateAction<number>>, data: HookData) {
  model.expression("Tablet");

  const totalTime = 15;

  const totalLines = Math.min(
    Math.max(data.winners.length, data.losers.length),
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
    writingWobble = Math.sin(localTime * 12) * 2;
  }

  const totalY = lineOffset + writingWobble;

  model.internalModel.coreModel.setParameterValueById("DrawX", sideMovement);
  model.internalModel.coreModel.setParameterValueById("DrawY", totalY);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function hideTablet(model: any) {
    model.expression("B1");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function stopWriting(model: any) {
    model.expression("Tablet");
}

export function getTiming(data: HookData) {
  const totalTime = 15;

  const totalLines = Math.min(
    Math.max(data.winners.length, data.losers.length),
    18
  );

  const durationPerLine = totalTime / totalLines;

  return {
    totalTime,
    totalLines,
    durationPerLine,
  };
}