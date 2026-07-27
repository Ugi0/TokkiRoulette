import type { PIXIModel } from "../../../../types/pixi";

export const ANIMATION_DURATION = 5;

export interface Animation {
  setup: (model: PIXIModel) => void;
  update: (model: PIXIModel, time: number) => void;
  teardown: (model: PIXIModel) => void;
  duration: number;
}