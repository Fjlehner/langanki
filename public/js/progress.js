// The overview's progress panels: what's learned, what's weak, and what's coming next.

import { NEW, REVIEW, RELEARNING, LEARNING } from './fsrs.js';
import { deckById, splitWord } from './scripts/index.js';
import { cardId, deckCards, deckLocked, lockedBy, baseProgress, introducible, recognized, nextDue, TIMING } from './study.js';

const MONTH = 30 * 24 * 3600 * 1000;
const label = (deck, item) => (deck.kind === 'words' ? item.text : item.char);

// Learned characters and words per deck (recognition card graduated), strong once stable for 3+ weeks.
export function learnedByDeck(state, decks) {
  const out = [];
  for (const deck of decks) {
    const items = [];
    let writing = 0;
    for (const item of deck.items) {
      const r = state.cards[cardId(deck.id, item.id, 'r')];
      if (!recognized(state, deck.id, item.id)) continue;
      items.push({ label: label(deck, item), romaji: item.romaji, status: r.s >= 21 ? 'strong' : 'learned' });
      const p = state.cards[cardId(deck.id, item.id, 'p')];
      if (p && (p.st === REVIEW || p.st === RELEARNING)) writing++;
    }
    if (items.length) out.push({ deck, items, total: deck.items.length, writing });
  }
  return out;
}

// Characters missed most, forgotten after being learned, or read slowly, worst first.
export function weakSpots(state, decks, now, limit = 6) {
  const byCard = {};
  for (const e of state.log) {
    if (now - e.at > MONTH) continue;
    (byCard[e.id] ||= []).push(e);
  }
  const rows = [];
  for (const deck of decks) {
    if (deckLocked(state, deck)) continue;
    for (const item of deck.items) {
      const ids = ['r', 'p'].map((d) => cardId(deck.id, item.id, d)).filter((id) => state.cards[id] && state.cards[id].st !== NEW);
      if (!ids.length) continue;
      let misses = 0, lapses = 0, relearning = false;
      const times = [];
      for (const id of ids) {
        const c = state.cards[id];
        lapses += c.lapses || 0;
        if (c.st === RELEARNING || (c.st === LEARNING && c.lapses)) relearning = true;
        const entries = (byCard[id] || []).sort((a, b) => a.at - b.at);
        const first = entries[0]?.at || 0;
        for (const e of entries) {
          // Misses in the first hour of learning a card are expected, so they don't count.
          if (e.g === 1 && e.at - first > 3600 * 1000) misses++;
          if (id.endsWith(':r') && e.g > 1 && e.ms) times.push(e.ms);
        }
      }
      const recent = times.slice(-5);
      const avg = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
      const units = deck.kind === 'words' ? (splitWord(item.text, deckById(deck.requires)) || [1]).length : 1;
      const slow = recent.length >= 2 && avg > TIMING.r.good + (units - 1) * TIMING.r.perExtra;
      const score = misses + lapses * 1.5 + (relearning ? 2 : 0) + (slow ? 1.5 : 0);
      if (score < 1) continue;
      const why = [
        relearning ? 'relearning' : '',
        misses ? `missed ${misses}×` : lapses ? `forgotten ${lapses}×` : '',
        slow ? `slow (${(avg / 1000).toFixed(1)} s)` : '',
      ].filter(Boolean).join(' · ');
      rows.push({ label: label(deck, item), romaji: item.romaji, why, score, cardIds: ids });
    }
  }
  return rows.sort((a, b) => b.score - a.score).slice(0, limit);
}

// The next new characters each open deck will introduce, unlock milestones, and the next due review.
export function upNext(state, decks, now, perDeck = 10) {
  const fresh = [];
  const milestones = new Map();
  for (const deck of decks) {
    if (deckLocked(state, deck)) {
      const base = lockedBy(deck);
      const p = baseProgress(state, base);
      const m = milestones.get(base.id) || { names: [], done: p.done, total: p.total };
      m.names.push(deck.name.toLowerCase());
      milestones.set(base.id, m);
      continue;
    }
    if (state.settings.paused?.[deck.id]) continue;
    const items = [];
    const groups = [];
    for (const c of deckCards(deck)) {
      if (c.dir !== 'r' || items.length >= (deck.kind === 'words' ? 5 : perDeck)) continue;
      const card = state.cards[c.id];
      if ((card && card.st !== NEW) || !introducible(state, deck, c)) continue;
      items.push({ char: label(deck, c.item), romaji: c.item.romaji });
      const g = deck.groups?.find((gr) => gr.id === c.item.group);
      if (g && !groups.includes(g.name)) groups.push(g.name);
    }
    if (items.length) fresh.push({ deck, items, groups });
  }
  const list = (names) => (names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0]);
  return {
    fresh,
    milestones: [...milestones.entries()].map(([baseId, m]) => ({
      base: deckById(baseId).name.toLowerCase(),
      unlocks: list(m.names),
      done: m.done,
      total: m.total,
    })),
    due: nextDue(state, decks.filter((d) => !deckLocked(state, d)), now),
  };
}
