// Farbauswahl als Blatt von unten (iOS-„Sheet"), umgesetzt mit dem HTML-Element <dialog>.
import { BOXES, COLORS, withColor } from '../colors';
import { el } from '../dom';

export interface ColorPickerOptions {
  /** Für wen gewählt wird (Überschrift). */
  playerName: string;
  /** Aktuelle Farbe dieses Spielers. */
  current: string;
  /** Farben, die andere Spieler schon haben → Name des Spielers. */
  takenBy: ReadonlyMap<string, string>;
  onSelect(hex: string): void;
}

export function openColorPicker({ playerName, current, takenBy, onSelect }: ColorPickerOptions): void {
  const dialog = el('dialog', { className: 'sheet' });

  const close = () => dialog.close();
  dialog.addEventListener('close', () => dialog.remove());
  // Tipp auf den abgedunkelten Hintergrund schließt (der Hintergrund gehört zum <dialog> selbst).
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) close();
  });

  const groups = BOXES.map((box) => {
    const swatches = COLORS.filter((c) => c.box === box).map((c) => {
      const owner = takenBy.get(c.hex);
      const selected = c.hex === current;
      const button = el(
        'button',
        {
          type: 'button',
          className: 'swatch',
          disabled: owner !== undefined,
          'aria-pressed': String(selected),
          'aria-label': owner ? `${c.name}, vergeben an ${owner}` : c.name,
        },
        withColor(el('span', { className: 'swatch-color', 'aria-hidden': 'true' }), c.hex),
        el('span', { className: 'swatch-label' }, owner ?? c.name),
      );
      button.addEventListener('click', () => {
        onSelect(c.hex);
        close();
      });
      return button;
    });
    return el(
      'section',
      {},
      el('h3', { className: 'section-header' }, `${box}e Box`),
      el('div', { className: 'swatches' }, ...swatches),
    );
  });

  const cancel = el('button', { type: 'button', className: 'nav-btn' }, 'Abbrechen');
  cancel.addEventListener('click', close);

  dialog.append(
    el('header', { className: 'sheet-header' }, el('h2', {}, `Farbe für ${playerName}`), cancel),
    ...groups,
  );
  document.body.append(dialog);
  dialog.showModal();
}
