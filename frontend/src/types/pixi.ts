import { Live2DModel } from "pixi-live2d-display/cubism4";

export type PIXIModel = Live2DModel & { tint: number } & { internalModel: { coreModel: { setParameterValueById: (id: string, value: number) => void } } };