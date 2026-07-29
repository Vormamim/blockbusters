// Small synthesised sound effects via the Web Audio API — no audio files.
// Every call site is a click handler, so the AudioContext is always created
// (and, if needed, resumed) inside a user gesture, satisfying browser
// autoplay policy without any special-casing. Mute state persists to
// localStorage, same pattern as the streak counter in app.js.

const MUTE_STORAGE_KEY = "blockbusters-muted";

let audioCtx = null;
let muted = loadMuted();

function loadMuted() {
  try {
    return localStorage.getItem(MUTE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function saveMuted() {
  try {
    localStorage.setItem(MUTE_STORAGE_KEY, muted ? "1" : "0");
  } catch {
    // Nothing useful to do if storage is unavailable — the preference just
    // won't persist this time.
  }
}

function ctx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

// One short tone: frequency in Hz, start offset and duration in seconds, a
// wave shape, and a linear attack/decay envelope so it doesn't click at the
// start or end of playback.
function tone(freq, start, duration, type = "sine", gain = 0.15) {
  if (muted) return;
  const c = ctx();
  const osc = c.createOscillator();
  const amp = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(amp);
  amp.connect(c.destination);

  const t0 = c.currentTime + start;
  amp.gain.setValueAtTime(0, t0);
  amp.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  amp.gain.linearRampToValueAtTime(0, t0 + duration);

  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export function playSelect() {
  tone(600, 0, 0.06, "square", 0.08);
}

export function playCorrect() {
  tone(523.25, 0, 0.1, "sine"); // C5
  tone(783.99, 0.08, 0.16, "sine"); // G5
}

export function playWrong() {
  tone(220, 0, 0.09, "sawtooth", 0.12);
  tone(140, 0.07, 0.14, "sawtooth", 0.12);
}

export function playWin() {
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => tone(freq, i * 0.11, 0.16, "triangle", 0.14));
}

export function playLose() {
  [392, 349.23, 293.66].forEach((freq, i) => tone(freq, i * 0.14, 0.2, "triangle", 0.12));
}

export function isMuted() {
  return muted;
}

export function toggleMuted() {
  muted = !muted;
  saveMuted();
  return muted;
}
