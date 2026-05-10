let walkLastTime = 0;
let walkOffLastTime = 0;
let walkStartTime: number | null = null;
let walkOffStartTime: number | null = null;

export function resetWalkAnimation() {
  walkStartTime = null;
  walkOffStartTime = null;
  walkLastTime = 0;
  walkOffLastTime = 0;
}

function getDelta(time: number, lastTime: number) {
  const dtRaw = time - lastTime;
  return Math.max(0, Math.min(dtRaw, 0.05));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyWalkMotion(model: any, localTime: number, progress: number, cycles: number, totalDuration: number) {
  const frequency = (cycles * 2 * Math.PI) / totalDuration;
  const envelope = 1 - Math.pow(progress, 3);

  const step = Math.sin(localTime * frequency);
  const bounceBase = 1 - Math.cos(localTime * frequency * 2);

  const bounce = Math.pow(bounceBase, 1.2) * 2 * envelope;
  const twist = step * 10 * envelope;

  model.internalModel.coreModel.setParameterValueById("ParamBodyAngleY", bounce);
  model.internalModel.coreModel.setParameterValueById("ParamBodyAngleZ", twist);

  return { step, envelope };
}

function getVelocity(step: number, envelope: number, distance: number, totalDuration: number, useEnvelope: boolean, multiplier = 20) {
  const baseSpeed = distance / totalDuration;
  const push = Math.max(0, step);

  if (useEnvelope) {
    const boost = push * 2 * envelope;
    return (baseSpeed + boost) * envelope * multiplier;
  } else {
    const boost = push * 2; // ✅ no envelope decay
    return (baseSpeed + boost) * multiplier;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function walkAnimation(model: any, time: number) {
  const { totalDuration, cycles, distance } = getWalkParams();

  if (walkStartTime === null) {
    walkStartTime = time;
    walkLastTime = time;
    return;
  }

  const localTime = time - walkStartTime;

  const dt = getDelta(time, walkLastTime);

  walkLastTime = time;

  const progress = Math.min(localTime / totalDuration, 1);

  const { step, envelope } = applyWalkMotion(model, localTime, progress, cycles, totalDuration);

  const velocity = getVelocity(step, envelope, distance, totalDuration, true);

  model.x += velocity * dt;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function walkOff(model: any, time: number) {
  const { totalDuration, cycles, distance } = getWalkParams();

  if (walkOffStartTime === null) {
    walkOffStartTime = time;
    walkOffLastTime = time;
    return false;
  }

  const delay = 1;

  model.expression("B1");

  if (time < walkOffStartTime + delay) {
    walkOffLastTime = time;
    return false;
  }

  const localTime = time - walkOffStartTime - delay;

  const dt = getDelta(time, walkOffLastTime);
  walkOffLastTime = time;

  const progress = Math.min(localTime / totalDuration, 1);

  const { step } = applyWalkMotion(model, localTime, progress, cycles, totalDuration);

  if (progress >= 1) return true;

  const velocity = getVelocity(step, 0, distance, totalDuration, false);

  model.x -= velocity * dt;

  return false;
}

function getWalkParams() {
  return {
    totalDuration: 5,
    cycles: 4,
    distance: 25,
  };
}