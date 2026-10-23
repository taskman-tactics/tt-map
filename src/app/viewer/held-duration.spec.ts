import { describe, expect, it } from 'vitest';
import {
  HOLD_CYCLE_MS,
  formatHeldDuration,
  holdCycleProgressRatio,
  holdCycleRemainingMs,
} from './held-duration';

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe('holdCycleProgressRatio', () => {
  it('maps elapsed time into the current 8h cycle', () => {
    expect(holdCycleProgressRatio(3 * HOUR)).toBeCloseTo(3 / 8);
    expect(holdCycleProgressRatio(23 * HOUR)).toBeCloseTo(7 / 8);
  });

  it('resets at exact 8h thresholds', () => {
    expect(holdCycleProgressRatio(0)).toBe(0);
    expect(holdCycleProgressRatio(8 * HOUR)).toBe(0);
    expect(holdCycleProgressRatio(24 * HOUR)).toBe(0);
  });
});

describe('holdCycleRemainingMs', () => {
  it('returns time until the next 8h threshold', () => {
    expect(holdCycleRemainingMs(3 * HOUR)).toBe(5 * HOUR);
    expect(holdCycleRemainingMs(23 * HOUR)).toBe(1 * HOUR);
  });

  it('returns a full cycle at exact thresholds', () => {
    expect(holdCycleRemainingMs(0)).toBe(HOLD_CYCLE_MS);
    expect(holdCycleRemainingMs(8 * HOUR)).toBe(HOLD_CYCLE_MS);
  });
});

describe('formatHeldDuration', () => {
  it('formats minutes only', () => {
    expect(formatHeldDuration(12 * MIN)).toBe('12min');
  });

  it('formats hours and minutes', () => {
    expect(formatHeldDuration(3 * HOUR + 12 * MIN)).toBe('3h 12min');
  });

  it('formats days and hours', () => {
    expect(formatHeldDuration(2 * DAY + 4 * HOUR)).toBe('2d 4h');
  });

  it('floors sub-minute durations to 0min', () => {
    expect(formatHeldDuration(0)).toBe('0min');
    expect(formatHeldDuration(59_999)).toBe('0min');
  });

  it('omits zero lower units when higher units are present', () => {
    expect(formatHeldDuration(2 * HOUR)).toBe('2h');
    expect(formatHeldDuration(1 * DAY)).toBe('1d');
  });
});
