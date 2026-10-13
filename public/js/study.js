// Which cards exist, which are unlocked, and what to show next in a study session.
//
// Every character has a recognition card (see it, recall the sound) and a production card
// (hear or read the sound, produce the character). A production card unlocks once its
// recognition card has graduated and then been remembered at a later spaced review. Word decks unlock once a script's 46 base
// characters have graduated, and each word appears once all of its characters have.

import { NEW, LEARNING, REVIEW, RELEARNING, dayKey, dayStart, DAY } from './fsrs.js';
import { DECKS, deckById, splitWord } from './scripts/index.js';

const LEARN_AHEAD = 20 * 60 * 1000;

export const cardId = (deckId, itemId, dir) => `${deckId}:${itemId}:${dir}`;
export function parseId(id) {
  const [deckId, itemId, dir] = id.split(':');
  const deck = deckById(deckId);
  return { deck, item: deck?.byId[itemId], dir };
}

const graduated = (c) => !!c && (c.st === REVIEW || c.st === RELEARNING);

export function recognized(state, deckId, itemId) {
  return graduated(state.cards[cardId(deckId, itemId, 'r')]);
}

// Recognized reliably: graduated and then remembered at a spaced review on a later day.
export function solid(state, deckId, itemId) {
  const c = state.cards[cardId(deckId, itemId, 'r')];
  return !!c && c.st === REVIEW && c.reps >= 3;
}

export function wordsUnlocked(state, wordDeck) {
  const base = deckById(wordDeck.requires);
  return base.items.filter((it) => it.base).every((it) => recognized(state, base.id, it.id));
}

export function baseProgress(state, deck) {
  const base = deck.items.filter((it) => it.base);
  return { done: base.filter((it) => recognized(state, deck.id, it.id)).length, total: base.length };
}

function wordReady(state, wordDeck, word) {
  const charDeck = deckById(wordDeck.requires);
  const units = splitWord(word.text, charDeck);
  if (!units) return false;
  return units.every((u) => {
    const item = charDeck.items.find((it) => it.char === u);
    return item && recognized(state, charDeck.id, item.id);
  });
}

// All cards in a deck, in teaching order: { id, dir, item }.
export function deckCards(deck) {
  const out = [];
  for (const item of deck.items) {
    out.push({ id: cardId(deck.id, item.id, 'r'), dir: 'r', item });
    if (deck.kind === 'chars' && !item.noProd) out.push({ id: cardId(deck.id, item.id, 'p'), dir: 'p', item });
  }
  return out;
}

export function deckLocked(state, deck) {
  return deck.kind === 'words' && !wordsUnlocked(state, deck);
}

// Is this (not yet started) card allowed to be introduced?
function introducible(state, deck, card) {
  if (card.dir === 'p') return solid(state, deck.id, card.item.id);
  if (deck.kind === 'words') return wordReady(state, deck, card.item);
  return true;
}

const newKey = (deckId, dir) => `${deckId}:${dir === 'p' ? 'pnew' : 'new'}`;

export function newLeftToday(state, deck, dir, now) {
  if (state.settings.paused?.[deck.id]) return 0;
  const used = state.daily[dayKey(now)]?.[newKey(deck.id, dir)] || 0;
  return Math.max(0, state.settings.newPerDay - used);
}

// Counts for one deck at time `now`.
export function deckCounts(state, deck, now, quiet = state.settings.quiet) {
  if (deckLocked(state, deck)) return { locked: true, review: 0, learning: 0, fresh: 0, learned: 0, total: deck.items.length };
  let review = 0, learning = 0, learned = 0, total = 0;
  const freshR = [], freshP = [];
  for (const c of deckCards(deck)) {
    if (quiet && c.dir === 'p') continue;
    const card = state.cards[c.id];
    if (c.dir === 'r') {
      total++;
      if (graduated(card)) learned++;
    }
    if (!card || card.st === NEW) {
      if (introducible(state, deck, c)) (c.dir === 'p' ? freshP : freshR).push(c.id);
    } else if (card.st === REVIEW) {
      if (card.due <= now) review++;
    } else if (card.due <= now + LEARN_AHEAD) learning++;
  }
  const fresh = Math.min(freshR.length, newLeftToday(state, deck, 'r', now)) + Math.min(freshP.length, newLeftToday(state, deck, 'p', now));
  return { locked: false, review, learning, fresh, learned, total };
}

// When is the next card due after today, for the "come back" message.
export function nextDue(state, decks, now) {
  let best = Infinity;
  for (const deck of decks) {
    for (const c of deckCards(deck)) {
      const card = state.cards[c.id];
      if (card && card.st !== NEW && card.due > now) best = Math.min(best, card.due);
    }
  }
  return best === Infinity ? null : best;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// A study session over one or more decks. Queues are fixed at the start, except learning
// cards, which are read live from the state so they come back after their short steps.
export class Session {
  constructor(state, deckIds, now, { quiet = false } = {}) {
    this.deckIds = deckIds;
    this.quiet = quiet;
    this.reviews = [];
    this.fresh = [];
    this.lastId = null;
    this.sinceNew = 0;
    this.done = 0;
    for (const deck of deckIds.map(deckById)) {
      if (deckLocked(state, deck)) continue;
      const freshR = [], freshP = [];
      for (const c of deckCards(deck)) {
        if (quiet && c.dir === 'p') continue;
        const card = state.cards[c.id];
        if (!card || card.st === NEW) {
          if (introducible(state, deck, c)) (c.dir === 'p' ? freshP : freshR).push(c.id);
        } else if (card.st === REVIEW && card.due <= now) this.reviews.push(c.id);
      }
      // New production cards are mixed in with new recognition cards.
      const r = freshR.slice(0, newLeftToday(state, deck, 'r', now));
      const p = freshP.slice(0, newLeftToday(state, deck, 'p', now));
      const mixed = [];
      while (r.length || p.length) {
        if (r.length) mixed.push(r.shift());
        if (r.length) mixed.push(r.shift());
        if (p.length) mixed.push(p.shift());
      }
      this.fresh.push(...mixed);
    }
    shuffle(this.reviews);
  }

  learningIds(state) {
    const out = [];
    for (const deckId of this.deckIds) {
      const deck = deckById(deckId);
      for (const c of deckCards(deck)) {
        if (this.quiet && c.dir === 'p') continue;
        const card = state.cards[c.id];
        if (card && (card.st === LEARNING || card.st === RELEARNING)) out.push({ id: c.id, due: card.due });
      }
    }
    return out.sort((a, b) => a.due - b.due);
  }

  counts(state, now) {
    const learning = this.learningIds(state).filter((l) => l.due <= now + LEARN_AHEAD).length;
    return { fresh: this.fresh.length, learning, review: this.reviews.length };
  }

  // Pick the next card id, or null when the session is finished.
  next(state, now) {
    const learning = this.learningIds(state);
    const pickLearning = (limit) => {
      const ready = learning.filter((l) => l.due <= limit);
      if (!ready.length) return null;
      const other = ready.find((l) => l.id !== this.lastId);
      // Don't show the card just answered again if anything else is waiting.
      if (ready[0].id === this.lastId && (other || this.fresh.length || this.reviews.length)) return other ? other.id : null;
      return ready[0].id;
    };
    const due = pickLearning(now);
    if (due) return due;
    // Drop reviews that another device already did.
    this.reviews = this.reviews.filter((id) => state.cards[id]?.st === REVIEW && state.cards[id].due <= now);
    this.fresh = this.fresh.filter((id) => !state.cards[id] || state.cards[id].st === NEW);
    const takeNew = this.fresh.length && (!this.reviews.length || this.sinceNew >= 3);
    if (takeNew) return this.fresh[0];
    if (this.reviews.length) return this.reviews[0];
    return pickLearning(now + LEARN_AHEAD) || (learning[0] && learning[0].due <= now + LEARN_AHEAD ? learning[0].id : null);
  }

  answered(id) {
    this.done++;
    this.lastId = id;
    if (this.fresh[0] === id) {
      this.fresh.shift();
      this.sinceNew = 0;
    } else {
      this.reviews = this.reviews.filter((x) => x !== id);
      this.fresh = this.fresh.filter((x) => x !== id);
      this.sinceNew++;
    }
  }

  snapshot() {
    return { reviews: [...this.reviews], fresh: [...this.fresh], lastId: this.lastId, sinceNew: this.sinceNew, done: this.done };
  }
  restore(s) {
    Object.assign(this, { ...s, reviews: [...s.reviews], fresh: [...s.fresh] });
  }
}

export function allDecks() {
  return DECKS;
}

// Status of a character for the browse grid: new | learning | learned | strong.
export function itemStatus(state, deck, item) {
  const card = state.cards[cardId(deck.id, item.id, 'r')];
  if (!card || card.st === NEW) return 'new';
  if (card.st === LEARNING) return 'learning';
  if (card.st === RELEARNING) return 'learning';
  return card.s >= 21 ? 'strong' : 'learned';
}

export { dayStart, DAY };
