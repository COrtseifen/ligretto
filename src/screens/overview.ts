// Spielstand während des Spiels bzw. Endübersicht nach „Spiel beenden":
// Rangliste, Verlaufsdiagramm, Rundentabelle (wie auf dem Block) und – am Ende – Statistik.
import { lineChart, seriesClass } from '../chart';
import { el } from '../dom';
import { formatDecimal, formatInt, formatSigned } from '../format';
import { cumulativeScores, playerStats, ranking, roundPoints, totals, type PlayerStats } from '../scoring';
import type { Game } from '../types';

export interface OverviewActions {
  /** Zurück zur Rundeneingabe (laufendes Spiel). */
  onBack(): void;
  /** Neues Spiel beginnen (beendetes Spiel). */
  onNewGame(): void;
}

/** Farbpunkt, der den Spieler kennzeichnet – Text bleibt in Textfarbe. */
function dot(player: number): HTMLElement {
  return el('span', { className: `player-dot ${seriesClass(player)}`, 'aria-hidden': 'true' });
}

function section(title: string, ...content: HTMLElement[]): HTMLElement[] {
  return [el('h2', { className: 'section-header' }, title), ...content];
}

function rankingList(game: Game): HTMLElement {
  return el(
    'ol',
    { className: 'group ranking' },
    ...ranking(game).map((s) =>
      el(
        'li',
        {},
        el('span', { className: 'place' }, `${s.place}.`),
        dot(s.player),
        el('span', { className: 'name' }, s.name),
        el('span', { className: 'total' }, formatInt(s.total)),
      ),
    ),
  );
}

function roundsTable(game: Game): HTMLElement {
  const sums = totals(game);
  const head = el(
    'tr',
    {},
    el('th', { scope: 'col' }, 'Runde'),
    ...game.players.map((name, p) => el('th', { scope: 'col' }, dot(p), name)),
  );
  const rows = game.rounds.map((round, r) =>
    el(
      'tr',
      {},
      el('th', { scope: 'row' }, String(r + 1)),
      ...round.map((e) => el('td', {}, formatSigned(roundPoints(e.tisch, e.rest)))),
    ),
  );
  const foot = el(
    'tr',
    {},
    el('th', { scope: 'row' }, 'Gesamt'),
    ...sums.map((total) => el('td', {}, formatInt(total))),
  );

  // Bei vielen Spielern seitlich scrollbar, die Rundenspalte bleibt stehen.
  return el(
    'div',
    { className: 'group table-scroll' },
    el('table', { className: 'rounds' }, el('thead', {}, head), el('tbody', {}, ...rows), el('tfoot', {}, foot)),
  );
}

const STAT_ROWS: [label: string, format: (s: PlayerStats) => string][] = [
  ['Beste Runde', (s) => formatSigned(s.bestRound)],
  ['Schlechteste Runde', (s) => formatSigned(s.worstRound)],
  ['Meiste Tischkarten', (s) => String(s.mostTischkarten)],
  ['Runden beendet', (s) => String(s.finishedRounds)],
  ['Ø Restkarten', (s) => formatDecimal(s.avgRestkarten)],
  ['Ø Tischkarten', (s) => formatDecimal(s.avgTischkarten)],
];

function statsCards(game: Game): HTMLElement {
  const stats = playerStats(game);
  return el(
    'div',
    { className: 'stats-grid' },
    ...ranking(game).map(({ player, name, place }) => {
      const s = stats[player]!;
      return el(
        'section',
        { className: `group stat-card ${seriesClass(player)}` },
        el('h3', {}, dot(player), el('span', { className: 'name' }, name), el('span', { className: 'muted' }, `${place}. Platz`)),
        el(
          'dl',
          {},
          ...STAT_ROWS.map(([label, format]) =>
            el('div', {}, el('dt', {}, label), el('dd', {}, format(s))),
          ),
        ),
      );
    }),
  );
}

export function overviewScreen(game: Game, { onBack, onNewGame }: OverviewActions): HTMLElement {
  const n = game.rounds.length;
  const content: HTMLElement[] = [
    el('h1', {}, game.finished ? 'Spielende' : 'Spielstand'),
    el('p', { className: 'subtitle muted' }, n === 1 ? '1 Runde gespielt' : `${n} Runden gespielt`),
    rankingList(game),
  ];

  if (n > 0) {
    const scores = cumulativeScores(game);
    const series = game.players.map((name, p) => ({ name, colorIndex: p, values: scores[p] }));
    content.push(
      ...section('Verlauf', el('div', { className: 'group chart-card' }, lineChart(series))),
      ...section('Runden', roundsTable(game)),
    );
    if (game.finished) content.push(...section('Statistik', statsCards(game)));
  }

  const action = game.finished
    ? el('button', { type: 'button', className: 'btn primary' }, 'Neues Spiel')
    : el('button', { type: 'button', className: 'btn primary' }, 'Zurück zur Runde');
  action.addEventListener('click', game.finished ? onNewGame : onBack);

  return el(
    'main',
    { className: 'screen' },
    el('div', { className: 'content' }, ...content),
    el('footer', { className: 'actions' }, action),
  );
}
