import { SIZES, shuffle, createBoard, claimHex, evaluateBoard, neighborsOf } from "./board-logic.js";
import { parseAndValidateCsv, templateCsv } from "./csv.js";
import { playSelect, playCorrect, playWrong, playWin, playLose, isMuted, toggleMuted } from "./sounds.js";

const state = {
  sizeKey: "small",
  sampleCards: [],
  activeCards: [],
  activeSource: "sample", // "sample" | "upload"
  uploadedFileName: null,
  board: [],
  dims: SIZES.small,
  selected: null,
  resolving: false, // true during the brief post-click feedback delay
  result: { status: "in-progress", winner: null },
  streak: { current: 0, best: 0 }, // real value assigned below, after loadStreak() is defined
};

const el = (sel) => document.querySelector(sel);

const sizeRowEl = el("#bb-size-row");
const deckStatusEl = el("#bb-deck-status");
const downloadBtn = el("#bb-download-btn");
const uploadBtn = el("#bb-upload-btn");
const useSampleBtn = el("#bb-use-sample-btn");
const fileInput = el("#bb-file-input");
const uploadErrorsEl = el("#bb-upload-errors");
const startBtn = el("#bb-start-btn");

const setupEl = el("#bb-setup");
const gameEl = el("#bb-game");
const statusEl = el("#bb-status");
const gridEl = el("#bb-grid");
const idleHintEl = el("#bb-idle-hint");
const clueSceneEl = el("#bb-clue-panel");
const clueLetterEl = el("#bb-clue-letter");
const clueTextEl = el("#bb-clue-text");
const clueOptionsEl = el("#bb-clue-options");
const resultEl = el("#bb-result");
const resultBigEl = el("#bb-result-big");
const resultSubEl = el("#bb-result-sub");
const againBtn = el("#bb-again-btn");
const changeBtn = el("#bb-change-btn");

const streakCurrentEl = el("#bb-streak-current");
const streakBestEl = el("#bb-streak-best");
const muteBtn = el("#bb-mute-btn");

const instructionsBtn = el("#bb-instructions-btn");
const instructionsBackdropEl = el("#bb-instructions-backdrop");
const instructionsCloseBtn = el("#bb-instructions-close");

const landingEl = el("#bb-landing");
const appShellEl = el("#bb-app");
const landingCtaBtn = el("#bb-landing-cta");

landingCtaBtn.addEventListener("click", () => {
  landingEl.hidden = true;
  appShellEl.hidden = false;
});

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ------------------------------------------------------------- streak --- //
// Correct-answers-in-a-row, persisted in localStorage — survives reloads and
// new games, only resets on a wrong answer. No reset control by design.
const STREAK_STORAGE_KEY = "blockbusters-streak";

function loadStreak() {
  try {
    const raw = JSON.parse(localStorage.getItem(STREAK_STORAGE_KEY));
    const current = Number(raw?.current);
    const best = Number(raw?.best);
    if (Number.isInteger(current) && Number.isInteger(best) && current >= 0 && best >= 0) {
      return { current, best: Math.max(current, best) };
    }
  } catch {
    // localStorage unavailable or corrupt data — fall back to a fresh streak.
  }
  return { current: 0, best: 0 };
}

function saveStreak(streak) {
  try {
    localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(streak));
  } catch {
    // Storage unavailable/full — the streak just won't persist this time.
  }
}

function renderStreak() {
  streakCurrentEl.textContent = String(state.streak.current);
  streakBestEl.textContent = `Best ${state.streak.best}`;
}

// Must run after loadStreak() above is defined, NOT inline in the initial
// `const state = {...}` literal — doing it inline would call loadStreak()
// before STREAK_STORAGE_KEY's own `const` has initialised (temporal dead
// zone), which loadStreak()'s broad catch would swallow silently, always
// falling back to a fresh {0, 0} streak regardless of what was saved.
state.streak = loadStreak();

// --------------------------------------------------------------- setup --- //
async function init() {
  const res = await fetch("data/sample-year11-se.csv");
  const text = await res.text();
  const result = parseAndValidateCsv(text);
  if (!result.valid) {
    // The bundled sample should always be valid — surface loudly if it
    // somehow isn't, rather than silently starting with an empty deck.
    deckStatusEl.textContent = "Could not load the bundled sample deck: " + result.errors.join(" ");
    return;
  }
  state.sampleCards = result.cards;
  state.activeCards = result.cards;

  renderSizeRow();
  renderDeckStatus();
  renderMuteButton();
  renderStreak();
}

function renderSizeRow() {
  sizeRowEl.innerHTML = "";
  for (const [key, size] of Object.entries(SIZES)) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "bb-size-btn";
    btn.textContent = size.label;
    btn.classList.toggle("active", key === state.sizeKey);
    btn.addEventListener("click", () => {
      state.sizeKey = key;
      renderSizeRow();
    });
    sizeRowEl.appendChild(btn);
  }
}

function renderDeckStatus() {
  const count = state.activeCards.length;
  deckStatusEl.textContent =
    state.activeSource === "sample"
      ? `Using the sample deck: Year 11 Software Engineering (${count} cards).`
      : `Using your uploaded deck: ${state.uploadedFileName} (${count} cards).`;
  useSampleBtn.hidden = state.activeSource === "sample";
}

function renderUploadErrors(errors) {
  if (!errors || errors.length === 0) {
    uploadErrorsEl.hidden = true;
    uploadErrorsEl.innerHTML = "";
    return;
  }
  uploadErrorsEl.hidden = false;
  uploadErrorsEl.innerHTML =
    `<p>Couldn't load that CSV — fix these and try again:</p><ul>` +
    errors.map((e) => `<li>${escapeHtml(e)}</li>`).join("") +
    `</ul>`;
}

downloadBtn.addEventListener("click", () => {
  const blob = new Blob([templateCsv()], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "blockbusters-template.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

uploadBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0];
  fileInput.value = ""; // allow re-selecting the same file later
  if (!file) return;

  const text = await file.text();
  const result = parseAndValidateCsv(text);
  if (!result.valid) {
    renderUploadErrors(result.errors);
    return;
  }

  renderUploadErrors(null);
  state.activeCards = result.cards;
  state.activeSource = "upload";
  state.uploadedFileName = file.name;
  renderDeckStatus();

  const size = SIZES[state.sizeKey];
  const minRecommended = size.cols * size.rows - size.dropped;
  if (result.cards.length < minRecommended) {
    renderUploadErrors([
      `Loaded ${result.cards.length} rows — that's fewer than the ${minRecommended} hexes on the ` +
        `${state.sizeKey} board, so some questions will repeat. Still fine to play.`,
    ]);
  }
});

useSampleBtn.addEventListener("click", () => {
  state.activeCards = state.sampleCards;
  state.activeSource = "sample";
  state.uploadedFileName = null;
  renderUploadErrors(null);
  renderDeckStatus();
});

function renderMuteButton() {
  const muted = isMuted();
  muteBtn.textContent = muted ? "Sound: off" : "Sound: on";
  muteBtn.setAttribute("aria-pressed", String(muted));
}

muteBtn.addEventListener("click", () => {
  toggleMuted();
  renderMuteButton();
});

function openInstructions() {
  instructionsBackdropEl.hidden = false;
}
function closeInstructions() {
  instructionsBackdropEl.hidden = true;
}
instructionsBtn.addEventListener("click", openInstructions);
instructionsCloseBtn.addEventListener("click", closeInstructions);
instructionsBackdropEl.addEventListener("click", (e) => {
  if (e.target === instructionsBackdropEl) closeInstructions();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !instructionsBackdropEl.hidden) closeInstructions();
});

startBtn.addEventListener("click", () => {
  if (state.activeCards.length === 0) return;
  startGame();
});

// ---------------------------------------------------------------- game --- //
function startGame() {
  state.dims = SIZES[state.sizeKey];
  state.board = createBoard(state.activeCards, state.dims);
  state.selected = null;
  state.result = { status: "in-progress", winner: null };

  setupEl.hidden = true;
  gameEl.hidden = false;
  resultEl.hidden = true;
  gridEl.classList.remove("is-locked");

  sizeGrid();
  renderGrid();
  renderStatus();
  renderPanel();
}

function sizeGrid() {
  const { cols, rows, hexWidth } = state.dims;
  const hexHeight = hexWidth * 0.866;
  gridEl.style.setProperty("--hex-w", `${hexWidth}px`);
  gridEl.style.setProperty("--hex-h", `${hexHeight}px`);
  gridEl.style.width = `${Math.ceil((cols - 1) * hexWidth * 0.75 + hexWidth)}px`;
  gridEl.style.height = `${Math.ceil(rows * hexHeight + hexHeight / 2 + 4)}px`;
}

function hexPosition(col, row) {
  const { hexWidth } = state.dims;
  const hexHeight = hexWidth * 0.866;
  const left = col * hexWidth * 0.75;
  const top = row * hexHeight + (col % 2 === 1 ? hexHeight / 2 : 0);
  return { left, top };
}

function cellAt(col, row) {
  return state.board.find((c) => c.col === col && c.row === row);
}

// Which unclaimed hexes can be picked right now: any hex adjacent to a hex
// the player already owns, so a run has to be built outward one connected
// step at a time rather than grabbed from anywhere on the board. The very
// first pick of a game (no player-owned hexes yet) is the one exception —
// any hex on the top or bottom row, since that's where a top-to-bottom run
// has to start or end. Two fallback tiers keep the player from ever being
// stuck with unclaimed hexes on the board but zero legal moves.
function frontierCells() {
  const dims = state.dims;
  const ownedCells = state.board.filter((c) => c.claimedBy === "player");
  const unclaimedCells = () => state.board.filter((c) => c.claimedBy === null && !c.dropped);
  const edgeCells = () => unclaimedCells().filter((c) => c.row === 0 || c.row === dims.rows - 1);

  if (ownedCells.length === 0) return edgeCells().length > 0 ? edgeCells() : unclaimedCells();

  const neighborKeys = new Set();
  for (const cell of ownedCells) {
    for (const [nc, nr] of neighborsOf(cell.col, cell.row, dims)) neighborKeys.add(`${nc},${nr}`);
  }
  const frontier = unclaimedCells().filter((c) => neighborKeys.has(`${c.col},${c.row}`));
  if (frontier.length > 0) return frontier;
  return edgeCells().length > 0 ? edgeCells() : unclaimedCells();
}

function renderGrid() {
  const legalCells = frontierCells();
  const isLegal = (cell) => legalCells.some((c) => c.col === cell.col && c.row === cell.row);

  gridEl.innerHTML = "";
  for (const cell of state.board) {
    const hex = document.createElement("button");
    hex.type = "button";
    hex.className = "bb-hex";
    const { left, top } = hexPosition(cell.col, cell.row);
    hex.style.left = `${left}px`;
    hex.style.top = `${top}px`;

    // A letter only shows while its hex is still unclaimed/gold — once
    // claimed it disappears. Dropped hexes never have a card at all.
    const showLetter = cell.claimedBy === null && !cell.dropped;
    const letterHtml = showLetter ? `<span class="bb-hex-letter">${escapeHtml(cell.card.letter)}</span>` : "";
    hex.innerHTML = `<span class="bb-hex-fill"></span>${letterHtml}`;
    hex.title = cell.dropped ? "Dropped — can't be claimed" : `Column ${cell.col + 1}, row ${cell.row + 1}`;

    hex.classList.toggle("claimed-player", cell.claimedBy === "player");
    hex.classList.toggle("claimed-cpu", cell.claimedBy === "cpu");
    hex.classList.toggle("dropped", cell.dropped);
    hex.classList.toggle("selected", Boolean(state.selected) && state.selected.col === cell.col && state.selected.row === cell.row);
    hex.disabled = cell.dropped || cell.claimedBy !== null || state.result.status !== "in-progress" || !isLegal(cell);

    hex.addEventListener("click", () => selectHex(cell.col, cell.row));
    gridEl.appendChild(hex);
  }
}

function selectHex(col, row) {
  if (state.result.status !== "in-progress") return;
  if (state.resolving) return;
  const cell = cellAt(col, row);
  if (!cell || cell.dropped || cell.claimedBy !== null) return;
  if (!frontierCells().some((c) => c.col === col && c.row === row)) return;
  playSelect();
  state.selected = { col, row };
  renderGrid();
  renderPanel();
}

function renderPanel() {
  if (!state.selected) {
    idleHintEl.hidden = false;
    clueSceneEl.hidden = true;
    return;
  }
  idleHintEl.hidden = true;
  renderCluePanel();
}

// No card/flip step — the clue is shown directly, since there's nothing to
// hide (the letter is already visible on the hex). Picking an option is
// real, immediately-graded multiple choice.
function renderCluePanel() {
  const cell = cellAt(state.selected.col, state.selected.row);
  const card = cell.card;

  clueSceneEl.hidden = false;
  clueLetterEl.textContent = card.letter;
  clueTextEl.textContent = card.clue;

  clueOptionsEl.innerHTML = "";
  for (const optionText of shuffle([card.concept, ...card.distractors])) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mcq-option";
    btn.textContent = optionText;
    btn.addEventListener("click", () => handleClueAnswer(card, optionText, btn));
    clueOptionsEl.appendChild(btn);
  }
}

function handleClueAnswer(card, optionText, clickedBtn) {
  const correct = optionText === card.concept;
  state.resolving = true;

  clueOptionsEl.querySelectorAll(".mcq-option").forEach((btn) => {
    btn.disabled = true;
    if (btn.textContent === card.concept) btn.classList.add("correct");
    else if (btn === clickedBtn) btn.classList.add("wrong");
  });

  if (correct) playCorrect();
  else playWrong();

  setTimeout(() => {
    state.resolving = false;
    reportOutcome(correct ? "player" : "cpu");
  }, 700);
}

function renderStatus() {
  const remaining = state.board.filter((c) => c.claimedBy === null && !c.dropped).length;
  const haveTerritory = state.board.some((c) => c.claimedBy === "player");
  statusEl.textContent =
    `${remaining} hex${remaining === 1 ? "" : "es"} left — ` +
    (haveTerritory ? "pick a lit hex next to your green territory." : "start from any hex on the top or bottom row.");
}

function reportOutcome(side) {
  if (!state.selected) return;
  const { col, row } = state.selected;
  claimHex(state.board, col, row, side);
  state.result = evaluateBoard(state.board, state.dims);
  state.selected = null;

  if (side === "player") {
    state.streak.current += 1;
    state.streak.best = Math.max(state.streak.best, state.streak.current);
  } else {
    state.streak.current = 0;
  }
  saveStreak(state.streak);
  renderStreak();

  renderGrid();
  renderStatus();
  renderPanel();
  if (state.result.status !== "in-progress") showResult();
}

function showResult() {
  gridEl.classList.add("is-locked");
  idleHintEl.hidden = true;
  clueSceneEl.hidden = true;
  resultEl.hidden = false;

  if (state.result.status === "won") {
    const youWon = state.result.winner === "player";
    resultBigEl.textContent = youWon ? "You win!" : "Computer wins.";
    resultSubEl.textContent = youWon
      ? "You connected top to bottom before the computer connected left to right."
      : "The computer connected left to right before you connected top to bottom.";
    if (youWon) playWin();
    else playLose();
  } else {
    resultBigEl.textContent = "Draw.";
    resultSubEl.textContent = "The board filled up with no connection either way for you or the computer.";
    playLose();
  }
}

againBtn.addEventListener("click", () => startGame());
changeBtn.addEventListener("click", () => {
  gameEl.hidden = true;
  setupEl.hidden = false;
});

init();
