import type { PIXIModel } from "../../../../types/pixi";
import { ANIMATION_DURATION, type Animation } from "./Animation";

export const headRotateAnimation: Animation = {
  duration: ANIMATION_DURATION,

  setup() {},

  update(model: PIXIModel, time: number) {
    const t = time / this.duration;

    const amplitude = 30 * Math.pow(1 - t, 2);

    const value = amplitude * Math.sin(t * 6 * Math.PI * 2);

    model.internalModel.coreModel.setParameterValueById(
      "ParamAngleZ",
      value
    );
  },

  teardown(model: PIXIModel) {
    model.internalModel.coreModel.setParameterValueById(
      "ParamAngleZ",
      0
    );
  },
};