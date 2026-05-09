
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function blink(model: any, time: number) {
  const cycleDuration = 1.5;
  const blinkDuration = 0.2;

  const blinkOffsets = [0, 0.18];

  const t = time % cycleDuration;

  let value = 1;

  for (const offset of blinkOffsets) {
    const blinkTime = t - offset;

    if (blinkTime >= 0 && blinkTime < blinkDuration) {
      if (blinkTime < blinkDuration / 2) {
        value = 1 - (blinkTime / (blinkDuration / 2));
      } else {
        value = (blinkTime - blinkDuration / 2) / (blinkDuration / 2);
      }
    }
  }


  model.internalModel.coreModel.setParameterValueById("ParamEyeLOpen", value);
  model.internalModel.coreModel.setParameterValueById("ParamEyeROpen", value);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function updateBlink(model: any, time: number) {

  const blinkInterval = 4;
  const blinkDuration = 0.2;

  const t = time % blinkInterval;

  let value = 1;

  if (t < blinkDuration / 2) {
    value = 1 - (t / (blinkDuration / 2));
  } else if (t < blinkDuration) {
    value = (t - blinkDuration / 2) / (blinkDuration / 2);
  }

  model.internalModel.coreModel.setParameterValueById("ParamEyeLOpen", value);
  model.internalModel.coreModel.setParameterValueById("ParamEyeROpen", value);
}