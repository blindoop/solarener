export const SINK = 240;
export const RISE = 820;
export const DEPTH = 0.27;

export const clamp = (x: number, a = 0, b = 1): number =>
  Math.min(b, Math.max(a, x));

export const smooth = (a: number, b: number, x: number): number => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export interface ClockState {
  night: number;
  target: number;
  from: number;
  start: number;
  queued: number | null;
  swapped: boolean;
  k: number;
  animating: boolean;
}

export interface FrameOutput {
  y: number;
  s: number;
  dip: number;
  k: number;
  k2: number;
  didSwap: boolean;
  swapTarget: number;
}

export function createInitialClockState(): ClockState {
  return {
    night: 1,
    target: 1,
    from: 1,
    start: -1e9,
    queued: null,
    swapped: true,
    k: 1,
    animating: false,
  };
}

export function beginTransition(
  state: ClockState,
  n: number,
  now: number
): void {
  state.target = n;
  state.from = state.k;
  state.start = now;
  state.swapped = false;
  state.animating = true;
}

export function stepFrame(state: ClockState, now: number): FrameOutput {
  const d = now - state.start;
  let y = 0;
  let s = 0;
  let dip = 0;
  let k2 = state.k;
  let didSwap = false;
  let swapTarget = state.target;

  if (state.animating) {
    if (d < SINK) {
      const x = d / SINK;
      y = x * x * (3 - 2 * x) * DEPTH;
    } else {
      if (!state.swapped) {
        state.swapped = true;
        state.night = state.target;
        didSwap = true;
        swapTarget = state.target;
      }
      const x = clamp((d - SINK) / RISE);
      y = Math.pow(1 - x, 3.4) * DEPTH;
    }
    s = smooth(0, SINK * 0.92, d) * (1 - smooth(SINK + 70, SINK + RISE * 0.92, d));
    dip = smooth(30, 190, d) * (1 - smooth(330, 720, d));
    state.k = state.from + (state.target - state.from) * smooth(120, 520, d);
    k2 = state.from + (state.target - state.from) * smooth(340, 760, d);

    if (d >= SINK + RISE) {
      state.animating = false;
      state.k = k2 = state.target;
      y = s = dip = 0;
      if (state.queued !== null && state.queued !== state.target) {
        const q = state.queued;
        state.queued = null;
        beginTransition(state, q, now);
      } else {
        state.queued = null;
      }
    }
  }

  return {
    y,
    s,
    dip,
    k: state.k,
    k2,
    didSwap,
    swapTarget,
  };
}
