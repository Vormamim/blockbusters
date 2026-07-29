// Regression check for board-logic.js, run across all three board sizes.
// Plain Node script, no test framework — ok()/exit-code style. This exists
// specifically because the real Blockbusters board's "no draws possible"
// property is a fact about its rhombus-shaped board, not something any of
// these (rectangular) sizes can assume — see board-logic.js's module
// comment. Run with `npm test`.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  SIZES,
  neighborsOf,
  createBoard,
  claimHex,
  evaluateBoard,
  buildDeck,
} from "../board-logic.js";
import { parseAndValidateCsv } from "../csv.js";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

let failures = 0;
function ok(cond, msg) {
  if (cond) {
    console.log("  ok  " + msg);
  } else {
    console.log(" FAIL " + msg);
    failures += 1;
  }
  return cond;
}

// ---------------------------------------------------- adjacency symmetry --- //
function checkAdjacencySymmetry(sizeKey, dims) {
  let pairs = 0;
  for (let col = 0; col < dims.cols; col++) {
    for (let row = 0; row < dims.rows; row++) {
      for (const [nc, nr] of neighborsOf(col, row, dims)) {
        const back = neighborsOf(nc, nr, dims).some(([c, r]) => c === col && r === row);
        if (!back) ok(false, `${sizeKey}: (${col},${row}) -> (${nc},${nr}) is symmetric`);
        pairs += 1;
      }
    }
  }
  ok(true, `${sizeKey}: all ${pairs} directed neighbor relationships are symmetric`);
}

// ------------------------------------------------------------ dropped hexes --- //
function checkDroppedHexes(sizeKey, dims) {
  const dummyCards = Array.from({ length: dims.cols * dims.rows }, (_, i) => ({ id: `x${i}` }));
  const trials = 300;
  let allValid = true;

  for (let t = 0; t < trials; t++) {
    const cells = createBoard(dummyCards, dims);
    const dropped = cells.filter((c) => c.dropped);

    if (dropped.length !== dims.dropped) allValid = false;
    for (const cell of dropped) {
      const onEdge = cell.col === 0 || cell.col === dims.cols - 1 || cell.row === 0 || cell.row === dims.rows - 1;
      if (onEdge) allValid = false;
      if (cell.card !== null) allValid = false;
    }
    const playable = cells.filter((c) => !c.dropped);
    if (playable.some((c) => c.card === null)) allValid = false;
    if (playable.length !== dims.cols * dims.rows - dims.dropped) allValid = false;

    for (const cell of dropped) {
      claimHex(cells, cell.col, cell.row, "player");
      const claimed = cells.find((c) => c.col === cell.col && c.row === cell.row).claimedBy !== null;
      if (claimed) allValid = false;
    }
  }

  ok(
    allValid,
    `${sizeKey}: ${trials} generated boards each have exactly ${dims.dropped} dropped hexes, all off-edge, uncarded, and unclaimable`
  );
}

// ------------------------------------------------------------- deck build --- //
function checkDeckBuilding(sizeKey, dims) {
  const flashcardsPath = path.join(root, "data", "sample-year11-se.csv");
  const csvText = readFileSync(flashcardsPath, "utf8");
  const result = parseAndValidateCsv(csvText);
  ok(result.valid, `${sizeKey}: sample CSV is valid (${result.errors.join(" ")})`);

  const playableCount = dims.cols * dims.rows - dims.dropped;
  const deck = buildDeck(result.cards, playableCount);
  ok(deck.length === playableCount, `${sizeKey}: deck has ${playableCount} cards, got ${deck.length}`);

  const poolSize = result.cards.length;
  const firstPass = deck.slice(0, Math.min(poolSize, deck.length));
  const firstPassIds = new Set(firstPass.map((c) => c.id));
  ok(
    firstPassIds.size === firstPass.length,
    `${sizeKey}: no id repeats within the first ${firstPass.length} dealt cards (pool has ${poolSize})`
  );
}

// ------------------------------------------------------------ monte carlo --- //
function shuffleInPlace(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function runMonteCarlo(dims, trials) {
  let conflicts = 0;
  let unresolvedAtFull = 0;
  let draws = 0;
  let decidedEarly = 0;

  const dummyCards = Array.from({ length: dims.cols * dims.rows }, (_, i) => ({ id: `x${i}` }));

  for (let t = 0; t < trials; t++) {
    const cells = createBoard(dummyCards, dims);
    const order = shuffleInPlace(cells.filter((c) => !c.dropped).map((c) => [c.col, c.row]));

    let decided = false;
    for (let i = 0; i < order.length; i++) {
      const [col, row] = order[i];
      const side = Math.random() < 0.5 ? "player" : "cpu";
      claimHex(cells, col, row, side);
      const result = evaluateBoard(cells, dims);
      if (result.status === "conflict") conflicts += 1;
      if (result.status === "won") {
        decided = true;
        if (i < order.length - 1) decidedEarly += 1;
        break;
      }
      if (result.status === "draw") {
        decided = true;
        draws += 1;
        break;
      }
    }
    if (!decided) unresolvedAtFull += 1;
  }

  return { conflicts, unresolvedAtFull, draws, decidedEarly, trials };
}

function checkMonteCarlo(sizeKey, dims, trials) {
  const { conflicts, unresolvedAtFull, draws, decidedEarly, trials: n } = runMonteCarlo(dims, trials);
  ok(conflicts === 0, `${sizeKey}: 0 conflicts across ${n} trials, got ${conflicts}`);
  ok(
    unresolvedAtFull === 0,
    `${sizeKey}: every trial reaches a decided status by the time the board fills, got ${unresolvedAtFull} stuck`
  );
  console.log(
    `  (${sizeKey}, ${n} trials: ${n - draws} decided with a winner (${decidedEarly} before the board filled), ${draws} draws)`
  );
}

console.log("Checking board-logic across all board sizes...\n");
for (const [sizeKey, dims] of Object.entries(SIZES)) {
  console.log(`--- ${sizeKey} (${dims.cols}x${dims.rows}, ${dims.dropped} dropped) ---`);
  checkAdjacencySymmetry(sizeKey, dims);
  checkDroppedHexes(sizeKey, dims);
  checkDeckBuilding(sizeKey, dims);
  checkMonteCarlo(sizeKey, dims, sizeKey === "small" ? 20000 : 5000);
  console.log("");
}

console.log(`${failures === 0 ? "PASSED" : "FAILED"} — ${failures} failure(s).`);
process.exit(failures === 0 ? 0 : 1);
