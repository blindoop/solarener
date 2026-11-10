import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SINK,
  RISE,
  DEPTH,
  clamp,
  smooth,
  createInitialClockState,
  beginTransition,
  stepFrame,
} from './fogClock';

test('clamp and smooth step behave accurately', () => {
  assert.equal(clamp(-5, 0, 1), 0);
  assert.equal(clamp(5, 0, 1), 1);
  assert.equal(smooth(0, 100, 0), 0);
  assert.equal(smooth(0, 100, 50), 0.5);
  assert.equal(smooth(0, 100, 100), 1);
});

test('sink reaches DEPTH at SINK and swaps house set on first frame >= SINK', () => {
  const state = createInitialClockState();
  beginTransition(state, 0, 1000);

  // Mid-sink at d = 120ms (half of SINK=240)
  const midSink = stepFrame(state, 1120);
  assert.equal(midSink.didSwap, false);
  assert.ok(Math.abs(midSink.y - 0.5 * DEPTH) < 1e-6);
  assert.ok(midSink.s > 0.4);

  // At d = 240ms (SINK), swap occurs and y is at maximum DEPTH
  const atSwap = stepFrame(state, 1000 + SINK);
  assert.equal(atSwap.didSwap, true);
  assert.equal(atSwap.swapTarget, 0);
  assert.ok(Math.abs(atSwap.y - DEPTH) < 1e-6);

  // Next frame does not swap again
  const afterSwap = stepFrame(state, 1000 + SINK + 16);
  assert.equal(afterSwap.didSwap, false);
});

test('animation completes at SINK + RISE and processes queued target', () => {
  const state = createInitialClockState();
  beginTransition(state, 0, 0);
  state.queued = 1;

  // Step through swap first
  stepFrame(state, SINK);
  // Step to end of transition (SINK + RISE = 1060ms)
  const end = stepFrame(state, SINK + RISE);
  assert.equal(end.y, 0);
  assert.equal(end.s, 0);
  assert.equal(end.dip, 0);
  assert.equal(end.k, 0);
  assert.equal(end.k2, 0);

  // Because queued was 1, it immediately started a new transition to 1
  assert.equal(state.animating, true);
  assert.equal(state.target, 1);
  assert.equal(state.queued, null);
});
