// Spielerfarben = Kartenfarben der drei Ligretto-Boxen. Jeder Spieler wählt eine, keine doppelt.
import { el } from './dom';

export type Box = 'Blau' | 'Grün' | 'Rot';

export interface PlayerColor {
  /** Hex-Code, dient zugleich als Kennung im gespeicherten Spiel. */
  hex: string;
  name: string;
  box: Box;
}

export const BOXES: readonly Box[] = ['Blau', 'Grün', 'Rot'];

/** Reihenfolge = Reihenfolge der automatischen Vergabe. */
export const COLORS: readonly PlayerColor[] = [
  { hex: '#DD9D31', name: 'Ocker', box: 'Blau' },
  { hex: '#E6633C', name: 'Orange', box: 'Blau' },
  { hex: '#616362', name: 'Grau', box: 'Blau' },
  { hex: '#17B6DC', name: 'Hellblau', box: 'Blau' },
  { hex: '#603584', name: 'Lila', box: 'Grün' },
  { hex: '#5B3A10', name: 'Braun', box: 'Grün' },
  { hex: '#E01C8A', name: 'Pink', box: 'Grün' },
  { hex: '#7BA93D', name: 'Grün', box: 'Grün' },
  { hex: '#C53C55', name: 'Rot', box: 'Rot' },
  { hex: '#156A8D', name: 'Petrol', box: 'Rot' },
  { hex: '#C68A8B', name: 'Altrosa', box: 'Rot' },
  { hex: '#020202', name: 'Schwarz', box: 'Rot' },
];

export function isKnownColor(hex: string): boolean {
  return COLORS.some((c) => c.hex === hex);
}

export function colorName(hex: string): string {
  return COLORS.find((c) => c.hex === hex)?.name ?? hex;
}

/** Erste Farbe (in Box-Reihenfolge), die noch niemand hat; `null`, wenn alle vergeben sind. */
export function nextFreeColor(taken: readonly string[]): string | null {
  return COLORS.find((c) => !taken.includes(c.hex))?.hex ?? null;
}

/** Indizes aller Spieler, deren Farbe mehrfach vergeben ist. */
export function duplicateColorIndices(colors: readonly string[]): number[] {
  return colors.flatMap((c, i) => (colors.indexOf(c) !== colors.lastIndexOf(c) ? [i] : []));
}

/** Färbt ein Element in der Spielerfarbe: setzt die CSS-Variable `--c`, die Kinder erben. */
export function withColor<T extends Element & ElementCSSInlineStyle>(node: T, hex: string): T {
  node.style.setProperty('--c', hex);
  return node;
}

/** Kleiner Farbpunkt neben einem Spielernamen – der Text selbst bleibt in Textfarbe. */
export function colorDot(hex: string): HTMLElement {
  return withColor(el('span', { className: 'player-dot', 'aria-hidden': 'true' }), hex);
}
