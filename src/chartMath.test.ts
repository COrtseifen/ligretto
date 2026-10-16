import { describe, expect, it } from 'vitest';
import { labelEvery, labelsCollide, linearScale, niceTicks } from './chartMath';

describe('niceTicks', () => {
  it('liefert runde Schritte, die den Bereich einschließen', () => {
    expect(niceTicks(0, 47)).toEqual([0, 20, 40, 60]);
    expect(niceTicks(-12, 30)).toEqual([-20, 0, 20, 40]);
  });

  it('nutzt kleine Schritte bei kleinem Bereich, aber nie unter 1', () => {
    expect(niceTicks(0, 4)).toEqual([0, 1, 2, 3, 4]);
    expect(niceTicks(0, 2)).toEqual([0, 1, 2]);
  });

  it('spreizt einen flachen Bereich auf', () => {
    expect(niceTicks(0, 0)).toEqual([-1, 0, 1]);
  });

  it('enthält keine −0', () => {
    expect(Object.is(niceTicks(-5, 5).find((t) => t === 0), 0)).toBe(true);
  });
});

describe('linearScale', () => {
  it('bildet Werte linear ab, auch umgekehrt (y-Achse wächst nach unten)', () => {
    const y = linearScale([0, 100], [200, 0]);
    expect(y(0)).toBe(200);
    expect(y(50)).toBe(100);
    expect(y(100)).toBe(0);
  });
});

describe('labelEvery', () => {
  it('beschriftet jede Runde, wenn genug Platz ist', () => {
    expect(labelEvery(5, 300)).toBe(1);
  });

  it('dünnt bei vielen Runden aus', () => {
    expect(labelEvery(30, 300)).toBe(5);
  });
});

describe('labelsCollide', () => {
  it('erkennt zu nah beieinander liegende Beschriftungen', () => {
    expect(labelsCollide([10, 50, 90], 14)).toBe(false);
    expect(labelsCollide([10, 50, 58], 14)).toBe(true);
  });
});
