import { describe, expect, it } from 'vitest';
import { COLORS, contrastRatio, duplicateColorIndices, needsRing, nextFreeColor } from './colors';

describe('COLORS', () => {
  it('enthält 12 verschiedene Farben, 4 pro Box', () => {
    expect(new Set(COLORS.map((c) => c.hex)).size).toBe(12);
    for (const box of ['Blau', 'Grün', 'Rot']) {
      expect(COLORS.filter((c) => c.box === box)).toHaveLength(4);
    }
  });
});

describe('nextFreeColor', () => {
  it('nimmt die erste noch freie Farbe', () => {
    expect(nextFreeColor([])).toBe('#DD9D31');
    expect(nextFreeColor(['#DD9D31', '#616362'])).toBe('#E6633C');
  });

  it('liefert null, wenn alle vergeben sind', () => {
    expect(nextFreeColor(COLORS.map((c) => c.hex))).toBeNull();
  });
});

describe('duplicateColorIndices', () => {
  it('findet doppelt vergebene Farben', () => {
    expect(duplicateColorIndices(['#DD9D31', '#E6633C'])).toEqual([]);
    expect(duplicateColorIndices(['#DD9D31', '#E6633C', '#DD9D31'])).toEqual([0, 2]);
  });
});

describe('contrastRatio', () => {
  it('liefert die bekannten Grenzwerte', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1);
  });
});

describe('needsRing', () => {
  const ringed = (mode: 'light' | 'dark') => COLORS.filter((c) => needsRing(c.hex)[mode]).map((c) => c.name);

  it('markiert helle Farben im hellen Modus', () => {
    expect(ringed('light')).toEqual(['Ocker', 'Hellblau', 'Grün', 'Altrosa']);
  });

  it('markiert dunkle Farben im dunklen Modus', () => {
    expect(ringed('dark')).toEqual(['Grau', 'Lila', 'Braun', 'Petrol', 'Schwarz']);
  });
});
