// Progress lives in this browser first (localStorage), then syncs under the learner's code.

const KEY = 'langanki.v1';
const MAX_LOG = 2000;

export function freshState() {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    codeSaved: false, // learner confirmed they saved their code
    settings: {
      newPerDay: 10, // new cards per day, per script (hiragana and katakana count separately)
      retention: 0.9, // FSRS target: chance of remembering a card when it comes back
      quiet: false, // recognition only, no sound
      autoplay: true, // speak the sound when the answer shows
      kanaStyle: 'textbook', // textbook (handwritten forms) | print
      theme: 'auto',
      paused: {}, // deck id -> true when new cards are paused
      unlocked: {}, // deck id -> true when started before its unlock milestone
    },
    cards: {}, // card id -> FSRS card
    daily: {}, // 'YYYY-MM-DD' -> { 'hira:new': 3, 'hira:pnew': 1, reviews: 40 }
    log: [], // { at, id, g }
  };
}

let memoryFallback = null;

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch (e) {
    /* storage blocked or corrupt: fall through */
  }
  return memoryFallback;
}

export function normalize(s) {
  const base = freshState();
  return { ...base, ...s, settings: { ...base.settings, ...(s.settings || {}), paused: { ...(s.settings?.paused || {}) }, unlocked: { ...(s.settings?.unlocked || {}) } } };
}

export function save(state) {
  memoryFallback = state;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    return false;
  }
}

export function clearLocal() {
  memoryFallback = null;
  try {
    localStorage.removeItem(KEY);
  } catch (e) {
    /* ignore */
  }
}

export function storageAvailable() {
  try {
    const t = '__langanki_test';
    localStorage.setItem(t, '1');
    localStorage.removeItem(t);
    return true;
  } catch (e) {
    return false;
  }
}

export function bumpDaily(state, day, key, by = 1) {
  const d = (state.daily[day] ||= {});
  d[key] = (d[key] || 0) + by;
  // Keep about two months of daily counts.
  const days = Object.keys(state.daily).sort();
  if (days.length > 70) for (const old of days.slice(0, days.length - 70)) delete state.daily[old];
}

export function addLog(state, entry) {
  state.log.push(entry);
  if (state.log.length > MAX_LOG) state.log.splice(0, state.log.length - MAX_LOG);
}
