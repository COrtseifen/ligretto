import { describe, expect, it } from 'vitest';
import { createTapDetector } from './tap';

describe('createTapDetector', () => {
  it('löst beim 5. schnellen Tipp aus', () => {
    const tap = createTapDetector(5, 2000);
    expect([0, 100, 200, 300, 400].map(tap)).toEqual([false, false, false, false, true]);
  });

  it('löst nicht aus, wenn die Tipps zu langsam sind', () => {
    const tap = createTapDetector(5, 2000);
    expect([0, 600, 1200, 1800, 2400].map(tap)).toEqual([false, false, false, false, false]);
  });

  it('beginnt nach dem Auslösen von vorn', () => {
    const tap = createTapDetector(3, 2000);
    expect([0, 10, 20, 30, 40, 50].map(tap)).toEqual([false, false, true, false, false, true]);
  });
});
