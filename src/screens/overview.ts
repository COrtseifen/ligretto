// Spielstand während des Spiels bzw. Endübersicht nach „Spiel beenden":
// Rangliste, Verlaufsdiagramm, Rundentabelle (wie auf dem Block) und – am Ende – Statistik.
import { lineChart } from '../chart';
import { colorDot, withColor } from '../colors';
import { el } from '../dom';
import { formatDecimal, formatInt, formatSigned } from '../format';
import { cumulativeScores, playerStats, ranking, roundPoints, totals, type PlayerStats } from '../scoring';
import type { Game } from '../types';

export interface OverviewActions {
  /** Zurück zur Rundeneingabe (laufendes Spiel). */
  onBack(): void;
  /** Neues Spiel beginnen (beendetes Spiel). */
  onNewGame(): void;
  /** Letzte Runde bearbeiten bzw. löschen. */
  onEditLast(): void;
  onDeleteLast(): void;
}

/** „Runde N bearbeiten" / „Runde N löschen" unter der Rundentabelle. */
function lastRoundActions(n: number, onEdit: () => void, onDelete: () => void): HTMLElement {
  const edit = el('button', { type: 'button', className: 'btn secondary' }, `Runde ${n} bearbeiten`);
  const remove = el('button', { type: 'button', className: 'btn secondary destructive' }, `Runde ${n} löschen`);
  edit.addEventListener('click', onEdit);
  remove.addEventListener('click', onDelete);
  return el('div', { className: 'round-actions' }, edit, remove);
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
        colorDot(game.colors[s.player]),
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
    ...game.players.map((name, p) => el('th', { scope: 'col' }, colorDot(game.colors[p]), name)),
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
      const color = game.colors[player];
      const card = el(
        'section',
        { className: 'group stat-card' },
        el('h3', {}, colorDot(color), el('span', { className: 'name' }, name), el('span', { className: 'muted' }, `${place}. Platz`)),
        el(
          'dl',
          {},
          ...STAT_ROWS.map(([label, format]) =>
            el('div', {}, el('dt', {}, label), el('dd', {}, format(s))),
          ),
        ),
      );
      return withColor(card, color); // Rahmen in der Spielerfarbe
    }),
  );
}

export function overviewScreen(
  game: Game,
  { onBack, onNewGame, onEditLast, onDeleteLast }: OverviewActions,
): HTMLElement {
  const n = game.rounds.length;
  const content: HTMLElement[] = [
    el('h1', {}, game.finished ? 'Spielende' : 'Spielstand'),
    el('p', { className: 'subtitle muted' }, n === 1 ? '1 Runde gespielt' : `${n} Runden gespielt`),
    rankingList(game),
  ];

  if (n > 0) {
    const scores = cumulativeScores(game);
    const series = game.players.map((name, p) => ({ name, color: game.colors[p], values: scores[p] }));
    content.push(
      ...section('Verlauf', el('div', { className: 'group chart-card' }, lineChart(series))),
      ...section('Runden', roundsTable(game)),
      lastRoundActions(n, onEditLast, onDeleteLast),
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
