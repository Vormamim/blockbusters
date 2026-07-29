// Minimal, dependency-free CSV parsing / validation / stringifying. No
// external library — this whole project has none, same philosophy as the
// original revision tool it was spun out of.

const REQUIRED_COLUMNS = ["concept", "letter", "clue", "distractor1", "distractor2"];

// RFC4180-ish: quoted fields may contain commas/newlines, "" inside a quoted
// field is a literal quote.
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  const s = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

function normalizeHeader(h) {
  return h.trim().toLowerCase();
}

// Matches columns by header name (case-insensitive), not position, so a
// reordered spreadsheet export still works.
export function rowsToObjects(rows) {
  if (rows.length === 0) return [];
  const header = rows[0].map(normalizeHeader);
  return rows.slice(1).map((r) => {
    const obj = {};
    header.forEach((key, i) => {
      obj[key] = (r[i] ?? "").trim();
    });
    return obj;
  });
}

// The letter/distractor-matching rule is a hard error, not a warning — it's
// the entire mechanic of the game, not a style nitpick.
export function validateDeck(rows) {
  if (rows.length === 0) {
    return { valid: false, errors: ["The CSV has no data rows."], cards: [] };
  }

  const header = Object.keys(rows[0]);
  const missing = REQUIRED_COLUMNS.filter((col) => !header.includes(col));
  if (missing.length > 0) {
    return { valid: false, errors: [`Missing required column(s): ${missing.join(", ")}.`], cards: [] };
  }

  const errors = [];
  const cards = [];

  rows.forEach((row, i) => {
    const lineNo = i + 2; // header is line 1, data rows are 1-indexed after it
    const concept = row.concept;
    const letter = row.letter;
    const clue = row.clue;
    const d1 = row.distractor1;
    const d2 = row.distractor2;
    const category = row.category || "General";

    if (!concept) return errors.push(`Row ${lineNo}: "concept" is empty.`);
    if (!letter) return errors.push(`Row ${lineNo}: "letter" is empty.`);
    if (!clue) return errors.push(`Row ${lineNo}: "clue" is empty.`);
    if (!d1 || !d2) return errors.push(`Row ${lineNo}: both distractor1 and distractor2 are required.`);
    if (d1 === d2) return errors.push(`Row ${lineNo}: distractor1 and distractor2 must be different from each other.`);
    if (d1 === concept || d2 === concept) return errors.push(`Row ${lineNo}: a distractor must not equal "concept" ("${concept}").`);

    const keyStart = letter[0].toUpperCase();
    if (d1[0].toUpperCase() !== keyStart || d2[0].toUpperCase() !== keyStart) {
      return errors.push(`Row ${lineNo}: both distractors must start with the same letter as "letter" ("${letter}").`);
    }

    cards.push({
      id: `row-${i}`,
      concept,
      letter,
      clue,
      distractors: [d1, d2],
      category,
    });
  });

  return { valid: errors.length === 0, errors, cards };
}

export function parseAndValidateCsv(text) {
  const rows = rowsToObjects(parseCsv(text));
  return validateDeck(rows);
}

function csvEscape(value) {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export function cardsToCsv(cards) {
  const header = ["concept", "letter", "clue", "distractor1", "distractor2", "category"];
  const lines = [header.join(",")];
  for (const c of cards) {
    const fields = [c.concept, c.letter, c.clue, c.distractors[0], c.distractors[1], c.category || ""];
    lines.push(fields.map(csvEscape).join(","));
  }
  return lines.join("\n");
}

// Deliberately generic (not Year-11-SE-specific) so the format reads clearly
// for any subject a teacher might build a deck for.
export function templateCsv() {
  return cardsToCsv([
    {
      concept: "Photosynthesis",
      letter: "P",
      clue: "What P is the process plants use to turn sunlight into energy?",
      distractors: ["Pollination", "Precipitation"],
      category: "Science",
    },
    {
      concept: "Paris",
      letter: "P",
      clue: "What P is the capital city of France?",
      distractors: ["Prague", "Perth"],
      category: "Geography",
    },
    {
      concept: "Multiplication",
      letter: "M",
      clue: "What M is the mathematical operation of repeated addition?",
      distractors: ["Modulus", "Mean"],
      category: "Maths",
    },
    {
      concept: "Metaphor",
      letter: "M",
      clue: "What M is a figure of speech that describes something by calling it something else entirely, not just similar to it?",
      distractors: ["Meter", "Monologue"],
      category: "English",
    },
  ]);
}
