// FSRS-5 spaced-repetition scheduler (the model used by current Anki), with Anki-style
// learning steps. Pure functions: a card goes in with a grade and comes out rescheduled.
//
// Card fields: st (state), s (stability, days), d (difficulty 1–10), step, due (ms),
// last (ms of last review), reps, lapses. Grades: 1 Again, 2 Hard, 3 Good, 4 Easy.

export const NEW = 0;
export const LEARNING = 1;
export const REVIEW = 2;
export const RELEARNING = 3;

// FSRS-5 default parameters.
const W = [0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575, 0.1192, 1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621];
const DECAY = -0.5;
const FACTOR = 19 / 81;
const MIN = 60 * 1000;
export const DAY = 24 * 60 * MIN;
const DAY_STARTS_AT_HOUR = 4; // like Anki: the study day rolls over at 4 a.m.

export const LEARN_STEPS = [1 * MIN, 10 * MIN];
export const RELEARN_STEPS = [10 * MIN];
const MAX_IVL = 36500;

export function newCard() {
  return { st: NEW, s: 0, d: 0, step: 0, due: 0, last: 0, reps: 0, lapses: 0 };
}

const clampD = (d) => Math.min(10, Math.max(1, d));
export const retrievability = (days, s) => Math.pow(1 + (FACTOR * days) / s, DECAY);
const initS = (g) => Math.max(W[g - 1], 0.1);
const initD = (g) => clampD(W[4] - Math.exp(W[5] * (g - 1)) + 1);
function nextD(d, g) {
  const dp = d + (-W[6] * (g - 3) * (10 - d)) / 9; // linear damping toward 10
  return clampD(W[7] * initD(4) + (1 - W[7]) * dp); // mean reversion
}
function recallS(d, s, r, g) {
  const hard = g === 2 ? W[15] : 1;
  const easy = g === 4 ? W[16] : 1;
  return s * (1 + Math.exp(W[8]) * (11 - d) * Math.pow(s, -W[9]) * (Math.exp(W[10] * (1 - r)) - 1) * hard * easy);
}
function forgetS(d, s, r) {
  const sf = W[11] * Math.pow(d, -W[12]) * (Math.pow(s + 1, W[13]) - 1) * Math.exp(W[14] * (1 - r));
  return Math.min(sf, s);
}
const shortS = (s, g) => Math.max(0.1, s * Math.exp(W[17] * (g - 3 + W[18])));

function intervalDays(s, retention) {
  const ivl = (s / FACTOR) * (Math.pow(retention, 1 / DECAY) - 1);
  return Math.min(MAX_IVL, Math.max(1, Math.round(ivl)));
}

// Small deterministic spread so cards learned together don't all come back together.
function fuzz(ivl, seed) {
  if (ivl < 3) return ivl;
  const spread = Math.max(1, Math.round(ivl * (ivl < 7 ? 0.15 : ivl < 20 ? 0.1 : 0.05)));
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const offset = ((h >>> 0) % (2 * spread + 1)) - spread;
  return Math.min(MAX_IVL, Math.max(2, ivl + offset));
}

// Start of the study day containing `now` (4 a.m. local time).
export function dayStart(now) {
  const d = new Date(now - DAY_STARTS_AT_HOUR * 3600 * 1000);
  d.setHours(DAY_STARTS_AT_HOUR, 0, 0, 0);
  return d.getTime();
}
export function dayKey(now) {
  const d = new Date(now - DAY_STARTS_AT_HOUR * 3600 * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const hardDelay = (steps, step) => (step === 0 && steps.length > 1 ? (steps[0] + steps[1]) / 2 : steps[step] * 1.5);

// Rate a card. Returns the new card. `id` seeds the interval spread; `retention` is the target (0.8–0.95).
export function schedule(card, g, now, { retention = 0.9, id = '' } = {}) {
  const c = { ...card, reps: card.reps + 1, last: now };
  const graduate = (extraDays = 0) => {
    c.st = REVIEW;
    c.step = 0;
    const ivl = fuzz(intervalDays(c.s, retention) + extraDays, `${id}|${c.reps}`);
    c.due = dayStart(now) + ivl * DAY;
    c.ivl = ivl;
    return c;
  };
  const stepTo = (steps, step, delay) => {
    c.step = step;
    c.due = now + delay;
    c.ivl = 0;
    return c;
  };

  if (card.st === NEW || card.st === LEARNING || card.st === RELEARNING) {
    if (card.st === NEW) {
      c.s = initS(g);
      c.d = initD(g);
      c.st = LEARNING;
    } else {
      c.s = shortS(card.s, g);
      c.d = nextD(card.d, g);
    }
    const steps = c.st === RELEARNING ? RELEARN_STEPS : LEARN_STEPS;
    const step = card.st === NEW ? 0 : Math.min(card.step, steps.length - 1);
    if (g === 1) return stepTo(steps, 0, steps[0]);
    if (g === 2) return stepTo(steps, step, hardDelay(steps, step));
    if (g === 3) return step + 1 >= steps.length ? graduate() : stepTo(steps, step + 1, steps[step + 1]);
    return graduate(card.st === NEW || card.st === LEARNING ? 1 : 0);
  }

  // Review.
  const days = Math.max(0, (now - card.last) / DAY);
  const r = retrievability(days, card.s);
  if (g === 1) {
    c.lapses = card.lapses + 1;
    c.s = forgetS(card.d, card.s, r);
    c.d = nextD(card.d, 1);
    c.st = RELEARNING;
    return stepTo(RELEARN_STEPS, 0, RELEARN_STEPS[0]);
  }
  const sFor = (grade) => (days < 1 ? shortS(card.s, grade) : recallS(card.d, card.s, r, grade));
  let hard = intervalDays(sFor(2), retention);
  let good = intervalDays(sFor(3), retention);
  let easy = intervalDays(sFor(4), retention);
  hard = Math.min(hard, good);
  good = Math.max(good, hard + 1);
  easy = Math.max(easy, good + 1);
  c.s = sFor(g);
  c.d = nextD(card.d, g);
  c.st = REVIEW;
  const ivl = fuzz(g === 2 ? hard : g === 3 ? good : easy, `${id}|${c.reps}`);
  c.ivl = ivl;
  c.due = dayStart(now) + ivl * DAY;
  return c;
}

// How long until the card comes back for each grade, for the labels under the buttons.
export function preview(card, now, opts) {
  return [1, 2, 3, 4].map((g) => {
    const c = schedule(card, g, now, opts);
    return c.st === REVIEW ? { days: c.ivl } : { ms: c.due - now };
  });
}

export function formatWait({ ms, days }) {
  if (days == null) {
    const m = Math.max(1, Math.round(ms / MIN));
    return m < 60 ? `${m} min` : `${Math.round(m / 60)} hr`;
  }
  if (days < 30) return days === 1 ? '1 day' : `${days} days`;
  if (days < 365) return `${(days / 30.4).toFixed(1).replace(/\.0$/, '')} mo`;
  return `${(days / 365).toFixed(1).replace(/\.0$/, '')} yr`;
}
