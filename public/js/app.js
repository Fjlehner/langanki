import { SCRIPTS, BUILT, DECKS, deckById, decksIn, scriptOf, wordBreakdown, wordUnitCount } from './scripts/index.js';
import { schedule, preview, formatWait, newCard, NEW, dayKey, DAY } from './fsrs.js';
import { load, save, freshState, normalize, storageAvailable, bumpDaily, addLog, clearLocal } from './store.js';
import { Session, parseId, deckCounts, deckLocked, lockedBy, resetDeck, freshBeyondLimit, reviewAheadIds, TIMING, baseProgress, itemStatus, nextDue, cardId } from './study.js';
import { canSpeak, speak, stopSpeaking, onVoices, voicesReady } from './speech.js';
import { isMobileDevice, now } from './device.js';
import { learnedByDeck, weakSpots, upNext } from './progress.js';
import {
  apiAvailable, getCode, formatCode, restoreLink, normalizeCode, isValidCode, createProfile, fetchProfile, adoptCode,
  pull, push, rotateCode, eraseRemote, forgetCode, onStatus, getStatus, mergeStates,
} from './sync.js';

let state = load();
const persistent = storageAvailable();
const mobile = isMobileDevice();
document.documentElement.classList.toggle('is-mobile', mobile);
const app = document.getElementById('app');
let screen = { name: state ? 'home' : 'welcome' };
let apiOK = null;
let pushTimer = null;
let flash = ''; // one-time message shown on the next screen

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

// ---------- saving and sync ----------

function markPending(on) {
  try {
    if (on) localStorage.setItem('langanki.pending', '1');
    else localStorage.removeItem('langanki.pending');
  } catch (e) {
    /* storage blocked */
  }
}
function isPending() {
  try {
    return localStorage.getItem('langanki.pending') === '1';
  } catch (e) {
    return false;
  }
}

function commit() {
  save(state);
  if (getCode()) {
    markPending(true);
    clearTimeout(pushTimer);
    pushTimer = setTimeout(syncNow, 1200);
  }
}

async function syncNow() {
  if (!getCode() || !state) return;
  const before = state;
  const merged = await push(state);
  if (getStatus() === 'saved') markPending(false);
  if (merged !== before && state === before) {
    state = merged;
    save(state);
    if (screen.name !== 'study') render();
  }
}

async function pullNow() {
  if (!getCode() || !state || screen.name === 'study') return;
  const before = state;
  const merged = await pull(state);
  if (merged !== before && state === before) {
    state = merged;
    save(state);
    await syncNow();
    render();
  }
}

async function ensureCode() {
  if (getCode() || !state || !(await apiAvailable())) return;
  try {
    await createProfile(state);
    render();
  } catch (e) {
    /* try again next time */
  }
}

onStatus(() => {
  const el = document.getElementById('sync-status');
  if (el) el.textContent = statusText();
});

function statusText() {
  if (!persistent) return 'This browser isn’t keeping saved data, so progress lasts only until you close the tab.';
  if (!getCode()) return apiOK === false ? 'Progress is saved on this device.' : 'Progress is saved on this device until you get a code.';
  return {
    saving: 'Saving…',
    saved: 'Progress is saved under your code.',
    offline: 'Offline. Progress is saved on this device and will sync when you’re back online.',
    error: 'Couldn’t reach the server. Progress is saved on this device.',
    none: 'Progress is saved on this device.',
  }[getStatus()] || 'Progress is saved under your code.';
}

// ---------- shell ----------

function applyTheme() {
  const t = state?.settings.theme || 'auto';
  if (t === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t);
}

function header() {
  const nav = state
    ? `<nav class="top__nav" aria-label="Main">
        <button class="link" data-go="code">${getCode() ? 'Your code' : 'Get a code'}</button>
        <button class="link" data-go="settings">Settings</button>
      </nav>`
    : '';
  return `<header class="top"><button class="wordmark" data-go="${state ? 'home' : 'welcome'}" aria-label="LangAnki home">Lang<span>Anki</span></button>${nav}</header>`;
}

function footer() {
  return `<footer class="foot"><span id="sync-status">${esc(statusText())}</span></footer>`;
}

function render() {
  stopSpeaking();
  applyTheme();
  const name = screen.name;
  const body = {
    welcome: welcomeHTML, home: homeHTML, study: studyHTML, finished: finishedHTML, browse: browseHTML,
    guide: guideScreenHTML, settings: settingsHTML, code: codeHTML,
  }[name]();
  const chrome = name !== 'study';
  app.className = `screen-${name}`;
  app.innerHTML = (chrome ? header() : '') + `<main class="page" id="main">${body}</main>` + (chrome ? footer() : '');
  after[name]?.();
  const focus = app.querySelector('[data-autofocus]');
  if (focus) focus.focus({ preventScroll: true });
}

function go(name, extra = {}) {
  screen = { name, ...extra };
  render();
  if (name !== 'study') window.scrollTo(0, 0);
}

// ---------- welcome ----------

function welcomeHTML() {
  return `<section class="welcome">
    <div class="welcome__glyphs" aria-hidden="true"><span lang="ja">あ</span><span lang="ko">한</span><span lang="he">א</span><span lang="hi">अ</span></div>
    <h1 tabindex="-1">Learn to read new writing systems, one card at a time.</h1>
    <p class="lede">LangAnki is a flashcard course for scripts: Japanese hiragana and katakana and Korean Hangul, with Hebrew and Hindi to follow. It shows each character when you’re about to forget it, and explains every sound with IPA and comparisons to English and Spanish.</p>
    <div class="actions">
      <button class="btn btn--primary" data-act="start">Start learning</button>
      <button class="btn" data-act="show-restore">I have a code</button>
    </div>
    <form class="restore" id="restore" ${screen.restore ? '' : 'hidden'}>
      <label for="restore-code">Your code</label>
      <div class="restore__row">
        <input id="restore-code" class="code-input" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXXX-XXXXX" maxlength="13">
        <button class="btn btn--primary" type="submit">Continue</button>
      </div>
      <p class="error" id="restore-error" role="alert" hidden></p>
    </form>
    <ul class="welcome__points">
      <li><strong>Spaced repetition.</strong> The FSRS scheduler (the one in current Anki) brings each card back just before you’d forget it.</li>
      <li><strong>Both directions.</strong> Read the character, then write it from its sound once you know it.</li>
      <li><strong>Quiet mode.</strong> Recognition only, no sound, for the office.</li>
      <li><strong>No account.</strong> A short code saves your progress and opens it on your other devices.</li>
    </ul>
  </section>`;
}

// ---------- home ----------

function totals(t = now(), scope = null) {
  let review = 0, fresh = 0, learning = 0;
  const ids = scope ? decksIn(scope) : DECKS.map((d) => d.id);
  for (const id of ids) {
    const c = deckCounts(state, deckById(id), t);
    review += c.review;
    fresh += c.fresh;
    learning += c.learning;
  }
  return { review, fresh, learning, due: review + learning, any: review + learning + fresh };
}

function codeBanner() {
  const code = getCode();
  if (code && !state.codeSaved) {
    return `<aside class="banner" aria-label="Your code">
      <div><strong>Save your code: <span class="code-text">${formatCode(code)}</span></strong>
      <p>Enter it on another device, or open your restore link, to pick up where you left off.</p></div>
      <div class="banner__actions"><button class="btn btn--small" data-act="copy-code">Copy code</button><button class="btn btn--small" data-act="code-saved">I’ve saved it</button></div>
    </aside>`;
  }
  return '';
}

function quietSwitch(id = 'quiet') {
  const on = state.settings.quiet;
  return `<label class="switch" for="${id}">
    <input type="checkbox" id="${id}" data-setting="quiet" ${on ? 'checked' : ''}>
    <span class="switch__track" aria-hidden="true"></span>
    <span class="switch__text"><strong>Quiet mode</strong> <span class="muted">Recognition only, no sound</span></span>
  </label>`;
}

function deckCardHTML(deck, t) {
  const c = deckCounts(state, deck, t);
  if (c.locked) {
    const base = lockedBy(deck);
    const p = baseProgress(state, base);
    const early = deck.kind === 'chars'
      ? `<div class="deck__actions"><button class="btn" data-act="unlock-early" data-deck="${deck.id}">Start ${esc(deck.name.toLowerCase())} now</button></div>`
      : '';
    return `<article class="deck deck--locked">
      <div class="deck__head"><h3>${esc(deck.name)}</h3><span class="deck__native" lang="${deck.htmlLang}">${esc(deck.native)}</span></div>
      <p class="muted">${esc(deck.blurb)}</p>
      <p class="deck__lock">Unlocks when you’ve learned the ${p.total} basic ${esc(base.name.toLowerCase())}: ${p.done} of ${p.total} so far.</p>
      <div class="bar" aria-hidden="true"><span style="width:${(p.done / p.total) * 100}%"></span></div>
      ${early}
    </article>`;
  }
  const paused = state.settings.paused?.[deck.id];
  const due = c.review + c.learning;
  return `<article class="deck">
    <div class="deck__head"><h3>${esc(deck.name)}</h3><span class="deck__native" lang="${deck.htmlLang}">${esc(deck.native)}</span></div>
    <p class="muted">${esc(deck.blurb)}</p>
    <dl class="counts">
      <div><dt>To review</dt><dd class="c-review">${due}</dd></div>
      <div><dt>New today</dt><dd class="c-new">${c.fresh}${paused ? ' <small>(paused)</small>' : ''}</dd></div>
      <div><dt>Learned</dt><dd>${c.learned}<small> of ${c.total}</small></dd></div>
    </dl>
    <div class="bar" aria-hidden="true"><span style="width:${(c.learned / c.total) * 100}%"></span></div>
    <div class="deck__actions">
      <button class="btn ${due + c.fresh ? 'btn--primary' : ''}" data-study="${deck.id}" ${due + c.fresh ? '' : 'disabled'}>Study</button>
      <button class="btn" data-browse="${deck.id}">${deck.kind === 'chars' ? 'Characters' : 'Words'}</button>
    </div>
  </article>`;
}

// One row per script in the Today card: what's due, and a way to study or keep going.
function todayRowHTML(script, t) {
  const tot = totals(t, script.id);
  const line = tot.any ? `${plural(tot.due, 'review')} · ${plural(tot.fresh, 'new card')}` : 'Caught up';
  const action = tot.any
    ? `<button class="btn btn--primary" data-study="${script.id}">Study ${esc(script.name)}</button>`
    : extraStudyHTML(t, script.id);
  return `<div class="today__row">
    <span class="today__native" lang="${script.htmlLang}" aria-hidden="true">${esc(script.native)}</span>
    <div class="today__what"><strong>${esc(script.name)}</strong><span class="muted">${line}</span></div>
    <div class="today__action">${action}</div>
  </div>`;
}

function homeHTML() {
  const t = now();
  const tot = totals(t);
  const msg = flash;
  flash = '';
  return `${msg ? `<p class="flash" role="status">${esc(msg)}</p>` : ''}
  ${codeBanner()}
  <section class="today">
    <div>
      <h1 tabindex="-1">${tot.any ? 'Today' : 'All caught up'}</h1>
      <p class="today__line">${tot.any ? `${plural(tot.due, 'card')} to review and ${plural(tot.fresh, 'new card')}.` : nextDueLine(t)}</p>
    </div>
    <div class="today__rows">${BUILT.map((s) => todayRowHTML(s, t)).join('')}</div>
    ${quietSwitch()}
  </section>
  ${BUILT.map((sc) => `<section class="script" aria-labelledby="${sc.id}-h">
    <div class="script__head"><h2 id="${sc.id}-h">${esc(sc.name)}</h2><span class="script__native" lang="${sc.htmlLang}">${esc(sc.native)}</span></div>
    <p class="tip">${esc(sc.intro)}</p>
    ${progressHTML(t, sc)}
    <div class="decks">${sc.decks.map((d) => deckCardHTML(d, t)).join('')}</div>
  </section>`).join('')}
  <section class="script" aria-labelledby="soon-h">
    <div class="script__head"><h2 id="soon-h">Coming next</h2></div>
    <div class="soon">${SCRIPTS.filter((sc) => sc.soon).map((sc) => `<div class="soon__item"><span class="soon__native" lang="${sc.htmlLang}">${esc(sc.native)}</span><div><strong>${esc(sc.name)}</strong><p class="muted">${esc(sc.blurb)}</p></div></div>`).join('')}</div>
  </section>`;
}

// ---------- progress: learned, weak spots, up next ----------

function progressHTML(t, script) {
  const decks = script.decks;
  if (!Object.keys(state.cards).some((k) => decks.some((d) => k.startsWith(`${d.id}:`)))) return '';
  const learned = learnedByDeck(state, decks);
  const weak = weakSpots(state, decks, t);
  const next = upNext(state, decks, t);

  const learnedHTML = learned.length
    ? learned.map((g) => `<div class="prog__deck">
        <div class="prog__deckhead"><strong>${esc(g.deck.name)}</strong><span class="muted">${g.items.length} of ${g.total}${g.writing ? ` · ${g.writing} can write` : ''}</span></div>
        <div class="chips">${g.items.map((it) => `<span class="chip-ch chip-ch--${it.status}" title="${esc(it.romaji)}"><span lang="${it.lang}">${esc(it.label)}</span></span>`).join('')}</div>
      </div>`).join('')
    : '<p class="muted">Characters appear here once they’ve made it through their first short reviews.</p>';

  const weakHTML = weak.length
    ? `<ul class="weak">${weak.map((w) => `<li><span class="weak__ch" lang="${w.lang}">${esc(w.label)}</span><span class="weak__r">${esc(w.romaji)}</span><span class="weak__why">${esc(w.why)}</span></li>`).join('')}</ul>
       <button class="btn btn--small" data-act="practice-weak" data-scope="${script.id}">Practice these (${weak.reduce((n, w) => n + w.cardIds.length, 0)} cards)</button>`
    : '<p class="muted">Nothing stands out yet. Characters you miss or read slowly will show up here.</p>';

  const nextHTML = `${next.fresh.map((f) => `<div class="next">
        <div class="prog__deckhead"><strong>${esc(f.deck.name)}</strong><span class="muted">${esc(f.groups.join(', '))}</span></div>
        <div class="chips">${f.items.map((it) => `<span class="chip-ch chip-ch--next" title="${esc(it.romaji)}"><span lang="${f.deck.htmlLang}">${esc(it.char)}</span></span>`).join('')}</div>
      </div>`).join('') || '<p class="muted">No new characters waiting today.</p>'}
    ${next.milestones.map((m) => `<div class="milestone"><div class="prog__deckhead"><span><strong>${m.done} of ${m.total} basic ${esc(m.base)}</strong></span><span class="muted">${m.total - m.done} to go</span></div><p class="small muted">All ${m.total} unlock ${esc(m.unlocks)}.</p><div class="bar" aria-hidden="true"><span style="width:${(m.done / m.total) * 100}%"></span></div></div>`).join('')}
    ${next.due ? `<p class="muted small">Next review ${whenText(next.due, t)}.</p>` : ''}`;

  return `<div class="prog" aria-label="${esc(script.name)} progress">
      <article class="prog__panel"><h3>Learned</h3>${learnedHTML}</article>
      <article class="prog__panel"><h3>Weak spots</h3>${weakHTML}</article>
      <article class="prog__panel"><h3>Up next</h3>${nextHTML}</article>
    </div>`;
}

function practiceWeak(scope) {
  const deckIds = decksIn(scope);
  const ids = weakSpots(state, deckIds.map(deckById), now()).flatMap((w) => w.cardIds);
  session = new Session(state, deckIds, now(), { quiet: state.settings.quiet, ids });
  session.label = 'Weak spots';
  session.scope = scope;
  undoStack = [];
  view = null;
  nextCard();
}

// Ways to keep going once a script's cards are done, like Anki's custom study.
function extraStudyHTML(t, scope) {
  const deckIds = decksIn(scope);
  const more = deckIds.reduce((n, id) => n + freshBeyondLimit(state, deckById(id), t), 0);
  const ahead = reviewAheadIds(state, deckIds, t, 20).length;
  if (!more && !ahead) return '<span class="muted small">Nothing more to study today.</span>';
  const step = state.settings.newPerDay || 10;
  return `<div class="extra">
      ${more ? `<button class="btn btn--primary" data-act="learn-more" data-scope="${scope}">Learn ${Math.min(step, more)} more</button>` : ''}
      ${ahead ? `<button class="btn" data-act="review-ahead" data-scope="${scope}">Review early (${ahead})</button>` : ''}
    </div>`;
}

function learnMore(scope) {
  const t = now();
  const step = state.settings.newPerDay || 10;
  for (const id of decksIn(scope)) {
    const deck = deckById(id);
    if (freshBeyondLimit(state, deck, t)) bumpDaily(state, dayKey(t), `${id}:extra`, step);
  }
  commit();
  startStudy(scope);
}

function nextDueLine(t) {
  const next = nextDue(state, DECKS, t);
  if (!next) return 'Nothing is due. Tomorrow brings new cards.';
  return `Nothing is due right now. The next card comes back ${whenText(next, t)}.`;
}

function whenText(ts, t) {
  const ms = ts - t;
  if (ms < 60 * 60 * 1000) return `in ${Math.max(1, Math.round(ms / 60000))} minutes`;
  if (dayKey(ts) === dayKey(t)) return `at ${new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  if (dayKey(ts) === dayKey(t + DAY)) return 'tomorrow';
  return `on ${new Date(ts).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}`;
}

// ---------- study ----------

let session = null;
let view = null; // { id, revealed, typed, correct, override, wasNew }
let undoStack = [];

function startStudy(which, { ahead = false } = {}) {
  const ids = decksIn(which);
  session = new Session(state, ids, now(), { quiet: state.settings.quiet, ahead });
  session.label = ahead ? 'Review early' : scriptOf(which)?.id === which ? scriptOf(which).name : deckById(which).name;
  session.scope = which;
  undoStack = [];
  view = null;
  nextCard();
}

function nextCard() {
  const id = session.next(state, now());
  if (!id) {
    view = null;
    finishSession();
    return;
  }
  const card = state.cards[id];
  view = { id, revealed: false, typed: '', correct: null, override: false, wasNew: !card || card.st === NEW };
  startTimer();
  go('study');
}

function finishSession() {
  const done = session.done;
  screen = { name: 'finished', done, scope: session.scope };
  render();
  ensureCode();
}

function glyphClass() {
  return `glyph glyph--${state.settings.kanaStyle}`;
}

const DIR_LABEL = { r: 'Read it', p: 'Write it' };

function studyHTML() {
  const { deck, item, dir } = parseId(view.id);
  const t = now();
  const c = session.counts(state, t);
  const card = state.cards[view.id] || newCard();
  const quiet = state.settings.quiet;
  const sound = !quiet && canSpeak(deck.lang);
  const status = view.wasNew ? '<span class="tag tag--new">New</span>' : card.lapses && card.st !== 2 ? '<span class="tag tag--again">Relearning</span>' : '';
  const top = `<div class="study__top">
    <button class="btn btn--ghost" data-act="end-study" aria-label="End session">← Done</button>
    <div class="queue" aria-label="Cards left">
      <span class="c-new" title="New">${c.fresh}</span><span class="c-learn" title="Learning">${c.learning}</span><span class="c-review" title="To review">${c.review}</span>
    </div>
    <div class="study__tools">
      <button class="btn btn--ghost" data-act="undo" ${undoStack.length ? '' : 'disabled'} title="Undo last answer (Z)">Undo</button>
      <button class="chip ${quiet ? 'chip--on' : ''}" data-act="toggle-quiet" aria-pressed="${quiet}" title="Recognition only, no sound">Quiet</button>
    </div>
  </div>`;

  const label = `<div class="card__label"><span>${esc(deck.name)} · ${DIR_LABEL[dir]}</span>${status}</div>`;
  let front, back = '', actions;

  if (deck.kind === 'words') {
    front = `<div class="${glyphClass()} glyph--word" lang="${deck.htmlLang}">${esc(item.text)}</div>`;
    if (view.revealed) back = wordBackHTML(deck, item, sound);
  } else if (dir === 'r') {
    front = `<div class="${glyphClass()}" lang="${deck.htmlLang}">${esc(item.char)}</div>`;
    if (view.revealed) back = charBackHTML(deck, item, sound, { open: view.wasNew });
  } else {
    front = productionFrontHTML(deck, item, sound);
    if (view.revealed) back = productionResultHTML(deck, item) + charBackHTML(deck, item, sound, { open: view.wasNew || !view.correct, hideRomaji: true });
  }

  if (!view.revealed) {
    actions = dir === 'p'
      ? `<div class="answer-row"><button class="btn btn--ghost" data-act="give-up">I don’t know</button><button class="btn btn--primary btn--grow" data-act="check">Check</button></div>`
      : `<button class="btn btn--primary btn--block" data-act="reveal" data-autofocus>Show answer <kbd>Space</kbd></button>`;
  } else if (dir === 'p' && !view.correct && !view.override) {
    actions = `<div class="answer-row"><button class="grade grade--1 btn--grow" data-grade="1" data-autofocus><span>Again</span><small>${formatWait(preview(card, t, schedOpts(view.id))[0])}</small></button></div>
      <button class="link link--small" data-act="override">I knew it, I just mistyped</button>`;
  } else if (state.settings.grading === 'auto') {
    const waits = preview(card, t, schedOpts(view.id)).map(formatWait);
    const g = view.override ? 3 : timedGrade(card, deck, item, dir, view.elapsed);
    const secs = `${(view.elapsed / 1000).toFixed(1)} s`;
    const got = `<button class="grade grade--${g} btn--grow" data-grade="${g}" data-autofocus><span>${dir === 'p' ? 'Next' : 'Got it'}</span><small>${GRADE_NAMES[g]} · ${waits[g - 1]}</small><kbd>${dir === 'p' ? 'Enter' : '1'}</kbd></button>`;
    actions = dir === 'p'
      ? `<div class="answer-row">${got}</div>`
      : `<div class="answer-row">${got}<button class="grade grade--1 btn--grow" data-grade="1"><span>Missed it</span><small>Again · ${waits[0]}</small><kbd>2</kbd></button></div>`;
    actions += `<p class="timing">${view.override ? 'Counted as right.' : `Answered in ${secs}.`} <button class="link link--small" data-act="manual-grade">Choose the grade myself</button></p>`;
    if (view.manual) actions = gradeRow(waits);
  } else {
    actions = gradeRow(preview(card, t, schedOpts(view.id)).map(formatWait));
  }

  return `<section class="study" aria-label="Study">
    ${top}
    <div class="card ${view.revealed ? 'is-revealed' : ''}" id="card">
      ${label}
      <div class="card__front">${front}</div>
      ${back ? `<div class="card__back">${back}</div>` : ''}
    </div>
    <div class="study__actions">${actions}</div>
    ${dir === 'p' && !view.revealed && !mobile ? kanaKeyboardHTML(deck) : ''}
  </section>`;
}

function soundButton(text, lang, label = 'Play sound') {
  return `<button class="play" data-say="${esc(text)}" data-lang="${esc(lang)}" aria-label="${esc(label)}">${PLAY_ICON}</button>`;
}
const PLAY_ICON = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

function charBackHTML(deck, item, sound, { open = false, hideRomaji = false } = {}) {
  return `<div class="answer">
      ${hideRomaji ? '' : `<div class="answer__romaji">${esc(item.romaji)}</div>`}
      <div class="answer__ipa">[${esc(item.ipa)}]</div>
      ${sound ? soundButton(item.say, deck.lang) : ''}
    </div>
    ${item.name ? `<p class="answer__name">Letter name: <span lang="${deck.htmlLang}">${esc(item.name)}</span> (${esc(item.nameRomaji)})</p>` : ''}
    ${guideHTML(item, { open })}`;
}

function wordBackHTML(deck, item, sound) {
  const units = wordBreakdown(deck, item.text);
  const parts = units.map((u) => `<span class="unit"><span class="unit__ch" lang="${deck.htmlLang}">${esc(u.ch)}</span><span class="unit__r">${esc(u.r)}</span></span>`).join('');
  const blockwise = units.map((u) => u.r).join('');
  const changed = deck.breakdown && blockwise.replace(/[^a-z]/g, '') !== item.romaji.replace(/[^a-z]/g, '');
  return `<div class="answer">
      <div class="answer__romaji">${esc(item.romaji)}</div>
      ${sound ? soundButton(item.say, deck.lang) : ''}
    </div>
    <dl class="meaning"><div><dt>English</dt><dd>${esc(item.en)}</dd></div><div><dt>Español</dt><dd lang="es">${esc(item.es)}</dd></div></dl>
    <div class="units" aria-label="Characters">${parts}</div>
    ${changed ? `<p class="small muted">Sounds change across blocks: written ${esc(blockwise)}, said ${esc(item.romaji)}.</p>` : ''}`;
}

function productionFrontHTML(deck, item, sound) {
  if (view.revealed) {
    return `<div class="prompt prompt--done"><div class="prompt__romaji">${esc(item.romaji)}</div></div>`;
  }
  return `<div class="prompt">
    <p class="prompt__ask">Write this in <strong>${esc(deck.writeIn || deck.name.toLowerCase())}</strong></p>
    <div class="prompt__romaji">${esc(item.romaji)}</div>
    ${item.hint ? `<p class="prompt__hint">${esc(item.hint)}</p>` : ''}
    <div class="prompt__sound"><span class="answer__ipa">[${esc(item.ipa)}]</span>${sound ? soundButton(item.say, deck.lang) : ''}</div>
    <form class="typed" id="typed-form" autocomplete="off">
      <label class="sr-only" for="typed">Your answer</label>
      <input id="typed" class="typed__input glyph--${state.settings.kanaStyle}" lang="${deck.htmlLang}" value="${esc(view.typed)}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" data-autofocus>
    </form>
    ${mobile ? `<p class="muted small">Use your ${{ ja: 'Japanese kana', ko: 'Korean' }[deck.htmlLang] || ''} keyboard.</p>` : ''}
  </div>`;
}

function productionResultHTML(deck, item) {
  const typed = view.typed.trim();
  if (view.correct) return `<p class="result result--ok"><span aria-hidden="true">✓</span> Correct</p><div class="${glyphClass()}" lang="${deck.htmlLang}">${esc(item.char)}</div>`;
  const wrongScript = typed && deck.htmlLang === 'ja' && toOtherScript(typed) === item.char;
  const msg = !typed ? 'The answer is' : wrongScript ? `Right sound, other script. You wrote ${esc(typed)}; in ${esc(deck.name.toLowerCase())} it’s` : `You wrote <span lang="${deck.htmlLang}">${esc(typed)}</span>. The answer is`;
  return `<p class="result result--err"><span aria-hidden="true">✗</span> ${msg}</p><div class="${glyphClass()}" lang="${deck.htmlLang}">${esc(item.char)}</div>`;
}

const toOtherScript = (s) => s.replace(/[ぁ-ゖァ-ヶ]/g, (ch) => {
  const c = ch.charCodeAt(0);
  return String.fromCharCode(c < 0x30a0 ? c + 0x60 : c - 0x60);
});

// Kana: laid out like a kana table, each consonant row a column with vowels running down.
// Hangul: the standard two-set (dubeolsik) layout, with keys composing into blocks.
function kanaKeyboardHTML(deck) {
  const key = (ch) => (ch === ' ' || !ch ? '<span class="kb__gap"></span>' : `<button type="button" class="kb__key" data-key="${ch}" lang="${deck.htmlLang}">${ch}</button>`);
  const edit = '<button type="button" class="kb__key kb__key--wide" data-key="back">⌫ Delete</button><button type="button" class="kb__key kb__key--wide" data-key="clear">Clear</button>';
  if (deck.keyboardRows) {
    return `<div class="kb kb--rows" aria-label="On-screen ${esc(deck.writeIn || deck.name)} keyboard">
      ${deck.keyboardRows.map((r, i) => `<div class="kb__line" style="--indent:${[0, 0.5, 1.5, 0, 0][i] || 0}">${[...r].map(key).join('')}</div>`).join('')}
      <div class="kb__extras">${edit}</div>
    </div>`;
  }
  const table = (rows) => `<div class="kb__table" style="--cols:${rows.length}">${[0, 1, 2, 3, 4].map((v) => rows.map((r) => key([...r][v])).join('')).join('')}</div>`;
  const rows = deck.keyboard;
  const extras = rows.slice(15).join('').replace(/ /g, '');
  return `<div class="kb" aria-label="On-screen ${esc(deck.name)} keyboard">
    <div class="kb__tables">${table(rows.slice(0, 10))}${table(rows.slice(10, 15))}</div>
    <div class="kb__extras">${[...extras].map(key).join('')}${edit}</div>
  </div>`;
}

function guideHTML(item, { open = false } = {}) {
  const kinds = { consonant: 'Consonant', vowel: 'Vowel', glide: 'Glide', initial: 'Start of block', final: 'End of block' };
  const parts = item.parts.map((p) => `<li class="part part--${p.kind}">
      <div class="part__head"><span class="part__sym">${esc(p.sym)}</span><span class="part__kind">${kinds[p.kind]}</span><span class="part__ipa">/${esc(p.ipa)}/</span></div>
      <p class="part__type">${esc(p.type)}. ${esc(p.how)}</p>
      <p class="cmp"><span class="cmp__lang">EN</span> ${esc(p.en)}</p>
      <p class="cmp"><span class="cmp__lang">ES</span> ${esc(p.es)}</p>
    </li>`).join('');
  const notes = item.notes?.length ? `<ul class="notes">${item.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : '';
  return `<details class="guide" ${open ? 'open' : ''}><summary>How to say it</summary><ol class="parts">${parts}</ol>${notes}</details>`;
}

const GRADE_NAMES = { 1: 'Again', 2: 'Hard', 3: 'Good', 4: 'Easy' };

function gradeRow(waits) {
  return `<div class="grades" role="group" aria-label="How well did you remember?">
      ${['Again', 'Hard', 'Good', 'Easy'].map((g, i) => `<button class="grade grade--${i + 1}" data-grade="${i + 1}" ${i === 2 ? 'data-autofocus' : ''}><span>${g}</span><small>${waits[i]}</small><kbd>${i + 1}</kbd></button>`).join('')}
    </div>`;
}

// ---------- answer timer ----------
// Time from the card appearing to Show answer (or Check), not counting time the tab was hidden.

let timer = { start: 0, hiddenAt: 0, hidden: 0 };
function startTimer() {
  timer = { start: performance.now(), hiddenAt: document.hidden ? performance.now() : 0, hidden: 0 };
}
function stopTimer() {
  const t = performance.now();
  const hidden = timer.hidden + (timer.hiddenAt ? t - timer.hiddenAt : 0);
  return Math.max(0, t - timer.start - hidden);
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) timer.hiddenAt = performance.now();
  else if (timer.hiddenAt) {
    timer.hidden += performance.now() - timer.hiddenAt;
    timer.hiddenAt = 0;
  }
});

// A correct answer's grade from how long it took. Easy needs a card that's past learning,
// so a first lucky guess doesn't send a brand-new character away for weeks.
function timedGrade(card, deck, item, dir, ms) {
  const units = deck.kind === 'words' ? wordUnitCount(deck, item.text) : 1;
  const t = TIMING[dir];
  const extra = (units - 1) * t.perExtra;
  const g = ms <= t.easy + extra ? 4 : ms <= t.good + extra ? 3 : 2;
  return card.st === 2 ? g : Math.min(g, 3);
}

function schedOpts(id) {
  return { retention: state.settings.retention, id };
}

function reveal() {
  if (view.revealed) return;
  view.elapsed = stopTimer();
  view.revealed = true;
  const { deck, item } = parseId(view.id);
  render();
  if (!state.settings.quiet && state.settings.autoplay && canSpeak(deck.lang)) speak(item.say || item.text, deck.lang);
}

function checkTyped(giveUp = false) {
  const input = document.getElementById('typed');
  view.typed = giveUp ? '' : (input?.value || '').normalize('NFC').replace(/\s+/g, '');
  const { item } = parseId(view.id);
  view.correct = !giveUp && view.typed === item.char;
  reveal();
}

function grade(g) {
  const id = view.id;
  const t = now();
  const prev = state.cards[id];
  const day = dayKey(t);
  undoStack.push({ id, prev: prev ? { ...prev } : null, daily: JSON.stringify(state.daily[day] || null), day, logLen: state.log.length, session: session.snapshot(), view: { ...view, revealed: false, correct: null, override: false, manual: false, typed: '' } });
  if (undoStack.length > 10) undoStack.shift();
  const card = prev || newCard();
  const { deck, dir } = parseId(id);
  if (card.st === NEW) bumpDaily(state, day, `${deck.id}:${dir === 'p' ? 'pnew' : 'new'}`);
  bumpDaily(state, day, 'reviews');
  state.cards[id] = schedule(card, g, t, schedOpts(id));
  addLog(state, { at: t, id, g, ms: Math.round(view.elapsed || 0) });
  commit();
  session.answered(id);
  nextCard();
}

function undo() {
  const u = undoStack.pop();
  if (!u) return;
  if (u.prev) state.cards[u.id] = u.prev;
  else delete state.cards[u.id];
  const d = JSON.parse(u.daily);
  if (d) state.daily[u.day] = d;
  else delete state.daily[u.day];
  state.log.length = u.logLen;
  session.restore(u.session);
  view = u.view;
  startTimer();
  commit();
  render();
}

function endStudy() {
  if (session && session.done) finishSession();
  else go('home');
}

// ---------- finished ----------

function finishedHTML() {
  const t = now();
  const scope = scriptOf(screen.scope)?.id || screen.scope;
  const decks = decksIn(scope).map(deckById);
  const next = nextDue(state, decks, t);
  const tot = totals(t, scope);
  const more = tot.any;
  return `<section class="narrow finished">
    <h1 tabindex="-1">${screen.done ? 'Done for now' : 'Nothing to study'}</h1>
    <p class="lede">${screen.done ? `You answered ${plural(screen.done, 'card')}.` : 'There are no cards due here.'} ${next ? `The next card comes back ${whenText(next, t)}.` : ''}</p>
    ${state.settings.quiet ? '<p class="muted">Quiet mode is on, so writing cards were skipped. Turn it off when you can use sound to practice writing too.</p>' : ''}
    <div class="actions">
      ${more ? `<button class="btn btn--primary" data-study="${scope}">Keep studying (${more})</button>` : ''}
      <button class="btn" data-go="home">Back to overview</button>
    </div>
    ${more ? '' : extraStudyHTML(t, scope)}
  </section>`;
}

// ---------- browse and guide ----------

function browseHTML() {
  const deck = deckById(screen.deck);
  if (deck.kind === 'words') return wordsBrowseHTML(deck);
  const groups = deck.groups.map((g) => `<section class="group">
      <h3 class="group__name">${esc(g.name)}</h3>
      <div class="tiles">${g.items.map((it) => {
        const st = itemStatus(state, deck, it);
        return `<button class="tile tile--${st}" data-guide="${it.id}" aria-label="${esc(it.char)}, ${esc(it.romaji)}, ${st}"><span class="tile__ch ${glyphClass()}" lang="${deck.htmlLang}">${esc(it.char)}</span><span class="tile__r">${esc(it.romaji)}</span></button>`;
      }).join('')}</div>
    </section>`).join('');
  return `<div class="browse">
    <button class="link back" data-go="home">← Overview</button>
    <div class="script__head"><h1 tabindex="-1">${esc(deck.name)}</h1><span class="script__native" lang="${deck.htmlLang}">${esc(deck.native)}</span></div>
    <p class="muted">Tap a character for its sound and how to say it. Colors show your progress.</p>
    <ul class="legend"><li class="tile--new">Not started</li><li class="tile--learning">Learning</li><li class="tile--learned">Learned</li><li class="tile--strong">Strong (3+ weeks)</li></ul>
    ${groups}
  </div>`;
}

function wordsBrowseHTML(deck) {
  const locked = deckLocked(state, deck);
  const rows = deck.items.map((w) => {
    const c = state.cards[cardId(deck.id, w.id, 'r')];
    const seen = c && c.st !== NEW;
    return `<li class="word ${seen ? '' : 'word--unseen'}"><span class="word__text ${glyphClass()}" lang="${deck.htmlLang}">${esc(w.text)}</span><span class="word__r">${seen ? esc(w.romaji) : ''}</span><span class="word__m">${seen ? `${esc(w.en)} · <span lang="es">${esc(w.es)}</span>` : '<span class="muted">Not studied yet</span>'}</span></li>`;
  }).join('');
  return `<div class="browse">
    <button class="link back" data-go="home">← Overview</button>
    <h1 tabindex="-1">${esc(deck.name)}</h1>
    <p class="muted">${locked ? 'This deck unlocks once the basic characters are learned.' : 'Words appear for study once you’ve learned every character in them. Readings show after you’ve studied a word.'}</p>
    <ul class="words">${rows}</ul>
  </div>`;
}

function guideScreenHTML() {
  const deck = deckById(screen.deck);
  const item = deck.byId[screen.item];
  const sound = !state.settings.quiet && canSpeak(deck.lang);
  const idx = deck.items.indexOf(item);
  const prev = deck.items[idx - 1];
  const nextItem = deck.items[idx + 1];
  return `<div class="guide-page">
    <button class="link back" data-browse="${deck.id}">← ${esc(deck.name)}</button>
    <div class="guide-page__hero">
      <div class="${glyphClass()}" lang="${deck.htmlLang}">${esc(item.char)}</div>
      <div class="answer"><div class="answer__romaji">${esc(item.romaji)}</div><div class="answer__ipa">[${esc(item.ipa)}]</div>${sound ? soundButton(item.say, deck.lang) : ''}</div>
      ${item.name ? `<p class="answer__name">Letter name: <span lang="${deck.htmlLang}">${esc(item.name)}</span> (${esc(item.nameRomaji)})</p>` : ''}
    </div>
    ${guideHTML(item, { open: true })}
    <nav class="pager" aria-label="Other characters">
      ${prev ? `<button class="btn" data-guide="${prev.id}">← <span lang="${deck.htmlLang}">${esc(prev.char)}</span></button>` : '<span></span>'}
      ${nextItem ? `<button class="btn" data-guide="${nextItem.id}"><span lang="${deck.htmlLang}">${esc(nextItem.char)}</span> →</button>` : '<span></span>'}
    </nav>
  </div>`;
}

// ---------- settings ----------

function settingsHTML() {
  const s = state.settings;
  const msg = flash;
  flash = '';
  const decks = DECKS;
  const voices = BUILT.map((sc) => ({ name: sc.name, ok: canSpeak(sc.lang) }));
  const missing = voices.filter((v) => !v.ok).map((v) => v.name);
  return `<div class="settings">
    <button class="link back" data-go="home">← Overview</button>
    <h1 tabindex="-1">Settings</h1>
    ${msg ? `<p class="flash" role="status">${esc(msg)}</p>` : ''}
    <section class="panel">
      <h2>Studying</h2>
      <div class="field">
        <label for="newPerDay">New cards per day, per script</label>
        <div class="stepper"><button class="btn btn--small" data-step="-1" aria-label="Fewer">−</button><input id="newPerDay" type="number" inputmode="numeric" min="0" max="50" value="${s.newPerDay}" data-setting="newPerDay"><button class="btn btn--small" data-step="1" aria-label="More">+</button></div>
        <p class="help">Each deck gets this many (hiragana, katakana, Hangul letters and so on). Writing cards have their own allowance of the same size.</p>
      </div>
      <div class="field">
        <label for="retention">How much to remember</label>
        <select id="retention" data-setting="retention">
          ${[[0.85, '85%: fewer reviews'], [0.9, '90%: recommended'], [0.95, '95%: more reviews']].map(([v, l]) => `<option value="${v}" ${s.retention === v ? 'selected' : ''}>${l}</option>`).join('')}
        </select>
        <p class="help">The scheduler times each review for this chance of remembering.</p>
      </div>
      <fieldset class="field">
        <legend>Grading</legend>
        <div class="choices">
          <label class="choice"><input type="radio" name="grading" value="auto" ${s.grading === 'auto' ? 'checked' : ''} data-setting="grading"> By time</label>
          <label class="choice"><input type="radio" name="grading" value="manual" ${s.grading === 'manual' ? 'checked' : ''} data-setting="grading"> Choose myself</label>
        </div>
        <p class="help">By time: you only say whether you got it. Answers within ${TIMING.r.easy / 1000} seconds count as Easy, within ${TIMING.r.good / 1000} as Good, slower as Hard. New cards top out at Good. Choose myself shows Again, Hard, Good and Easy.</p>
      </fieldset>
      <fieldset class="field">
        <legend>Pause new cards</legend>
        ${BUILT.map((sc) => `<p class="check-group">${esc(sc.name)}</p>${sc.decks.map((d) => `<label class="check"><input type="checkbox" data-pause="${d.id}" ${s.paused?.[d.id] ? 'checked' : ''}> ${esc(d.name)}</label>`).join('')}`).join('')}
        <p class="help">Reviews continue for paused decks.</p>
      </fieldset>
      ${startOverHTML(decks)}
    </section>
    <section class="panel">
      <h2>Sound and display</h2>
      ${quietSwitch('quiet-s')}
      <label class="switch" for="autoplay"><input type="checkbox" id="autoplay" data-setting="autoplay" ${s.autoplay ? 'checked' : ''}><span class="switch__track" aria-hidden="true"></span><span class="switch__text"><strong>Play the sound automatically</strong> <span class="muted">When the answer shows</span></span></label>
      <p class="help">${missing.length ? `This device has no ${missing.join(' or ')} voice, so play buttons are hidden for ${missing.length > 1 ? 'those languages' : 'that language'}. On iPhone, add voices under Settings › Accessibility › Spoken Content › Voices.` : `This device has ${voices.map((v) => v.name).join(' and ')} voices.`}</p>
      <fieldset class="field">
        <legend>Character style</legend>
        <div class="choices">
          <label class="choice"><input type="radio" name="kanaStyle" value="textbook" ${s.kanaStyle === 'textbook' ? 'checked' : ''} data-setting="kanaStyle"><span class="glyph--textbook" lang="ja">さきり</span><span class="glyph--textbook" lang="ko">한글</span> Textbook</label>
          <label class="choice"><input type="radio" name="kanaStyle" value="print" ${s.kanaStyle === 'print' ? 'checked' : ''} data-setting="kanaStyle"><span class="glyph--print" lang="ja">さきり</span><span class="glyph--print" lang="ko">한글</span> Print</label>
        </div>
        <p class="help">Textbook shapes look like handwriting. Print is what you’ll see on signs and screens.</p>
      </fieldset>
      <fieldset class="field">
        <legend>Theme</legend>
        <div class="choices">${['auto', 'light', 'dark'].map((t) => `<label class="choice"><input type="radio" name="theme" value="${t}" ${s.theme === t ? 'checked' : ''} data-setting="theme"> ${t === 'auto' ? 'Match device' : t[0].toUpperCase() + t.slice(1)}</label>`).join('')}</div>
      </fieldset>
    </section>
    <section class="panel">
      <h2>Your code</h2>
      ${codeManageHTML()}
    </section>
  </div>`;
}

// Decks with progress can be erased and started again (a character deck takes its word deck with it).
function startOverHTML(decks) {
  const started = decks.filter((d) => d.kind === 'chars' && Object.keys(state.cards).some((k) => k.startsWith(`${d.id}:`)));
  if (!started.length) return '';
  return `<div class="field">
      <span class="field__label">Start a deck over</span>
      <div class="actions">${started.map((d) => `<button class="btn btn--small btn--danger" data-act="reset-deck" data-deck="${d.id}">Reset ${esc(d.name.toLowerCase())}</button>`).join('')}</div>
      <p class="help">Erases that deck’s progress on every device, along with any word deck built on it. Decks that wait on it lock again.</p>
    </div>`;
}

function codeManageHTML() {
  const code = getCode();
  if (!code) {
    return `<p>${apiOK === false ? 'Codes need the sync server, which isn’t reachable right now.' : 'You don’t have a code yet. A code saves your progress so you can continue on another device.'}</p>
      <div class="actions"><button class="btn btn--primary" data-act="get-code" ${apiOK === false ? 'disabled' : ''}>Get my code</button><button class="btn" data-go="code">I have a code</button></div>
      <hr><button class="btn btn--danger" data-act="reset-local">Erase progress on this device</button>`;
  }
  return `<p>Your code is <strong class="code-text">${formatCode(code)}</strong>.</p>
    <div class="actions">
      <button class="btn" data-act="copy-code">Copy code</button>
      <button class="btn" data-act="copy-link">Copy restore link</button>
    </div>
    <hr>
    <div class="actions actions--stack">
      <button class="btn" data-act="rotate">Replace my code</button>
      <button class="btn" data-act="forget-device">Remove progress from this device</button>
      <button class="btn btn--danger" data-act="erase">Erase my progress everywhere</button>
    </div>
    <p class="help">Replacing gives you a new code; the old one stops working. Removing from this device keeps the progress saved under your code.</p>`;
}

// ---------- code ----------

function codeHTML() {
  const code = getCode();
  const msg = flash;
  flash = '';
  if (code) {
    return `<section class="narrow code-page">
      <button class="link back" data-go="home">← Overview</button>
      <h1 tabindex="-1">Your code</h1>
      ${msg ? `<p class="flash" role="status">${esc(msg)}</p>` : ''}
      <p class="code-big" aria-label="Your code">${formatCode(code)}</p>
      <p>Enter this code on another device, or open the restore link, to continue there. Anyone with the code can open your progress, so keep it private.</p>
      <div class="actions">
        <button class="btn btn--primary" data-act="copy-code">Copy code</button>
        <button class="btn" data-act="copy-link">Copy restore link</button>
        ${state.codeSaved ? '' : '<button class="btn" data-act="code-saved">I’ve saved it</button>'}
      </div>
      <p class="muted small">Codes ignore capital letters and dashes, and read O as zero and I or L as one.</p>
    </section>`;
  }
  return `<section class="narrow code-page">
    <button class="link back" data-go="home">← Overview</button>
    <h1 tabindex="-1">Codes</h1>
    ${msg ? `<p class="flash" role="status">${esc(msg)}</p>` : ''}
    <p>A code saves your progress on the server so you can open it on your other devices. No name or email is needed.</p>
    <div class="actions"><button class="btn btn--primary" data-act="get-code" ${apiOK === false ? 'disabled' : ''}>Get my code</button></div>
    <form class="restore" id="restore">
      <label for="restore-code">Already have a code? Enter it to load that progress here.</label>
      <div class="restore__row">
        <input id="restore-code" class="code-input" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXXX-XXXXX" maxlength="13">
        <button class="btn" type="submit">Load</button>
      </div>
      <p class="error" id="restore-error" role="alert" hidden></p>
      <p class="help">Progress already on this device is combined with it.</p>
    </form>
  </section>`;
}

async function restoreWithCode(raw) {
  const code = normalizeCode(raw);
  const err = document.getElementById('restore-error');
  const showErr = (m) => {
    if (err) {
      err.textContent = m;
      err.hidden = false;
    }
  };
  if (!isValidCode(code)) return showErr('A code has 10 letters and numbers, like TQ7MK-4XPRB.');
  try {
    const data = await fetchProfile(code);
    const remote = normalize(data.data);
    state = state ? normalize(mergeStates(state, remote)) : remote;
    state.codeSaved = true;
    adoptCode(code, data.version);
    save(state);
    flash = 'Your progress is loaded.';
    go('home');
    syncNow();
  } catch (e) {
    showErr(e.message || 'That code didn’t work.');
  }
}

async function copy(text, done) {
  try {
    await navigator.clipboard.writeText(text);
    flash = done;
  } catch (e) {
    flash = `Copy this: ${text}`;
  }
  render();
}

// ---------- events ----------

const after = {
  study() {
    const input = document.getElementById('typed');
    if (input) {
      input.addEventListener('input', () => (view.typed = input.value));
    }
  },
};

app.addEventListener('submit', (e) => {
  e.preventDefault();
  if (e.target.id === 'restore') restoreWithCode(document.getElementById('restore-code').value);
  if (e.target.id === 'typed-form') checkTyped();
});

app.addEventListener('click', async (e) => {
  const el = e.target.closest('button, [data-go]');
  if (!el) return;
  const d = el.dataset;
  if (d.go) return go(d.go);
  if (d.study) return startStudy(d.study);
  if (d.browse) return go('browse', { deck: d.browse });
  if (d.guide) return go('guide', { deck: screen.deck, item: d.guide });
  if (d.grade) return grade(Number(d.grade));
  if (d.say) return speak(d.say, d.lang);
  if (d.key) return keyPress(d.key);
  if (d.step) {
    const input = document.getElementById('newPerDay');
    input.value = Math.min(50, Math.max(0, Number(input.value) + Number(d.step)));
    return setSetting('newPerDay', Number(input.value), false);
  }
  switch (d.act) {
    case 'start':
      state = freshState();
      save(state);
      return go('home');
    case 'show-restore':
      screen.restore = true;
      render();
      return document.getElementById('restore-code')?.focus();
    case 'reset-deck': {
      const deck = deckById(d.deck);
      const words = DECKS.filter((x) => x.requires === deck.id).map((x) => x.name.toLowerCase());
      if (!confirm(`Erase all your ${deck.name.toLowerCase()} progress${words.length ? `, including ${words.join(' and ')}` : ''}? This can’t be undone.`)) return;
      resetDeck(state, deck.id, now());
      commit();
      flash = `${deck.name} has been reset.`;
      return render();
    }
    case 'unlock-early':
      if (!confirm(`Start ${deckById(d.deck).name.toLowerCase()} now? It normally waits until you’ve learned the basic ${lockedBy(deckById(d.deck)).name.toLowerCase()}, which makes it easier.`)) return;
      state.settings.unlocked = { ...state.settings.unlocked, [d.deck]: true };
      commit();
      return render();
    case 'learn-more':
      return learnMore(d.scope);
    case 'practice-weak':
      return practiceWeak(d.scope);
    case 'review-ahead':
      return startStudy(d.scope, { ahead: true });
    case 'reveal':
      return reveal();
    case 'check':
      return checkTyped();
    case 'give-up':
      return checkTyped(true);
    case 'override':
      view.override = true;
      return render();
    case 'manual-grade':
      view.manual = true;
      return render();
    case 'undo':
      return undo();
    case 'end-study':
      return endStudy();
    case 'toggle-quiet':
      return toggleQuietInStudy();
    case 'copy-code':
      return copy(formatCode(getCode()), 'Code copied.');
    case 'copy-link':
      return copy(restoreLink(getCode()), 'Restore link copied.');
    case 'code-saved':
      state.codeSaved = true;
      commit();
      return render();
    case 'get-code':
      try {
        await createProfile(state);
        flash = 'Here’s your code. Save it somewhere safe.';
        state.codeSaved = false;
        commit();
        return go('code');
      } catch (err) {
        flash = err.message;
        return render();
      }
    case 'rotate':
      if (!confirm('Replace your code? The old code will stop working on every device.')) return;
      try {
        await rotateCode();
        state.codeSaved = false;
        commit();
        flash = 'Your new code is ready. Save it, since the old one no longer works.';
        return go('code');
      } catch (err) {
        flash = err.message;
        return render();
      }
    case 'forget-device':
      if (!confirm('Remove progress from this device? It stays saved under your code, so you can load it again.')) return;
      await syncNow();
      forgetCode();
      clearLocal();
      state = null;
      return go('welcome');
    case 'erase':
      if (!confirm('Erase all your progress, on every device? This can’t be undone.')) return;
      try {
        await eraseRemote();
      } catch (err) {
        flash = err.message;
        return render();
      }
      clearLocal();
      state = null;
      return go('welcome');
    case 'reset-local':
      if (!confirm('Erase all progress on this device? This can’t be undone.')) return;
      clearLocal();
      state = null;
      return go('welcome');
  }
});

app.addEventListener('change', (e) => {
  const el = e.target;
  if (el.dataset.pause) {
    state.settings.paused = { ...state.settings.paused, [el.dataset.pause]: el.checked };
    commit();
    return;
  }
  const key = el.dataset.setting;
  if (!key) return;
  let value = el.type === 'checkbox' ? el.checked : el.value;
  if (key === 'retention') value = Number(value);
  if (key === 'newPerDay') value = Math.min(50, Math.max(0, Math.round(Number(value) || 0)));
  setSetting(key, value, key !== 'newPerDay');
});

function setSetting(key, value, rerender = true) {
  state.settings[key] = value;
  commit();
  if (key === 'theme') applyTheme();
  if (rerender) render();
}

function toggleQuietInStudy() {
  state.settings.quiet = !state.settings.quiet;
  commit();
  const done = session.done;
  session = Object.assign(new Session(state, session.deckIds, now(), { quiet: state.settings.quiet, ahead: session.ahead }), { label: session.label, scope: session.scope });
  session.done = done;
  undoStack = [];
  if (state.settings.quiet && view && parseId(view.id).dir === 'p') return nextCard();
  render();
}

function keyPress(key) {
  const input = document.getElementById('typed');
  if (!input) return;
  const deck = parseId(view.id).deck;
  if (key === 'back') input.value = deck.deleteKey ? deck.deleteKey(input.value) : [...input.value].slice(0, -1).join('');
  else if (key === 'clear') input.value = '';
  else input.value = deck.typeKey ? deck.typeKey(input.value, key) : input.value + key;
  view.typed = input.value;
  input.focus();
}

document.addEventListener('keydown', (e) => {
  if (screen.name !== 'study' || !view || e.metaKey || e.ctrlKey || e.altKey) return;
  const typing = e.target.id === 'typed';
  if (typing) {
    if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) {
      e.preventDefault();
      checkTyped();
    }
    return;
  }
  if (!view.revealed && (e.key === ' ' || e.key === 'Enter') && parseId(view.id).dir === 'r') {
    e.preventDefault();
    return reveal();
  }
  if (view.revealed && (e.key === 'Enter' || e.key === ' ')) {
    const btn = app.querySelector('.study__actions [data-autofocus][data-grade]');
    if (btn) {
      e.preventDefault();
      return grade(Number(btn.dataset.grade));
    }
  }
  if (view.revealed && /^[1-4]$/.test(e.key) && state.settings.grading === 'auto' && !view.manual) {
    const btns = [...app.querySelectorAll('.study__actions [data-grade]')];
    const btn = btns[Number(e.key) - 1];
    if (btn) {
      e.preventDefault();
      return grade(Number(btn.dataset.grade));
    }
    return;
  }
  if (view.revealed && /^[1-4]$/.test(e.key)) {
    const btn = app.querySelector(`[data-grade="${e.key}"]`);
    if (btn) {
      e.preventDefault();
      return grade(Number(e.key));
    }
  }
  if (e.key === 'z' || e.key === 'Z') return undo();
  if (e.key === 'r' || e.key === 'R') app.querySelector('[data-say]')?.click();
});

// Sync when the tab comes back into view.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') pullNow();
});
window.addEventListener('focus', () => pullNow());

// Voices load late on some browsers; re-render so play buttons appear.
onVoices(() => {
  if (screen.name !== 'study' || !view?.revealed) render();
});

// ---------- start ----------

async function init() {
  // Restore links: /#code=XXXXX-XXXXX. The hash never reaches the server.
  const m = location.hash.match(/code=([0-9A-Za-z-]+)/);
  if (m) {
    history.replaceState(null, '', location.pathname + location.search);
    screen = { name: 'code' };
    render();
    const input = document.getElementById('restore-code');
    apiOK = await apiAvailable();
    if (getCode() && normalizeCode(m[1]) === getCode()) {
      screen = { name: 'home' };
      render();
    } else {
      if (input) input.value = m[1];
      screen = state ? { name: 'code' } : { name: 'welcome', restore: true };
      render();
      await restoreWithCode(m[1]);
    }
  } else {
    render();
    apiOK = await apiAvailable();
  }
  if (getCode()) {
    if (isPending()) await syncNow();
    await pullNow();
  } else if (state && state.log.length) {
    ensureCode();
  }
  await voicesReady();
  if (screen.name !== 'study') render();
}

init();
