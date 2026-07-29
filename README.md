# Blockbusters

A standalone, single-page hex-board quiz game loosely inspired by the British game
show *Blockbusters* (placeholder name — not using the real show's name in any
published/public copy). Every hex is keyed by a letter or short acronym; clicking one
shows a "What P...?" clue and three multiple-choice options that all share that same
letter — the correct answer, plus two plausible-but-wrong near-misses. Answer correctly
to claim the hex for yourself; answer wrong and a computer opponent claims it instead.
You're connecting top to bottom, the computer is connecting left to right, and a couple
of hexes on every board are permanently dropped, so a winning run has to route around
them.

This is a spin-out of "Classic" mode from a larger Year 11 Software Engineering
revision tool — same core game, generalised so anyone can bring their own content for
any subject, with no server, no build step, and no dependencies (this repo has zero
npm packages).

## Running it locally

Requires [Node.js] — nothing else, no packages to install.

```
npm run dev
```

Serves the repo root at `http://localhost:8789` (via `scripts/serve.mjs`, a small
dependency-free static file server — no build step, the files ship as-is).

## How it works

- **Board sizes** — Small (5x4, 20 hexes), Medium (7x5, 35 hexes), or Large (9x6, 54
  hexes), chosen before starting. `board-logic.js` takes board dimensions as a
  parameter to every function rather than hardcoding one size, so all three share
  identical adjacency/win-detection/dropped-hex logic.
- **Hex selection isn't free-pick** — the first hex of a game must be on the top or
  bottom row (where a top-to-bottom run has to start or end); every hex after that must
  be adjacent to one you already own, so a run is built outward one connected step at a
  time. If your territory ever gets fully boxed in, a fresh top/bottom-row start opens
  back up (`frontierCells()` in `app.js`).
- **Dropped hexes** — a couple of interior hexes (never on an edge) are permanently
  unclaimable by either side on every board, picked randomly by `createBoard()`.
- **Win detection** — BFS reachability across each side's claimed hexes
  (`checkPlayerWin`/`checkCpuWin`), re-checked after every single claim. The real
  show's board is "designed so no ties are possible", but that's a property of its
  specific rhombus-shaped board and isn't assumed to carry over to any of these
  rectangular sizes — `evaluateBoard` has an explicit `"draw"` status for a full board
  with neither side connected, and `scripts/check-board.mjs`'s Monte Carlo regression
  (run across all three sizes, part of `npm test`) confirms draws are a real, regularly
  reached outcome (roughly a third of random playouts) rather than untested code.
- **Streak** — correct answers in a row, persisted in `localStorage`, independent of
  any one game (winning/losing/drawing never touches it, only a wrong answer resets
  it). No reset control by design.
- **Sound** — short tones synthesised in code via the Web Audio API (`sounds.js`), not
  audio files — there's a mute toggle, persisted the same way as the streak.

## Content — CSV format

Every question deck is a CSV with these columns:

| Column | Required | Meaning |
|---|---|---|
| `concept` | yes | The correct answer — shown as one of the 3 options, exactly as written. |
| `letter` | yes | The letter/acronym key shown on the hex (e.g. `P`, `SDLC`, `MP`). |
| `clue` | yes | The question, phrased around that key (e.g. "What P is...?"). |
| `distractor1` | yes | A wrong option. Must start with the same letter as `letter`. |
| `distractor2` | yes | A second wrong option, different from `distractor1`. Must also start with `letter`. |
| `category` | no | A label only — not used for gameplay, just shown if present. |

The letter-matching rule on the distractors is a hard requirement, not a style
preference — it's the entire mechanic ("sharp" near-misses that share the same key as
the real answer), enforced by `csv.js`'s validator both on upload and on the bundled
sample deck.

- **Download CSV template** on the setup screen gives a blank starting point with a
  few generic example rows (not tied to any one subject).
- **Upload your own CSV** replaces the active deck for that session (not persisted —
  reload and it's back to the sample deck) once it passes validation; a failing upload
  shows every row's specific error and leaves whatever deck was active untouched.
- **`data/sample-year11-se.csv`** — the bundled default deck, 92 concepts covering the
  NSW Year 11 (Preliminary) Software Engineering syllabus, generated once from the
  original revision tool's content (not an ongoing dependency between the two
  projects — this file is just as "yours to edit" as any uploaded CSV would be).

A deck can have as few as 1 row (repeats fill the rest of the board — see
`buildDeck()`'s shuffle-and-drain repeat-fill), though the setup screen will note if
your deck is noticeably smaller than the chosen board's hex count, since that means a
lot of repeats.

## Files

- `index.html` / `style.css` / `app.js` — the whole app. No shared files with, or
  dependency on, the original revision-tool project this was spun out of.
- `board-logic.js` — pure, DOM-free board logic (sizes, adjacency, dropped hexes, win
  detection, deck building, `shuffle()`), importable from both the browser and Node —
  the same module is what `scripts/check-board.mjs` tests directly.
- `csv.js` — parse / validate / stringify CSV, entirely client-side.
- `sounds.js` — synthesised Web Audio API sound effects + mute persistence.
- `scripts/serve.mjs` — local dev server.
- `scripts/check-board.mjs` — regression suite (`npm test`), run across all three
  board sizes.
- `data/sample-year11-se.csv` — bundled sample deck.
- `assets/tvshow.png` — background image (tinted, fixed, full-page).

## Deploying

Everything is static — upload the whole repo to any static host (or serve it via
`npm run dev` locally). No build step, no environment variables, no backend.
