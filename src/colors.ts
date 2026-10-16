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

// ---------- Kontrast ----------

/** Relative Helligkeit nach WCAG (0 = schwarz, 1 = weiß). */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Kontrastverhältnis zweier Farben nach WCAG (1 bis 21). */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Kartenfarbe hell bzw. dunkel – muss zu `--surface` in style.css passen. */
export const SURFACE_LIGHT = '#ffffff';
export const SURFACE_DARK = '#1c1c1e';
/** Unter diesem Kontrast geht eine Farbe auf der Fläche unter (Grafik-Mindestwert nach WCAG). */
const MIN_CONTRAST = 3;

/** Ob die Farbe einen Kontrastring braucht – getrennt für hellen und dunklen Modus. */
export function needsRing(hex: string): { light: boolean; dark: boolean } {
  return {
    light: contrastRatio(hex, SURFACE_LIGHT) < MIN_CONTRAST,
    dark: contrastRatio(hex, SURFACE_DARK) < MIN_CONTRAST,
  };
}

/**
 * Färbt ein Element in der Spielerfarbe: setzt `--c` (die Farbe) und `--ring-l`/`--ring-d`
 * (Kontrastring für hell/dunkel, nur wo nötig). Das CSS der Klasse `pc` wählt den passenden Ring.
 */
export function withColor<T extends Element & ElementCSSInlineStyle>(node: T, hex: string): T {
  const ring = needsRing(hex);
  node.classList.add('pc');
  node.style.setProperty('--c', hex);
  if (ring.light) node.style.setProperty('--ring-l', 'var(--ring-on-light)');
  if (ring.dark) node.style.setProperty('--ring-d', 'var(--ring-on-dark)');
  return node;
}

/** Kleiner Farbpunkt neben einem Spielernamen – der Text selbst bleibt in Textfarbe. */
export function colorDot(hex: string): HTMLElement {
  return withColor(el('span', { className: 'player-dot', 'aria-hidden': 'true' }), hex);
}
