import type { PIXIModel } from "../../../../types/pixi";
import { ANIMATION_DURATION, type Animation } from "./Animation";

export const starsAnimation: Animation = {
    duration: ANIMATION_DURATION,

  setup(model: PIXIModel) {
    model.internalModel.coreModel.setParameterValueById("ToggleStars", 1);
  },

  update(model: PIXIModel, time: number) {
    // Smooth ease-in-out from 0 to 1
    const value = 0.5 + 0.5 * Math.cos((time / this.duration) * Math.PI);

    console.log("StarsAnim value:", value);

    model.internalModel.coreModel.setParameterValueById(
      "StarsAnim",
      value
    );
  },

  teardown(model: PIXIModel) {
    model.internalModel.coreModel.setParameterValueById("ToggleStars", 0);
  }
};