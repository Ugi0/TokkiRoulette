let position = 0;
let lastTime = 0;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function walkAnimation(model: any, time: number, setX: React.Dispatch<React.SetStateAction<number>>) {
  const totalDuration = 4.5;
  const cycles = 4;

  const frequency = (cycles * 2 * Math.PI) / totalDuration;

  const dt = time - lastTime;
  lastTime = time;

  const progress = Math.min(time / totalDuration, 1);

  const envelope = 1 - Math.pow(progress, 3);

  const step = Math.sin(time * frequency);

  const bounceBase = 1 - Math.cos(time * frequency * 2);

  const bounce = Math.pow(bounceBase, 1.2) * 2 * envelope;
  const twist = step * 10 * envelope;

  model.internalModel.coreModel.setParameterValueById("ParamBodyAngleY", bounce);
  model.internalModel.coreModel.setParameterValueById("ParamBodyAngleZ", twist);

  const distance = 25;
  const baseSpeed = distance / totalDuration;

  const push = Math.max(0, step);

  const boost = push * 2 * envelope;

  const velocity = baseSpeed + boost;

  if (progress < 1) {
    position += velocity * dt;
    position = Math.min(position, distance);
  }

  setX(position);
}