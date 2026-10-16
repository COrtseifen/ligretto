import { describe, expect, it } from 'vitest';
import { formatDecimal, formatInt, formatSigned } from './format';

describe('formatSigned', () => {
  it('zeigt Plus, Minus und Null', () => {
    expect(formatSigned(9)).toBe('+9');
    expect(formatSigned(-4)).toBe('−4');
    expect(formatSigned(0)).toBe('0');
  });
});

describe('formatInt', () => {
  it('nutzt ein echtes Minuszeichen', () => {
    expect(formatInt(17)).toBe('17');
    expect(formatInt(-4)).toBe('−4');
  });
});

describe('formatDecimal', () => {
  it('rundet auf eine Nachkommastelle mit Komma', () => {
    expect(formatDecimal(10.5)).toBe('10,5');
    expect(formatDecimal(2)).toBe('2');
    expect(formatDecimal(1 / 3)).toBe('0,3');
    expect(formatDecimal(-2.25)).toBe('−2,3');
  });
});
