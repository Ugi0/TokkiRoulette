import type { PIXIModel } from "../../../../types/pixi";
import { ANIMATION_DURATION, type Animation } from "./Animation";

export const blinkAnimation: Animation = {
  duration: ANIMATION_DURATION,

  setup() {},

  update(model: PIXIModel, time: number) {
    // 0 - 2
    const cycleDuration = 1.5;
    const blinkDuration = 0.2;

    const blinkOffsets = [0, 0.18];

    const t = time % cycleDuration;

    let value = 1;

    for (const offset of blinkOffsets) {
      const blinkTime = t - offset;

      if (
        blinkTime >= 0 &&
        blinkTime < blinkDuration
      ) {
        if (blinkTime < blinkDuration / 2) {
          value =
            1 -
            blinkTime / (blinkDuration / 2);
        } else {
          value =
            (blinkTime - blinkDuration / 2) /
            (blinkDuration / 2);
        }
      }
    }

    model.internalModel.coreModel.setParameterValueById(
      "ParamEyeLOpen",
      value
    );

    model.internalModel.coreModel.setParameterValueById(
      "ParamEyeROpen",
      value
    );
  },

  teardown(model: PIXIModel) {
    model.internalModel.coreModel.setParameterValueById(
      "ParamEyeLOpen",
      1
    );

    model.internalModel.coreModel.setParameterValueById(
      "ParamEyeROpen",
      1
    );
  },
};

export function updateBlink(model: PIXIModel, time: number) {

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