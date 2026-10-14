// All writing systems. Japanese, Korean and Hebrew are built; Hindi is listed as coming next.
import { JAPANESE } from './japanese.js';
import { KOREAN } from './korean.js';
import { HEBREW } from './hebrew.js';

export const SCRIPTS = [
  JAPANESE,
  KOREAN,
  HEBREW,
  { id: 'hi', name: 'Hindi', native: 'हिन्दी', htmlLang: 'hi', soon: true, blurb: 'Devanagari vowels, consonants, matras and conjuncts.' },
];
export const BUILT = SCRIPTS.filter((s) => !s.soon);

export const DECKS = BUILT.flatMap((s) => s.decks);
export const deckById = (id) => DECKS.find((d) => d.id === id);
// A study scope is a script id (all its decks) or a single deck id.
export const decksIn = (scope) => (BUILT.find((s) => s.id === scope)?.decks.map((d) => d.id)) || [scope];
export const scriptOf = (scope) => BUILT.find((s) => s.id === scope) || BUILT.find((s) => s.id === deckById(scope)?.script);

for (const s of BUILT) {
  for (const d of s.decks) {
    d.htmlLang ||= s.htmlLang || s.id;
    d.rtl = d.htmlLang === 'he';
  }
}

// Flatten each character deck's items, tagged with their group.
for (const d of DECKS) {
  if (d.kind === 'chars') {
    d.items = d.groups.flatMap((g) => g.items.map((it) => ({ ...it, group: g.id, base: !!g.base })));
    d.byId = Object.fromEntries(d.items.map((it) => [it.id, it]));
    // Longest-first list of characters, for splitting words into learned units.
    d.units = d.items.filter((it) => !it.noProd || it.char.length === 1).map((it) => it.char).sort((a, b) => b.length - a.length);
  } else {
    d.byId = Object.fromEntries(d.items.map((it) => [it.id, it]));
  }
}

// Split a word into the character deck's units (greedy, longest first).
export function splitWord(text, charDeck) {
  const out = [];
  let i = 0;
  while (i < text.length) {
    const unit = charDeck.units.find((u) => text.startsWith(u, i));
    if (!unit) return null;
    out.push(unit);
    i += unit.length;
  }
  return out;
}

// Ids of the character-deck items a word needs before it can be studied.
export function wordNeeds(wordDeck, text) {
  if (wordDeck.needsOf) return wordDeck.needsOf(text);
  const charDeck = deckById(wordDeck.requires);
  const units = splitWord(text, charDeck);
  return units ? units.map((u) => charDeck.items.find((it) => it.char === u)?.id) : null;
}

// How many characters (or blocks) a word has, for answer-time allowances.
export function wordUnitCount(wordDeck, text) {
  if (wordDeck.unitCount) return wordDeck.unitCount(text);
  return (splitWord(text, deckById(wordDeck.requires)) || [text]).length;
}

// A word split into units with their romanization, for the answer side of a word card.
export function wordBreakdown(wordDeck, text) {
  if (wordDeck.breakdown) return wordDeck.breakdown(text);
  const charDeck = deckById(wordDeck.requires);
  return (splitWord(text, charDeck) || []).map((u) => ({ ch: u, r: charDeck.items.find((it) => it.char === u)?.romaji || '' }));
}
