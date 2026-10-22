import { describe, expect, it } from 'vitest';
import { formatHeldDuration } from './held-duration';

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

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
