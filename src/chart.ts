// Liniendiagramm des Punkteverlaufs als selbst gezeichnetes SVG (keine Bibliothek).
// Jede Linie trägt die Kartenfarbe des Spielers; schwer sichtbare Farben bekommen einen Kontrastring.
import { labelEvery, labelsCollide, linearScale, niceTicks } from './chartMath';
import { withColor } from './colors';
import { el } from './dom';
import { formatInt } from './format';

export interface Series {
  name: string;
  /** Kartenfarbe des Spielers (Hex). */
  color: string;
  /** Punktestand nach jeder Runde, beginnend mit 0 vor der ersten Runde. */
  values: number[];
}

const SVG_NS = 'http://www.w3.org/2000/svg';
const HEIGHT = 220;
const MARGIN = { top: 12, right: 12, bottom: 26, left: 8 };
const FONT_SIZE = 12;
const LABEL_GAP = 8;
/** Bis zu so vielen Spielern stehen die Namen direkt am Linienende (sonst nur Legende). */
const MAX_END_LABELS = 4;

function svg<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number> = {},
  text?: string,
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Textbreite in Pixeln, gemessen mit einem unsichtbaren Canvas. */
function measureText(text: string, font: string): number {
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return text.length * FONT_SIZE * 0.6;
  ctx.font = font;
  return ctx.measureText(text).width;
}

export function lineChart(series: Series[]): HTMLElement {
  /** Hervorgehobener Spieler (Tipp auf die Legende), sonst `null`. */
  let highlighted: number | null = null;

  const legendButtons = series.map((s, i) => {
    const button = el(
      'button',
      { type: 'button', className: 'legend-item', 'aria-pressed': 'false' },
      withColor(el('span', { className: 'legend-key', 'aria-hidden': 'true' }), s.color),
      s.name,
    );
    button.addEventListener('click', () => {
      highlighted = highlighted === i ? null : i;
      applyHighlight();
    });
    return button;
  });
  const legend = el(
    'ul',
    { className: 'chart-legend', 'aria-label': 'Legende – antippen hebt einen Spieler hervor' },
    ...legendButtons.map((b) => el('li', {}, b)),
  );

  const tooltip = el('div', { className: 'chart-tooltip', hidden: true });
  const plot = el('div', { className: 'chart-plot' }, tooltip);
  const figure = el('figure', { className: 'chart' }, legend, plot);

  let drawnWidth = 0;
  let selected: number | null = null;
  let showAt: (index: number | null) => void = () => {};
  let seriesGroups: SVGGElement[] = [];
  let topLayer: SVGElement | null = null;

  /** Andere Linien blass, die gewählte nach vorn. */
  function applyHighlight() {
    legendButtons.forEach((b, i) => b.setAttribute('aria-pressed', String(highlighted === i)));
    seriesGroups.forEach((g, i) => g.classList.toggle('dimmed', highlighted !== null && highlighted !== i));
    if (highlighted !== null && topLayer) topLayer.before(seriesGroups[highlighted]);
  }

  const observer = new ResizeObserver(() => {
    if (!figure.isConnected) return observer.disconnect();
    const width = Math.round(plot.clientWidth);
    if (width > 0 && width !== drawnWidth) draw(width);
  });
  observer.observe(plot);

  function draw(width: number) {
    drawnWidth = width;
    plot.querySelector('svg')?.remove();

    const font = `${FONT_SIZE}px ${getComputedStyle(plot).fontFamily}`;
    const count = series[0].values.length; // Runden + Startpunkt
    const all = series.flatMap((s) => s.values);
    const ticks = niceTicks(Math.min(...all), Math.max(...all));
    const yLabelWidth = Math.max(...ticks.map((t) => measureText(formatInt(t), font)));

    const left = MARGIN.left + yLabelWidth + LABEL_GAP;
    const bottom = HEIGHT - MARGIN.bottom;
    const y = linearScale([ticks[0], ticks[ticks.length - 1]], [bottom, MARGIN.top]);

    // Namen am Linienende nur, wenn es wenige Spieler sind und sich die Namen nicht überlappen.
    const endYs = series.map((s) => y(s.values[count - 1]));
    const endLabels = series.length <= MAX_END_LABELS && !labelsCollide(endYs, FONT_SIZE + 2);
    const right =
      width - MARGIN.right - (endLabels ? Math.max(...series.map((s) => measureText(s.name, font))) + LABEL_GAP : 0);
    const x = linearScale([0, count - 1], [left, right]);

    const root = svg('svg', {
      width,
      height: HEIGHT,
      viewBox: `0 0 ${width} ${HEIGHT}`,
      tabindex: 0,
      role: 'img',
      'aria-label': 'Punkteverlauf aller Spieler. Alle Werte stehen auch in der Rundentabelle.',
    });

    // Gitterlinien und y-Beschriftung; die Nulllinie etwas kräftiger.
    // War jemand im Minus, wird die Nulllinie zur deutlichen Trennlinie zwischen Plus und Minus.
    const hasNegative = Math.min(...all) < 0;
    for (const t of ticks) {
      const isZero = t === 0;
      const lineClass = isZero ? (hasNegative ? 'zero-line' : 'baseline') : 'grid';
      const labelClass = isZero && hasNegative ? 'axis-label zero-label' : 'axis-label';
      root.append(
        svg('line', { class: lineClass, x1: left, x2: right, y1: y(t), y2: y(t) }),
        svg('text', { class: labelClass, x: left - LABEL_GAP, y: y(t), 'text-anchor': 'end', 'dominant-baseline': 'middle' }, formatInt(t)),
      );
    }

    // x-Beschriftung: Rundennummern, bei vielen Runden ausgedünnt.
    const every = labelEvery(count - 1, right - left);
    for (let r = every; r < count; r += every) {
      root.append(svg('text', { class: 'axis-label', x: x(r), y: HEIGHT - 6, 'text-anchor': 'middle' }, String(r)));
    }

    const crosshair = svg('line', { class: 'crosshair', y1: MARGIN.top, y2: bottom, visibility: 'hidden' });
    root.append(crosshair);

    // Pro Spieler eine Gruppe: Kontrastring (nur sichtbar, wo nötig), Linie, Endpunkt, Name.
    seriesGroups = series.map((s) => {
      const d = s.values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(v)}`).join('');
      const ex = x(count - 1);
      const ey = y(s.values[count - 1]);
      const g = withColor(svg('g', { class: 'series' }), s.color);
      g.append(
        svg('path', { class: 'line-halo', d }),
        svg('path', { class: 'line', d }),
        svg('circle', { class: 'dot-halo', cx: ex, cy: ey, r: 6 }),
        svg('circle', { class: 'dot', cx: ex, cy: ey, r: 4 }),
      );
      if (endLabels) {
        g.append(svg('text', { class: 'end-label', x: ex + LABEL_GAP, y: ey, 'dominant-baseline': 'middle' }, s.name));
      }
      return g;
    });
    root.append(...seriesGroups);

    // Markierungspunkte für die gewählte Runde (über den Linien).
    const focusDots = series.map((s) => {
      const g = withColor(svg('g', { visibility: 'hidden' }), s.color);
      g.append(svg('circle', { class: 'dot-halo', r: 6 }), svg('circle', { class: 'dot', r: 4 }));
      return g;
    });
    topLayer = svg('g');
    topLayer.append(...focusDots);
    root.append(topLayer);
    plot.prepend(root);
    applyHighlight();

    showAt = (index) => {
      selected = index;
      if (index === null) {
        crosshair.setAttribute('visibility', 'hidden');
        focusDots.forEach((dot) => dot.setAttribute('visibility', 'hidden'));
        tooltip.hidden = true;
        return;
      }
      const cx = x(index);
      crosshair.setAttribute('x1', String(cx));
      crosshair.setAttribute('x2', String(cx));
      crosshair.setAttribute('visibility', 'visible');
      focusDots.forEach((dot, i) => {
        dot.setAttribute('transform', `translate(${cx},${y(series[i].values[index])})`);
        dot.setAttribute('visibility', 'visible');
      });

      // Ein Tooltip mit allen Spielern, nach Punkten sortiert. Wert zuerst, Name danach.
      const rows = [...series]
        .sort((a, b) => b.values[index] - a.values[index])
        .map((s) =>
          el(
            'li',
            {},
            withColor(el('span', { className: 'line-key' }), s.color),
            el('strong', {}, formatInt(s.values[index])),
            el('span', { className: 'muted' }, s.name),
          ),
        );
      tooltip.replaceChildren(el('p', {}, index === 0 ? 'Start' : `Nach Runde ${index}`), el('ul', {}, ...rows));
      tooltip.hidden = false;

      // Neben die Hilfslinie setzen; am rechten Rand auf die linke Seite ausweichen.
      const tipWidth = tooltip.offsetWidth;
      const leftPos = cx + 12 + tipWidth > width ? cx - 12 - tipWidth : cx + 12;
      tooltip.style.left = `${Math.max(0, leftPos)}px`;
    };

    const indexAt = (clientX: number) => {
      const px = clientX - root.getBoundingClientRect().left;
      const ratio = (px - left) / (right - left || 1);
      return Math.min(count - 1, Math.max(0, Math.round(ratio * (count - 1))));
    };

    root.addEventListener('pointerdown', (e) => showAt(indexAt(e.clientX)));
    root.addEventListener('pointermove', (e) => {
      // Maus: Hover genügt. Finger: nur solange er aufliegt.
      if (e.pointerType === 'mouse' || e.buttons > 0) showAt(indexAt(e.clientX));
    });
    root.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'mouse') showAt(null);
    });

    // Tastatur: Pfeiltasten wählen die Runde.
    root.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const step = e.key === 'ArrowRight' ? 1 : -1;
      showAt(Math.min(count - 1, Math.max(0, (selected ?? count - 1) + (selected === null ? 0 : step))));
    });
    root.addEventListener('blur', () => showAt(null));

    if (selected !== null) showAt(Math.min(selected, count - 1));
  }

  // Tippen außerhalb des Diagramms blendet den Tooltip aus (für Touch, wo es kein „Verlassen" gibt).
  const hideOnOutsideTap = (e: PointerEvent) => {
    if (!figure.isConnected) return document.removeEventListener('pointerdown', hideOnOutsideTap);
    if (!plot.contains(e.target as Node)) showAt(null);
  };
  document.addEventListener('pointerdown', hideOnOutsideTap);

  return figure;
}
