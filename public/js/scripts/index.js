// All writing systems. Japanese is built; the others are listed as coming next.
import { JAPANESE } from './japanese.js';

export const SCRIPTS = [
  JAPANESE,
  { id: 'ko', name: 'Korean', native: '한국어', soon: true, blurb: 'Hangul letters, then syllable blocks.' },
  { id: 'he', name: 'Hebrew', native: 'עברית', soon: true, blurb: 'Print letters and vowel points, then cursive.' },
  { id: 'hi', name: 'Hindi', native: 'हिन्दी', soon: true, blurb: 'Devanagari vowels, consonants, matras and conjuncts.' },
];

export const DECKS = SCRIPTS.flatMap((s) => s.decks || []);
export const deckById = (id) => DECKS.find((d) => d.id === id);

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
