import type { PIXIModel } from "../../../types/pixi";

const TRANSFORMATIONS = [
    { chance: 0.3, apply(model: PIXIModel) {
        model.internalModel.coreModel.setParameterValueById("ToggleCry", 1);
        model.internalModel.coreModel.setParameterValueById("ParamMouthForm", -1);
    } },
    { chance: 0.5, apply(model: PIXIModel) {
        model.internalModel.coreModel.setParameterValueById("HairLength", 1);
    } },
    { chance: 0.2, apply(model: PIXIModel) {
        model.internalModel.coreModel.setParameterValueById("ToggleGooglyEyes", 1);
    } },
    { chance: 0.3, apply(model: PIXIModel) {
        model.internalModel.coreModel.setParameterValueById("ToggleDespair", 1);
    } },
    { chance: 0.1, apply(model: PIXIModel) {
        model.internalModel.coreModel.setParameterValueById("ToggleBald", 1);
    }},
] as const;

export function applyTransformations(model: PIXIModel) {
    for (const transformation of TRANSFORMATIONS) {
        if (Math.random() < transformation.chance) {
            transformation.apply(model);
        }
    }
}

// ParamMouthForm for frowning mouth