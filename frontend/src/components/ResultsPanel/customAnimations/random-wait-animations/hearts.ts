import type { PIXIModel } from "../../../../types/pixi";
import { ANIMATION_DURATION, type Animation } from "./Animation";

export const heartsAnimation: Animation = {
  duration: ANIMATION_DURATION,

  setup(model: PIXIModel) {
    model.internalModel.coreModel.setParameterValueById("ToggleHearts", 1);
  },

  update(model: PIXIModel, time: number) {
    // 0 - 1
    const duration = 5;
    const cycles = 2;

    const value = Math.cos((time / duration) * cycles * Math.PI);

    model.internalModel.coreModel.setParameterValueById(
        "HeartsAnim",
        value
    );
  },

  teardown(model: PIXIModel) {
    model.internalModel.coreModel.setParameterValueById("ToggleHearts", 0);
  },
};