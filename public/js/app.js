import { SCRIPTS, DECKS, deckById, splitWord } from './scripts/index.js';
import { schedule, preview, formatWait, newCard, NEW, dayKey, DAY } from './fsrs.js';
import { load, save, freshState, normalize, storageAvailable, bumpDaily, addLog, clearLocal } from './store.js';
import { Session, parseId, deckCounts, deckLocked, baseProgress, itemStatus, nextDue, cardId } from './study.js';
import { canSpeak, speak, stopSpeaking, onVoices, voicesReady } from './speech.js';
import { isMobileDevice, now } from './device.js';
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
const JA_DECKS = DECKS.filter((d) => d.script === 'ja').map((d) => d.id);

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
    <p class="lede">LangAnki is a flashcard course for scripts: Japanese hiragana and katakana first, with Korean, Hebrew and Hindi to follow. It shows each character when you’re about to forget it, and explains every sound with IPA and comparisons to English and Spanish.</p>
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

function totals(t = now()) {
  let review = 0, fresh = 0, learning = 0;
  for (const id of JA_DECKS) {
    const c = deckCounts(state, deckById(id), t);
    review += c.review;
    fresh += c.fresh;
    learning += c.learning;
  }
  return { review, fresh, learning };
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
    const base = deckById(deck.requires);
    const p = baseProgress(state, base);
    return `<article class="deck deck--locked">
      <div class="deck__head"><h3>${esc(deck.name)}</h3><span class="deck__native" lang="ja">${esc(deck.native)}</span></div>
      <p class="muted">${esc(deck.blurb)}</p>
      <p class="deck__lock">Unlocks when you’ve learned all ${p.total} basic ${esc(base.name.toLowerCase())}: ${p.done} of ${p.total} so far.</p>
      <div class="bar" aria-hidden="true"><span style="width:${(p.done / p.total) * 100}%"></span></div>
    </article>`;
  }
  const paused = state.settings.paused?.[deck.id];
  const due = c.review + c.learning;
  return `<article class="deck">
    <div class="deck__head"><h3>${esc(deck.name)}</h3><span class="deck__native" lang="ja">${esc(deck.native)}</span></div>
    <p class="muted">${esc(deck.blurb)}</p>
    <dl class="counts">
      <div><dt>To review</dt><dd class="c-review">${due}</dd></div>
      <div><dt>New today</dt><dd class="c-new">${c.fresh}${paused ? ' <small>(paused)</small>' : ''}</dd></div>
      <div><dt>Learned</dt><dd>${c.learned}<small> of ${c.total}</small></dd></div>
    </dl>
    <div class="bar" aria-hidden="true"><span style="width:${(c.learned / c.total) * 100}%"></span></div>
    <div class="deck__actions">
      <button class="btn ${due + c.fresh ? 'btn--primary' : ''}" data-study="${deck.id}" ${due + c.fresh ? '' : 'disabled'}>Study</button>
      ${deck.kind === 'chars' ? `<button class="btn" data-browse="${deck.id}">Characters</button>` : `<button class="btn" data-browse="${deck.id}">Words</button>`}
    </div>
  </article>`;
}

function homeHTML() {
  const t = now();
  const tot = totals(t);
  const dueAll = tot.review + tot.learning;
  const anything = dueAll + tot.fresh;
  const ja = SCRIPTS[0];
  const msg = flash;
  flash = '';
  return `${msg ? `<p class="flash" role="status">${esc(msg)}</p>` : ''}
  ${codeBanner()}
  <section class="today">
    <div>
      <h1 tabindex="-1">${anything ? 'Today' : 'All caught up'}</h1>
      <p class="today__line">${anything ? `${plural(dueAll, 'card')} to review and ${plural(tot.fresh, 'new card')}.` : nextDueLine(t)}</p>
    </div>
    <button class="btn btn--primary btn--big" data-study="all" ${anything ? '' : 'disabled'}>Study now</button>
    ${quietSwitch()}
  </section>
  <section class="script" aria-labelledby="ja-h">
    <div class="script__head"><h2 id="ja-h">${esc(ja.name)}</h2><span class="script__native" lang="ja">${esc(ja.native)}</span></div>
    <p class="tip">${esc(ja.intro)}</p>
    <div class="decks">${ja.decks.map((d) => deckCardHTML(d, t)).join('')}</div>
  </section>
  <section class="script" aria-labelledby="soon-h">
    <div class="script__head"><h2 id="soon-h">Coming next</h2></div>
    <div class="soon">${SCRIPTS.filter((s) => s.soon).map((s) => `<div class="soon__item"><span class="soon__native" lang="${s.id}">${esc(s.native)}</span><div><strong>${esc(s.name)}</strong><p class="muted">${esc(s.blurb)}</p></div></div>`).join('')}</div>
  </section>`;
}

function nextDueLine(t) {
  const next = nextDue(state, JA_DECKS.map(deckById), t);
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

function startStudy(which) {
  const ids = which === 'all' ? JA_DECKS : [which];
  session = new Session(state, ids, now(), { quiet: state.settings.quiet });
  session.label = which === 'all' ? 'Japanese' : deckById(which).name;
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
    front = `<div class="${glyphClass()} glyph--word" lang="ja">${esc(item.text)}</div>`;
    if (view.revealed) back = wordBackHTML(deck, item, sound);
  } else if (dir === 'r') {
    front = `<div class="${glyphClass()}" lang="ja">${esc(item.char)}</div>`;
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
  } else {
    const waits = preview(card, t, schedOpts(view.id)).map(formatWait);
    actions = `<div class="grades" role="group" aria-label="How well did you remember?">
      ${['Again', 'Hard', 'Good', 'Easy'].map((g, i) => `<button class="grade grade--${i + 1}" data-grade="${i + 1}" ${i === 2 ? 'data-autofocus' : ''}><span>${g}</span><small>${waits[i]}</small><kbd>${i + 1}</kbd></button>`).join('')}
    </div>`;
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
    ${guideHTML(item, { open })}`;
}

function wordBackHTML(deck, item, sound) {
  const charDeck = deckById(deck.requires);
  const units = splitWord(item.text, charDeck) || [];
  const parts = units.map((u) => {
    const it = charDeck.items.find((x) => x.char === u);
    return `<span class="unit"><span class="unit__ch" lang="ja">${esc(u)}</span><span class="unit__r">${esc(it?.romaji || '')}</span></span>`;
  }).join('');
  return `<div class="answer">
      <div class="answer__romaji">${esc(item.romaji)}</div>
      ${sound ? soundButton(item.say, deck.lang) : ''}
    </div>
    <dl class="meaning"><div><dt>English</dt><dd>${esc(item.en)}</dd></div><div><dt>Español</dt><dd lang="es">${esc(item.es)}</dd></div></dl>
    <div class="units" aria-label="Characters">${parts}</div>`;
}

function productionFrontHTML(deck, item, sound) {
  if (view.revealed) {
    return `<div class="prompt prompt--done"><div class="prompt__romaji">${esc(item.romaji)}</div></div>`;
  }
  return `<div class="prompt">
    <p class="prompt__ask">Write this in <strong>${esc(deck.name.toLowerCase())}</strong></p>
    <div class="prompt__romaji">${esc(item.romaji)}</div>
    ${item.hint ? `<p class="prompt__hint">${esc(item.hint)}</p>` : ''}
    <div class="prompt__sound"><span class="answer__ipa">[${esc(item.ipa)}]</span>${sound ? soundButton(item.say, deck.lang) : ''}</div>
    <form class="typed" id="typed-form" autocomplete="off">
      <label class="sr-only" for="typed">Your answer</label>
      <input id="typed" class="typed__input glyph--${state.settings.kanaStyle}" lang="ja" value="${esc(view.typed)}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" data-autofocus>
    </form>
    ${mobile ? `<p class="muted small">Use your ${deck.lang.startsWith('ja') ? 'Japanese kana' : ''} keyboard.</p>` : ''}
  </div>`;
}

function productionResultHTML(deck, item) {
  const typed = view.typed.trim();
  if (view.correct) return `<p class="result result--ok"><span aria-hidden="true">✓</span> Correct</p><div class="${glyphClass()}" lang="ja">${esc(item.char)}</div>`;
  const wrongScript = typed && toOtherScript(typed) === item.char;
  const msg = !typed ? 'The answer is' : wrongScript ? `Right sound, other script. You wrote ${esc(typed)}; in ${esc(deck.name.toLowerCase())} it’s` : `You wrote <span lang="ja">${esc(typed)}</span>. The answer is`;
  return `<p class="result result--err"><span aria-hidden="true">✗</span> ${msg}</p><div class="${glyphClass()}" lang="ja">${esc(item.char)}</div>`;
}

const toOtherScript = (s) => s.replace(/[ぁ-ゖァ-ヶ]/g, (ch) => {
  const c = ch.charCodeAt(0);
  return String.fromCharCode(c < 0x30a0 ? c + 0x60 : c - 0x60);
});

// Laid out like a kana table: each consonant row is a column, vowels run down.
function kanaKeyboardHTML(deck) {
  const key = (ch) => (ch === ' ' || !ch ? '<span class="kb__gap"></span>' : `<button type="button" class="kb__key" data-key="${ch}" lang="ja">${ch}</button>`);
  const table = (rows) => `<div class="kb__table" style="--cols:${rows.length}">${[0, 1, 2, 3, 4].map((v) => rows.map((r) => key([...r][v])).join('')).join('')}</div>`;
  const rows = deck.keyboard;
  const extras = rows.slice(15).join('').replace(/ /g, '');
  return `<div class="kb" aria-label="On-screen ${esc(deck.name)} keyboard">
    <div class="kb__tables">${table(rows.slice(0, 10))}${table(rows.slice(10, 15))}</div>
    <div class="kb__extras">${[...extras].map(key).join('')}
      <button type="button" class="kb__key kb__key--wide" data-key="back">⌫ Delete</button><button type="button" class="kb__key kb__key--wide" data-key="clear">Clear</button></div>
  </div>`;
}

function guideHTML(item, { open = false } = {}) {
  const kinds = { consonant: 'Consonant', vowel: 'Vowel', glide: 'Glide' };
  const parts = item.parts.map((p) => `<li class="part part--${p.kind}">
      <div class="part__head"><span class="part__sym">${esc(p.sym)}</span><span class="part__kind">${kinds[p.kind]}</span><span class="part__ipa">/${esc(p.ipa)}/</span></div>
      <p class="part__type">${esc(p.type)}. ${esc(p.how)}</p>
      <p class="cmp"><span class="cmp__lang">EN</span> ${esc(p.en)}</p>
      <p class="cmp"><span class="cmp__lang">ES</span> ${esc(p.es)}</p>
    </li>`).join('');
  const notes = item.notes?.length ? `<ul class="notes">${item.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : '';
  return `<details class="guide" ${open ? 'open' : ''}><summary>How to say it</summary><ol class="parts">${parts}</ol>${notes}</details>`;
}

function schedOpts(id) {
  return { retention: state.settings.retention, id };
}

function reveal() {
  if (view.revealed) return;
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
  undoStack.push({ id, prev: prev ? { ...prev } : null, daily: JSON.stringify(state.daily[day] || null), day, logLen: state.log.length, session: session.snapshot(), view: { ...view, revealed: false, correct: null, override: false, typed: '' } });
  if (undoStack.length > 10) undoStack.shift();
  const card = prev || newCard();
  const { deck, dir } = parseId(id);
  if (card.st === NEW) bumpDaily(state, day, `${deck.id}:${dir === 'p' ? 'pnew' : 'new'}`);
  bumpDaily(state, day, 'reviews');
  state.cards[id] = schedule(card, g, t, schedOpts(id));
  addLog(state, { at: t, id, g });
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
  const decks = screen.scope === 'all' ? JA_DECKS.map(deckById) : [deckById(screen.scope)];
  const next = nextDue(state, decks, t);
  const tot = totals(t);
  const more = tot.review + tot.learning + tot.fresh;
  return `<section class="narrow finished">
    <h1 tabindex="-1">${screen.done ? 'Done for now' : 'Nothing to study'}</h1>
    <p class="lede">${screen.done ? `You answered ${plural(screen.done, 'card')}.` : 'There are no cards due here.'} ${next ? `The next card comes back ${whenText(next, t)}.` : ''}</p>
    ${state.settings.quiet ? '<p class="muted">Quiet mode is on, so writing cards were skipped. Turn it off when you can use sound to practice writing too.</p>' : ''}
    <div class="actions">
      <button class="btn btn--primary" data-go="home">Back to overview</button>
      ${more ? `<button class="btn" data-study="all">Keep studying (${more})</button>` : ''}
    </div>
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
        return `<button class="tile tile--${st}" data-guide="${it.id}" aria-label="${esc(it.char)}, ${esc(it.romaji)}, ${st}"><span class="tile__ch ${glyphClass()}" lang="ja">${esc(it.char)}</span><span class="tile__r">${esc(it.romaji)}</span></button>`;
      }).join('')}</div>
    </section>`).join('');
  return `<div class="browse">
    <button class="link back" data-go="home">← Overview</button>
    <div class="script__head"><h1 tabindex="-1">${esc(deck.name)}</h1><span class="script__native" lang="ja">${esc(deck.native)}</span></div>
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
    return `<li class="word ${seen ? '' : 'word--unseen'}"><span class="word__text ${glyphClass()}" lang="ja">${esc(w.text)}</span><span class="word__r">${seen ? esc(w.romaji) : ''}</span><span class="word__m">${seen ? `${esc(w.en)} · <span lang="es">${esc(w.es)}</span>` : '<span class="muted">Not studied yet</span>'}</span></li>`;
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
      <div class="${glyphClass()}" lang="ja">${esc(item.char)}</div>
      <div class="answer"><div class="answer__romaji">${esc(item.romaji)}</div><div class="answer__ipa">[${esc(item.ipa)}]</div>${sound ? soundButton(item.say, deck.lang) : ''}</div>
    </div>
    ${guideHTML(item, { open: true })}
    <nav class="pager" aria-label="Other characters">
      ${prev ? `<button class="btn" data-guide="${prev.id}">← <span lang="ja">${esc(prev.char)}</span></button>` : '<span></span>'}
      ${nextItem ? `<button class="btn" data-guide="${nextItem.id}"><span lang="ja">${esc(nextItem.char)}</span> →</button>` : '<span></span>'}
    </nav>
  </div>`;
}

// ---------- settings ----------

function settingsHTML() {
  const s = state.settings;
  const voice = canSpeak('ja-JP');
  const msg = flash;
  flash = '';
  const decks = JA_DECKS.map(deckById);
  return `<div class="settings">
    <button class="link back" data-go="home">← Overview</button>
    <h1 tabindex="-1">Settings</h1>
    ${msg ? `<p class="flash" role="status">${esc(msg)}</p>` : ''}
    <section class="panel">
      <h2>Studying</h2>
      <div class="field">
        <label for="newPerDay">New cards per day, per script</label>
        <div class="stepper"><button class="btn btn--small" data-step="-1" aria-label="Fewer">−</button><input id="newPerDay" type="number" inputmode="numeric" min="0" max="50" value="${s.newPerDay}" data-setting="newPerDay"><button class="btn btn--small" data-step="1" aria-label="More">+</button></div>
        <p class="help">Hiragana and katakana each get this many. Writing cards have their own allowance of the same size.</p>
      </div>
      <div class="field">
        <label for="retention">How much to remember</label>
        <select id="retention" data-setting="retention">
          ${[[0.85, '85%: fewer reviews'], [0.9, '90%: recommended'], [0.95, '95%: more reviews']].map(([v, l]) => `<option value="${v}" ${s.retention === v ? 'selected' : ''}>${l}</option>`).join('')}
        </select>
        <p class="help">The scheduler times each review for this chance of remembering.</p>
      </div>
      <fieldset class="field">
        <legend>Pause new cards</legend>
        ${decks.map((d) => `<label class="check"><input type="checkbox" data-pause="${d.id}" ${s.paused?.[d.id] ? 'checked' : ''}> ${esc(d.name)}</label>`).join('')}
        <p class="help">Reviews continue for paused decks.</p>
      </fieldset>
    </section>
    <section class="panel">
      <h2>Sound and display</h2>
      ${quietSwitch('quiet-s')}
      <label class="switch" for="autoplay"><input type="checkbox" id="autoplay" data-setting="autoplay" ${s.autoplay ? 'checked' : ''}><span class="switch__track" aria-hidden="true"></span><span class="switch__text"><strong>Play the sound automatically</strong> <span class="muted">When the answer shows</span></span></label>
      <p class="help">${voice ? 'This device has a Japanese voice.' : 'This device has no Japanese voice, so play buttons are hidden. On iPhone, add one under Settings › Accessibility › Spoken Content › Voices.'}</p>
      <fieldset class="field">
        <legend>Character style</legend>
        <div class="choices">
          <label class="choice"><input type="radio" name="kanaStyle" value="textbook" ${s.kanaStyle === 'textbook' ? 'checked' : ''} data-setting="kanaStyle"><span class="glyph--textbook" lang="ja">さきり</span> Textbook</label>
          <label class="choice"><input type="radio" name="kanaStyle" value="print" ${s.kanaStyle === 'print' ? 'checked' : ''} data-setting="kanaStyle"><span class="glyph--print" lang="ja">さきり</span> Print</label>
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
    case 'reveal':
      return reveal();
    case 'check':
      return checkTyped();
    case 'give-up':
      return checkTyped(true);
    case 'override':
      view.override = true;
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
  session = Object.assign(new Session(state, session.deckIds, now(), { quiet: state.settings.quiet }), { label: session.label, scope: session.scope });
  session.done = done;
  undoStack = [];
  if (state.settings.quiet && view && parseId(view.id).dir === 'p') return nextCard();
  render();
}

function keyPress(key) {
  const input = document.getElementById('typed');
  if (!input) return;
  if (key === 'back') input.value = [...input.value].slice(0, -1).join('');
  else if (key === 'clear') input.value = '';
  else input.value += key;
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
