// Pure, DOM-free board logic — importable from both the browser (app.js) and
// Node (scripts/check-board.mjs). No dependencies, no other module to share
// this file with, so shuffle() lives here directly rather than in a separate
// utility file.
//
// Board shape: flat-top hexagons in the "odd-q" offset scheme — odd columns
// are shifted down half a hex-height so columns interlock. The player
// connects row 0 to the last row (top-to-bottom); the computer opponent
// connects column 0 to the last column (left-to-right). Unlike the original
// (fixed 5x4) board this now comes in three sizes — see SIZES below — so
// every function that needs board dimensions takes a `dims = {cols, rows}`
// parameter instead of reading fixed constants.
//
// The real show's board is "designed so no ties are possible", but that's a
// property of its specific *rhombus*-shaped board and isn't assumed to carry
// over here for any of these three (rectangular) sizes — see
// scripts/check-board.mjs for the Monte Carlo regression that checks each
// size's geometry actually always decides a winner (or draw) rather than
// getting stuck.

export const SIZES = {
  small: { cols: 5, rows: 4, dropped: 2, hexWidth: 74, label: "Small — 20 hexes" },
  medium: { cols: 7, rows: 5, dropped: 4, hexWidth: 56, label: "Medium — 35 hexes" },
  large: { cols: 9, rows: 6, dropped: 6, hexWidth: 44, label: "Large — 54 hexes" },
};

export function shuffle(array) {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function inBounds(col, row, dims) {
  return col >= 0 && col < dims.cols && row >= 0 && row < dims.rows;
}

export function cellKey(col, row) {
  return `${col},${row}`;
}

export function neighborsOf(col, row, dims) {
  const isEven = col % 2 === 0;
  const offsets = isEven
    ? [
        [0, -1], [0, 1], // N, S
        [-1, -1], [-1, 0], // NW, SW
        [1, -1], [1, 0], // NE, SE
      ]
    : [
        [0, -1], [0, 1], // N, S
        [-1, 0], [-1, 1], // NW, SW
        [1, 0], [1, 1], // NE, SE
      ];
  return offsets
    .map(([dc, dr]) => [col + dc, row + dr])
    .filter(([c, r]) => inBounds(c, r, dims));
}

export function makeCells(dims) {
  const cells = [];
  for (let col = 0; col < dims.cols; col++) {
    for (let row = 0; row < dims.rows; row++) {
      cells.push({ col, row, card: null, claimedBy: null, dropped: false });
    }
  }
  return cells;
}

// Every card appears once before any card repeats — concatenate independently
// shuffled full passes of the pool and slice to size, rather than sampling with
// replacement (which could show the same card twice while others never appear).
export function buildDeck(cards, size) {
  const deck = [];
  while (deck.length < size) deck.push(...shuffle(cards));
  return deck.slice(0, size);
}

function isInteriorCell(cell, dims) {
  return cell.col > 0 && cell.col < dims.cols - 1 && cell.row > 0 && cell.row < dims.rows - 1;
}

// A couple of interior hexes on every board are permanently "dropped" (dead)
// — neither side can ever claim them, so a winning run has to route around
// rather than through. Restricted to interior cells (not on any edge) so
// they never sit on a possible start/end hex and can never single-handedly
// wall off an entire edge. Dropped cells get no card at all — the deck only
// needs to cover cells that are actually playable.
export function createBoard(cards, dims) {
  const cells = makeCells(dims);

  const interior = cells.filter((c) => isInteriorCell(c, dims));
  for (const cell of shuffle(interior).slice(0, dims.dropped)) cell.dropped = true;

  const playable = cells.filter((c) => !c.dropped);
  const deck = buildDeck(cards, playable.length);
  playable.forEach((cell, i) => (cell.card = deck[i]));

  return cells;
}

function cellAt(cells, col, row) {
  return cells.find((c) => c.col === col && c.row === row);
}

export function claimHex(cells, col, row, side) {
  const cell = cellAt(cells, col, row);
  if (cell && !cell.dropped) cell.claimedBy = side;
  return cells;
}

function hasConnectingPath(cells, side, isStart, isEnd, dims) {
  const bySide = new Map(cells.filter((c) => c.claimedBy === side).map((c) => [cellKey(c.col, c.row), c]));
  const starts = [...bySide.values()].filter(isStart);
  const visited = new Set();
  const stack = [...starts];
  starts.forEach((c) => visited.add(cellKey(c.col, c.row)));

  while (stack.length > 0) {
    const current = stack.pop();
    if (isEnd(current)) return true;
    for (const [nc, nr] of neighborsOf(current.col, current.row, dims)) {
      const key = cellKey(nc, nr);
      if (visited.has(key)) continue;
      const neighbor = bySide.get(key);
      if (!neighbor) continue;
      visited.add(key);
      stack.push(neighbor);
    }
  }
  return false;
}

export function checkPlayerWin(cells, dims) {
  return hasConnectingPath(cells, "player", (c) => c.row === 0, (c) => c.row === dims.rows - 1, dims);
}

export function checkCpuWin(cells, dims) {
  return hasConnectingPath(cells, "cpu", (c) => c.col === 0, (c) => c.col === dims.cols - 1, dims);
}

// Checked after every single claim (not just when the board fills) — see the
// module comment. Because a claim only ever grows one monotonic claimed-set, the
// first instant either predicate becomes true is exactly the instant the game
// ends, which is what makes "conflict" (both true at once) structurally
// unreachable as long as callers always re-evaluate after each individual claim.
// Dropped cells count as already-resolved for the "board full" check —
// otherwise a board could never be considered full while cells nobody can
// ever claim just sit there.
export function evaluateBoard(cells, dims) {
  const playerWon = checkPlayerWin(cells, dims);
  const cpuWon = checkCpuWin(cells, dims);

  if (playerWon && cpuWon) return { status: "conflict", winner: null };
  if (playerWon) return { status: "won", winner: "player" };
  if (cpuWon) return { status: "won", winner: "cpu" };

  const full = cells.every((c) => c.dropped || c.claimedBy !== null);
  if (full) return { status: "draw", winner: null };

  return { status: "in-progress", winner: null };
}
