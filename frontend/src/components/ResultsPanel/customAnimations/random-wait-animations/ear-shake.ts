import type { PIXIModel } from "../../../../types/pixi";
import { ANIMATION_DURATION, type Animation } from "./Animation";

export const earShakeAnimation: Animation = {
  duration: ANIMATION_DURATION,

  setup(model: PIXIModel) {
    model.internalModel.coreModel.setParameterValueById("ParamLEarPhy1", 0);
    model.internalModel.coreModel.setParameterValueById("ParamLEarPhy2", 0);
    model.internalModel.coreModel.setParameterValueById("ParamLEarPhy3", 0);

    model.internalModel.coreModel.setParameterValueById("ParamREarPhy1", 0);
    model.internalModel.coreModel.setParameterValueById("ParamREarPhy2", 0);
    model.internalModel.coreModel.setParameterValueById("ParamREarPhy3", 0);
  },

  update(model: PIXIModel, time: number) {
    // -1 - 1
    const amplitude = 1;
    const cycles = 10;

    const normalizedTime = time / this.duration;

    const value =
      amplitude *
      Math.sin(normalizedTime * cycles * Math.PI * 2);

    model.internalModel.coreModel.setParameterValueById(
      "EarJerkL",
      value
    );

    model.internalModel.coreModel.setParameterValueById(
      "EarJerkR",
      value
    );
  },

  teardown(model: PIXIModel) {
    model.internalModel.coreModel.setParameterValueById(
      "ParamLEarRotation",
      0
    );

    model.internalModel.coreModel.setParameterValueById(
      "ParamREarRotation",
      0
    );
  },
};