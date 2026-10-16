import { describe, expect, it } from 'vitest';
import { roundPoints } from './scoring';

describe('roundPoints', () => {
  it('zählt Tischkarten positiv', () => {
    expect(roundPoints(12, 0)).toBe(12);
  });

  it('zieht pro Restkarte 2 Punkte ab', () => {
    expect(roundPoints(0, 10)).toBe(-20);
  });

  it('verrechnet beides', () => {
    expect(roundPoints(15, 3)).toBe(9);
  });
});
