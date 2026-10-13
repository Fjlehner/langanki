// Japanese: hiragana and katakana decks, their word decks, and the pronunciation guide data.
// Each kana's guide is built from a consonant part and a vowel part, so the sound
// descriptions live in one place (C and V below) and every kana shows its own mapping.

// ---------- sound parts ----------

// Consonants. `ipa` is the sound; `type` says how it's classified; `how` says how to make it.
const C = {
  k: { sym: 'k', ipa: 'k', type: 'Voiceless velar stop', how: 'The back of the tongue stops the air at the soft palate, then lets go.', en: '“k” in “skin”, with no puff of air after it', es: '“c” in “casa”: the same sound' },
  g: { sym: 'g', ipa: 'ɡ', type: 'Voiced velar stop', how: 'Like k, with the voice on.', en: '“g” in “go”', es: '“g” in “gato”. Keep it hard between vowels, unlike the soft g in “lago”' },
  s: { sym: 's', ipa: 's', type: 'Voiceless alveolar fricative', how: 'The tongue tip sits near the ridge behind the top teeth and the air hisses through.', en: '“s” in “see”', es: '“s” in “sí”: the same sound' },
  sh: { sym: 'sh', ipa: 'ɕ', type: 'Voiceless alveolo-palatal fricative', how: 'The middle of the tongue rises toward the roof of the mouth. The lips stay relaxed.', en: 'Between “sh” in “she” and “s” in “see”. Don’t push the lips out', es: 'No standard Spanish match. Close to the Rioplatense “sh” in “yo” (“sho”), with a flatter tongue' },
  z: { sym: 'z', ipa: 'dz', type: 'Voiced alveolar affricate (or fricative)', how: 'Like s with the voice on. At the start of a word it begins with a light d; in the middle it’s usually a plain z.', en: '“ds” in “kids” at the start of a word, “z” in “zoo” in the middle', es: 'Most Spanish has no z sound. It’s the voiced s in “mismo” or “desde”' },
  j: { sym: 'j', ipa: 'dʑ', type: 'Voiced alveolo-palatal affricate', how: 'A light d that slides into the Japanese sh sound, with the voice on.', en: '“j” in “jeep”, softer and with relaxed lips', es: 'Close to an emphatic “y” in “¡yo!” or a strong “ll” in “llama”, as many dialects say them' },
  t: { sym: 't', ipa: 't', type: 'Voiceless dental stop', how: 'The tongue tip touches the back of the top teeth, then releases.', en: '“t” in “stop”: tongue on the teeth, no puff of air', es: '“t” in “tú”: the same sound' },
  d: { sym: 'd', ipa: 'd', type: 'Voiced dental stop', how: 'Like t, with the voice on.', en: '“d” in “do”, with the tongue on the teeth', es: '“d” in “dos”. Keep it a full d between vowels, unlike the soft d in “nada”' },
  ch: { sym: 'ch', ipa: 'tɕ', type: 'Voiceless alveolo-palatal affricate', how: 'A light t that slides into the Japanese sh sound.', en: '“ch” in “cheese”, softer and with relaxed lips', es: '“ch” in “chico”: very close' },
  ts: { sym: 'ts', ipa: 'ts', type: 'Voiceless alveolar affricate', how: 'A t that releases straight into an s.', en: '“ts” in “cats”, but at the start of the syllable', es: 'No native Spanish sound. Like “ts” in “tsunami” or “zz” in Italian “pizza”' },
  n: { sym: 'n', ipa: 'n', type: 'Alveolar nasal', how: 'The tongue tip rests on the ridge behind the teeth and the air goes through the nose.', en: '“n” in “no”', es: '“n” in “no”: the same sound' },
  ny: { sym: 'n', ipa: 'ɲ', type: 'Palatal nasal', how: 'The middle of the tongue presses the roof of the mouth and the air goes through the nose.', en: '“ny” in “canyon”', es: '“ñ” in “niño”: the same sound' },
  h: { sym: 'h', ipa: 'h', type: 'Voiceless glottal fricative', how: 'Air breathed out from the throat.', en: '“h” in “hot”', es: 'Much softer than the “j” in “jota”. Like the breathy s in Caribbean or Andalusian “lo(h) amigo(h)”' },
  hy: { sym: 'h', ipa: 'ç', type: 'Voiceless palatal fricative', how: 'Air hisses between the middle of the tongue and the roof of the mouth.', en: '“h” in “huge” or “hue”', es: 'A very soft, whispered “j” before i, like German “ich”' },
  f: { sym: 'f', ipa: 'ɸ', type: 'Voiceless bilabial fricative', how: 'Air blown between both lips, as if cooling soup. The top teeth don’t touch the lip.', en: 'Not quite English f. Like blowing out a candle', es: 'No Spanish match. An “f” made with both lips, like a whispered version of the soft b in “haba”' },
  b: { sym: 'b', ipa: 'b', type: 'Voiced bilabial stop', how: 'The lips close, then open with the voice on.', en: '“b” in “bat”', es: '“b” or “v” at the start of a word, as in “bien” or “vino”. Keep it a full b between vowels, unlike “haba”' },
  p: { sym: 'p', ipa: 'p', type: 'Voiceless bilabial stop', how: 'The lips close, then open with no puff of air.', en: '“p” in “spin”, with no puff of air', es: '“p” in “papá”: the same sound' },
  m: { sym: 'm', ipa: 'm', type: 'Bilabial nasal', how: 'The lips close and the air goes through the nose.', en: '“m” in “me”', es: '“m” in “mamá”: the same sound' },
  y: { sym: 'y', ipa: 'j', type: 'Palatal approximant', how: 'The tongue glides from near the roof of the mouth into the vowel.', en: '“y” in “yes”', es: '“i” in “tiene”, or a light “y” in “ya” (not the Buenos Aires “sh”)' },
  r: { sym: 'r', ipa: 'ɾ', type: 'Alveolar tap', how: 'The tongue tip flicks once against the ridge behind the top teeth.', en: 'The quick tap in American “butter” or “ladder”', es: 'The single “r” in “pero” or “cara”: the same sound. Never rolled like “rr”' },
  w: { sym: 'w', ipa: 'w', type: 'Labial-velar approximant', how: 'The lips come close together but are barely rounded.', en: '“w” in “water”, with less lip rounding', es: '“u” in “agua” or “hu” in “huevo”' },
  v: { sym: 'v', ipa: 'b', type: 'Voiced bilabial stop (as most speakers say it)', how: 'Most speakers say a Japanese b. Some imitate an English v.', en: 'Usually “b” in “bat”', es: 'Like Spanish “v”, which is also a b sound' },
};

// Vowels. Four of the five match Spanish exactly.
const V = {
  a: { sym: 'a', ipa: 'a', type: 'Open central unrounded vowel', how: 'Mouth open, tongue low and relaxed.', en: '“a” in “father”, but shorter', es: '“a” in “casa”: the same' },
  i: { sym: 'i', ipa: 'i', type: 'Close front unrounded vowel', how: 'Tongue high and forward, lips spread.', en: '“ee” in “see”, short and with no glide', es: '“i” in “sí”: the same' },
  u: { sym: 'u', ipa: 'ɯ', type: 'Close back vowel, lips compressed', how: 'Tongue high and back. The lips stay relaxed and close together, not pushed out.', en: 'Like “oo” in “food”, but without rounding the lips', es: 'Like “u” in “tú”, but without rounding the lips. The one vowel that differs from Spanish' },
  e: { sym: 'e', ipa: 'e', type: 'Mid front unrounded vowel', how: 'Tongue halfway up and forward.', en: 'Between “e” in “bet” and “ay” in “say”, with no glide', es: '“e” in “mesa”: the same' },
  o: { sym: 'o', ipa: 'o', type: 'Mid back rounded vowel', how: 'Tongue halfway up and back, lips rounded.', en: '“o” in “go”, without the “w” glide at the end', es: '“o” in “solo”: the same' },
};

const GLIDE = {
  sym: 'y', ipa: 'ʲ', type: 'Palatal glide', how: 'The consonant is said with the tongue already raised toward a y, flowing straight into the vowel in one beat.',
  en: 'A quick “y”, as in “cute”, squeezed into one beat', es: 'Like the “i” in “bien”, squeezed into one beat',
};

const U_NOTE = 'The u is often whispered between voiceless consonants and at the end of words: です sounds like “dess”.';

const part = (kind, src) => ({ kind, ...src });

// One mora: consonant key (or null for a bare vowel) + vowel key.
function mora(id, char, cKey, vKey, extra = {}) {
  const c = cKey ? C[cKey] : null;
  const v = V[vKey];
  const glide = !!extra.glide;
  const parts = [];
  if (c) parts.push(part('consonant', c));
  if (glide) parts.push(part('glide', GLIDE));
  parts.push(part('vowel', v));
  const romaji = extra.romaji || (c ? c.sym : '') + (glide ? 'y' : '') + v.sym;
  const ipa = extra.ipa || `${c ? c.ipa : ''}${glide ? 'ʲ' : ''}${v.ipa}`;
  const notes = [...(extra.notes || [])];
  if (vKey === 'u' && !extra.noUNote) notes.push(U_NOTE);
  return { id, char, romaji, ipa, parts, notes, hint: extra.hint || '', say: extra.say || char, noProd: !!extra.noProd };
}

// ---------- hiragana ----------

const ROWS = [
  { id: 'vowels', name: 'Vowels', items: [['a', 'あ', null, 'a'], ['i', 'い', null, 'i'], ['u', 'う', null, 'u'], ['e', 'え', null, 'e'], ['o', 'お', null, 'o', { hint: 'o, the usual one (not the object particle)' }]] },
  { id: 'k', name: 'K row', items: [['ka', 'か', 'k', 'a'], ['ki', 'き', 'k', 'i'], ['ku', 'く', 'k', 'u'], ['ke', 'け', 'k', 'e'], ['ko', 'こ', 'k', 'o']] },
  { id: 's', name: 'S row', items: [['sa', 'さ', 's', 'a'], ['shi', 'し', 'sh', 'i', { notes: ['Written “shi” in romaji: s turns into a soft sh before i.'] }], ['su', 'す', 's', 'u'], ['se', 'せ', 's', 'e'], ['so', 'そ', 's', 'o']] },
  { id: 't', name: 'T row', items: [['ta', 'た', 't', 'a'], ['chi', 'ち', 'ch', 'i', { notes: ['Written “chi” in romaji: t turns into ch before i.'] }], ['tsu', 'つ', 'ts', 'u', { notes: ['Written “tsu” in romaji: t turns into ts before u.'] }], ['te', 'て', 't', 'e'], ['to', 'と', 't', 'o']] },
  { id: 'n', name: 'N row', items: [['na', 'な', 'n', 'a'], ['ni', 'に', 'ny', 'i', { notes: ['Before i the n becomes ñ-like.'] }], ['nu', 'ぬ', 'n', 'u'], ['ne', 'ね', 'n', 'e'], ['no', 'の', 'n', 'o']] },
  { id: 'h', name: 'H row', items: [['ha', 'は', 'h', 'a', { notes: ['Read “wa” when it marks the topic of a sentence, as in わたしは.'] }], ['hi', 'ひ', 'hy', 'i'], ['fu', 'ふ', 'f', 'u', { notes: ['Written “fu” in romaji, but the sound sits between h and f.'] }], ['he', 'へ', 'h', 'e', { notes: ['Read “e” when it marks a direction, as in にほんへ.'] }], ['ho', 'ほ', 'h', 'o']] },
  { id: 'm', name: 'M row', items: [['ma', 'ま', 'm', 'a'], ['mi', 'み', 'm', 'i'], ['mu', 'む', 'm', 'u'], ['me', 'め', 'm', 'e'], ['mo', 'も', 'm', 'o']] },
  { id: 'y', name: 'Y row', items: [['ya', 'や', 'y', 'a'], ['yu', 'ゆ', 'y', 'u'], ['yo', 'よ', 'y', 'o']] },
  { id: 'r', name: 'R row', items: [['ra', 'ら', 'r', 'a'], ['ri', 'り', 'r', 'i'], ['ru', 'る', 'r', 'u'], ['re', 'れ', 'r', 'e'], ['ro', 'ろ', 'r', 'o']] },
  {
    id: 'wn', name: 'W row and n', items: [
      ['wa', 'わ', 'w', 'a'],
      ['wo', 'を', null, 'o', { romaji: 'o (wo)', hint: 'o, the object particle', notes: ['Used almost only as the object particle, as in ほんをよむ. Said “o”, the same as お.'] }],
    ],
  },
];
// ん is added to the last base row separately (it has no vowel).
const VOICED_ROWS = [
  { id: 'g', name: 'G row', items: [['ga', 'が', 'g', 'a'], ['gi', 'ぎ', 'g', 'i'], ['gu', 'ぐ', 'g', 'u'], ['ge', 'げ', 'g', 'e'], ['go', 'ご', 'g', 'o']] },
  { id: 'z', name: 'Z row', items: [['za', 'ざ', 'z', 'a'], ['ji', 'じ', 'j', 'i', { hint: 'ji, the usual one (from し)' }], ['zu', 'ず', 'z', 'u', { hint: 'zu, the usual one (from す)' }], ['ze', 'ぜ', 'z', 'e'], ['zo', 'ぞ', 'z', 'o']] },
  {
    id: 'd', name: 'D row', items: [
      ['da', 'だ', 'd', 'a'],
      ['dji', 'ぢ', 'j', 'i', { romaji: 'ji', hint: 'ji, the rare one (from ち)', notes: ['Sounds the same as じ. Used mainly when ち is voiced in a compound, as in はなぢ (nosebleed).'] }],
      ['dzu', 'づ', 'z', 'u', { romaji: 'zu', hint: 'zu, the rare one (from つ)', notes: ['Sounds the same as ず. Used when つ is voiced, as in つづく (to continue).'] }],
      ['de', 'で', 'd', 'e'], ['do', 'ど', 'd', 'o'],
    ],
  },
  { id: 'b', name: 'B row', items: [['ba', 'ば', 'b', 'a'], ['bi', 'び', 'b', 'i'], ['bu', 'ぶ', 'b', 'u'], ['be', 'べ', 'b', 'e'], ['bo', 'ぼ', 'b', 'o']] },
  { id: 'p', name: 'P row', items: [['pa', 'ぱ', 'p', 'a'], ['pi', 'ぴ', 'p', 'i'], ['pu', 'ぷ', 'p', 'u'], ['pe', 'ぺ', 'p', 'e'], ['po', 'ぽ', 'p', 'o']] },
];

// Combinations: an i-column kana plus a small や, ゆ or よ, said as one beat.
const COMBO_BASES = [
  ['k', 'き', 'k', true], ['sh', 'し', 'sh', false], ['ch', 'ち', 'ch', false], ['n', 'に', 'ny', false], ['h', 'ひ', 'hy', false],
  ['m', 'み', 'm', true], ['r', 'り', 'r', true], ['g', 'ぎ', 'g', true], ['j', 'じ', 'j', false], ['b', 'び', 'b', true], ['p', 'ぴ', 'p', true],
];
const SMALL_Y = [['a', 'ゃ'], ['u', 'ゅ'], ['o', 'ょ']];
const COMBO_ROMAJI = { sh: 'sh', ch: 'ch', j: 'j' };

function comboRows() {
  return COMBO_BASES.map(([key, base, cKey, glide]) => ({
    id: `${key}y`,
    name: `${base}ゃ ${base}ゅ ${base}ょ`,
    items: SMALL_Y.map(([v, small]) => {
      const romaji = (COMBO_ROMAJI[key] || `${key}y`) + v;
      return [romaji, base + small, cKey, v, { glide, romaji, notes: [`Two kana, one beat: ${base} plus a small ${small}.`], noUNote: true }];
    }),
  }));
}

const N_ITEM = {
  id: 'n', char: 'ん', romaji: 'n', ipa: 'ɴ', hint: '', say: 'ん', noProd: false,
  parts: [{
    kind: 'consonant', sym: 'n', ipa: 'ɴ', type: 'Moraic nasal',
    how: 'A nasal that takes a full beat. It copies the next sound: m before m, b, p; n before t, d, n; ng before k, g; a nasal vowel before vowels or at the end.',
    en: '“n”, “m” or “ng” depending on what follows, held for one beat', es: 'Spanish n already shifts this way, as in “un beso” (m) and “tengo” (ng). Give it its own beat',
  }],
  notes: ['The only kana that is a consonant on its own.'],
};

const SMALL_TSU = (char, example) => ({
  id: 'xtsu', char, romaji: 'double consonant', ipa: 'ː', hint: 'the small one that doubles the next consonant', say: example, noProd: false,
  parts: [{
    kind: 'consonant', sym: '(double)', ipa: 'ː', type: 'Geminate marker (small tsu)',
    how: 'Silent on its own. It holds the next consonant for one extra beat.',
    en: 'The held k in “bookcase” or the held t in “cat tail”', es: 'Like the double n in “innato”, applied to any consonant',
  }],
  notes: [`Written smaller than つ. Example: ${example}. In romaji the next consonant is doubled.`],
});

const LENGTH_NOTE = 'Length changes meaning: おばさん (aunt) and おばあさん (grandmother).';

const HIRA_LONG = [
  {
    id: 'ou', char: 'おう', romaji: 'ō', ipa: 'oː', hint: '', say: 'ありがとう', noProd: true,
    parts: [{ kind: 'vowel', sym: 'ō', ipa: 'oː', type: 'Long vowel', how: 'One o held for two beats. Usually spelled おう, and おお in a few words such as おおきい.', en: '“o” in “go” held twice as long, with no glide', es: 'A Spanish “o” held twice as long' }],
    notes: ['In ありがとう the last two kana are one long o.', LENGTH_NOTE],
  },
  {
    id: 'ei', char: 'えい', romaji: 'ē (ei)', ipa: 'eː', hint: '', say: 'せんせい', noProd: true,
    parts: [{ kind: 'vowel', sym: 'ē', ipa: 'eː', type: 'Long vowel', how: 'Usually said as one long e. Careful speech says e-i.', en: '“e” held twice as long, not “ay”', es: 'A Spanish “e” held twice as long' }],
    notes: ['せんせい is said “sensē”.', 'Other long vowels repeat the vowel: ああ, いい, うう, ええ, おお.'],
  },
];

function buildRows(rows) {
  return rows.map((r) => ({ id: r.id, name: r.name, items: r.items.map(([id, ch, c, v, extra]) => mora(id, ch, c, v, extra)) }));
}

function hiraganaGroups() {
  const base = buildRows(ROWS);
  base[base.length - 1].items.push(N_ITEM);
  return [
    ...base.map((g) => ({ ...g, base: true })),
    ...buildRows(VOICED_ROWS),
    ...buildRows(comboRows()),
    { id: 'tsu', name: 'Small っ', items: [SMALL_TSU('っ', 'きって')] },
    { id: 'long', name: 'Long vowels', items: HIRA_LONG },
  ];
}

// ---------- katakana ----------

const toKata = (s) => s.replace(/[ぁ-ゖ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60));

const EXTENSIONS = [
  ['fa', 'ファ', 'f', 'a'], ['fi', 'フィ', 'f', 'i'], ['fe', 'フェ', 'f', 'e'], ['fo', 'フォ', 'f', 'o'],
  ['ti', 'ティ', 't', 'i', { notes: ['A true “ti”, not “chi”, for foreign words like パーティー.'] }],
  ['di', 'ディ', 'd', 'i', { notes: ['A true “di”, not “ji”, for foreign words like ディナー.'] }],
  ['tu', 'トゥ', 't', 'u', { noUNote: true }], ['du', 'ドゥ', 'd', 'u', { noUNote: true }],
  ['wi', 'ウィ', 'w', 'i'], ['we', 'ウェ', 'w', 'e'], ['wo2', 'ウォ', 'w', 'o', { romaji: 'wo', notes: ['A real “wo”, as in ウォーター (water).'] }],
  ['she', 'シェ', 'sh', 'e'], ['je', 'ジェ', 'j', 'e'], ['che', 'チェ', 'ch', 'e'], ['tsa', 'ツァ', 'ts', 'a'],
  ['va', 'ヴァ', 'v', 'a'], ['vi', 'ヴィ', 'v', 'i'], ['vu', 'ヴ', 'v', 'u', { noUNote: true }], ['ve', 'ヴェ', 'v', 'e'], ['vo', 'ヴォ', 'v', 'o'],
];

const KATA_NOTE_OVERRIDES = {
  wo: { romaji: 'o (wo)', hint: 'o (wo), the rare one', notes: ['Rare in katakana. Said “o”, the same as オ.'] },
  ha: { notes: [] },
  he: { notes: [] },
};

function katakanaGroups() {
  const out = [];
  for (const g of hiraganaGroups()) {
    if (g.id === 'long') continue;
    const items = g.items
      .filter((it) => it.id !== 'dji' && it.id !== 'dzu') // ヂ and ヅ almost never appear in katakana
      .map((it) => {
        const k = { ...it, char: toKata(it.char), say: toKata(it.say), notes: it.notes.map(toKataInNote) };
        return KATA_NOTE_OVERRIDES[it.id] ? { ...k, ...KATA_NOTE_OVERRIDES[it.id] } : k;
      });
    if (g.id === 'd') for (const it of items) if (it.id === 'ji' || it.id === 'zu') it.hint = '';
    if (g.id === 'z') for (const it of items) it.hint = '';
    out.push({ ...g, name: toKata(g.name), items });
  }
  out.push({
    id: 'long', name: 'Long vowel mark ー', items: [{
      id: 'chouon', char: 'ー', romaji: 'long vowel', ipa: 'ː', hint: 'the mark that holds a vowel longer', say: 'コーヒー', noProd: false,
      parts: [{ kind: 'vowel', sym: '(long)', ipa: 'ː', type: 'Long vowel mark', how: 'Holds the vowel before it for one more beat.', en: 'Hold the vowel: コーヒー is “kō-hī”', es: 'Hold the vowel twice as long, as in a drawn-out “sííí”' }],
      notes: ['Written as a vertical line in vertical text.', LENGTH_NOTE],
    }],
  });
  out.push({ id: 'ext', name: 'Sounds for foreign words', items: EXTENSIONS.map(([id, ch, c, v, extra]) => mora(id, ch, c, v, extra)) });
  return out;
}

// In katakana notes, keep example words in hiragana but convert the kana being described.
function toKataInNote(note) {
  return note.replace(/Two kana, one beat: (.) plus a small (.)\./, (m, a, b) => `Two kana, one beat: ${toKata(a)} plus a small ${toKata(b)}.`)
    .replace('Written smaller than つ', 'Written smaller than ツ');
}

// ---------- words ----------

// Only words whose every kana has been learned are shown. Meanings in English and Spanish.
const HIRA_WORDS = [
  ['あい', 'ai', 'love', 'amor'], ['いえ', 'ie', 'house', 'casa'], ['うえ', 'ue', 'above, top', 'arriba'], ['あお', 'ao', 'blue', 'azul'],
  ['かお', 'kao', 'face', 'cara'], ['えき', 'eki', 'station', 'estación'], ['あさ', 'asa', 'morning', 'mañana'], ['いす', 'isu', 'chair', 'silla'],
  ['すし', 'sushi', 'sushi', 'sushi'], ['ねこ', 'neko', 'cat', 'gato'], ['いぬ', 'inu', 'dog', 'perro'], ['さかな', 'sakana', 'fish', 'pescado'],
  ['ひと', 'hito', 'person', 'persona'], ['はな', 'hana', 'flower; nose', 'flor; nariz'], ['て', 'te', 'hand', 'mano'], ['め', 'me', 'eye', 'ojo'],
  ['みみ', 'mimi', 'ear', 'oreja'], ['くち', 'kuchi', 'mouth', 'boca'], ['あし', 'ashi', 'foot, leg', 'pie, pierna'], ['やま', 'yama', 'mountain', 'montaña'],
  ['かわ', 'kawa', 'river', 'río'], ['そら', 'sora', 'sky', 'cielo'], ['ほし', 'hoshi', 'star', 'estrella'], ['つき', 'tsuki', 'moon', 'luna'],
  ['ゆき', 'yuki', 'snow', 'nieve'], ['あめ', 'ame', 'rain', 'lluvia'], ['はる', 'haru', 'spring', 'primavera'], ['なつ', 'natsu', 'summer', 'verano'],
  ['あき', 'aki', 'autumn', 'otoño'], ['ふゆ', 'fuyu', 'winter', 'invierno'], ['よる', 'yoru', 'night', 'noche'], ['みせ', 'mise', 'shop', 'tienda'],
  ['ほん', 'hon', 'book', 'libro'], ['にく', 'niku', 'meat', 'carne'], ['くるま', 'kuruma', 'car', 'coche, carro'], ['なまえ', 'namae', 'name', 'nombre'],
  ['わたし', 'watashi', 'I, me', 'yo'], ['にほん', 'nihon', 'Japan', 'Japón'], ['かさ', 'kasa', 'umbrella', 'paraguas'], ['くつ', 'kutsu', 'shoes', 'zapatos'],
  ['おかね', 'okane', 'money', 'dinero'], ['さくら', 'sakura', 'cherry blossom', 'flor de cerezo'], ['ひるやすみ', 'hiruyasumi', 'lunch break', 'descanso del almuerzo'],
  ['みず', 'mizu', 'water', 'agua'], ['ちず', 'chizu', 'map', 'mapa'], ['たまご', 'tamago', 'egg', 'huevo'], ['ことば', 'kotoba', 'word, language', 'palabra, idioma'],
  ['ともだち', 'tomodachi', 'friend', 'amigo, amiga'], ['かぜ', 'kaze', 'wind; a cold', 'viento; resfriado'], ['でんわ', 'denwa', 'telephone', 'teléfono'],
  ['えんぴつ', 'enpitsu', 'pencil', 'lápiz'], ['やさい', 'yasai', 'vegetables', 'verduras'], ['せんせい', 'sensei', 'teacher', 'maestro, profesor'],
  ['ありがとう', 'arigatō', 'thank you', 'gracias'], ['おはよう', 'ohayō', 'good morning', 'buenos días'], ['さようなら', 'sayōnara', 'goodbye', 'adiós'],
  ['ひこうき', 'hikōki', 'airplane', 'avión'], ['がっこう', 'gakkō', 'school', 'escuela'], ['きって', 'kitte', 'postage stamp', 'estampilla, sello'],
  ['おちゃ', 'ocha', 'tea', 'té'], ['しゃしん', 'shashin', 'photo', 'foto'], ['でんしゃ', 'densha', 'train', 'tren'], ['きょう', 'kyō', 'today', 'hoy'],
  ['りょこう', 'ryokō', 'trip', 'viaje'], ['ぎゅうにゅう', 'gyūnyū', 'milk', 'leche'], ['びょういん', 'byōin', 'hospital', 'hospital'],
  ['おいしい', 'oishii', 'delicious', 'delicioso'], ['おおきい', 'ōkii', 'big', 'grande'], ['ちいさい', 'chiisai', 'small', 'pequeño'],
];

const KATA_WORDS = [
  ['カメラ', 'kamera', 'camera', 'cámara'], ['テレビ', 'terebi', 'television', 'televisión'], ['ホテル', 'hoteru', 'hotel', 'hotel'],
  ['バス', 'basu', 'bus', 'autobús'], ['パン', 'pan', 'bread (from Portuguese)', 'pan'], ['ピアノ', 'piano', 'piano', 'piano'],
  ['ラジオ', 'rajio', 'radio', 'radio'], ['アメリカ', 'amerika', 'America (the US)', 'Estados Unidos'], ['メキシコ', 'mekishiko', 'Mexico', 'México'],
  ['スペイン', 'supein', 'Spain', 'España'], ['トマト', 'tomato', 'tomato', 'tomate'], ['バナナ', 'banana', 'banana', 'plátano, banana'],
  ['ペン', 'pen', 'pen', 'bolígrafo, pluma'], ['テスト', 'tesuto', 'test, exam', 'examen'], ['トイレ', 'toire', 'toilet, restroom', 'baño'],
  ['ドア', 'doa', 'door', 'puerta'], ['ビル', 'biru', 'building', 'edificio'], ['ミルク', 'miruku', 'milk', 'leche'], ['ワイン', 'wain', 'wine', 'vino'],
  ['アイス', 'aisu', 'ice cream', 'helado'], ['レストラン', 'resutoran', 'restaurant', 'restaurante'], ['パソコン', 'pasokon', 'personal computer', 'computadora'],
  ['タクシー', 'takushī', 'taxi', 'taxi'], ['コーヒー', 'kōhī', 'coffee', 'café'], ['ケーキ', 'kēki', 'cake', 'pastel'], ['ノート', 'nōto', 'notebook', 'cuaderno'],
  ['ゲーム', 'gēmu', 'game', 'juego'], ['メール', 'mēru', 'email', 'correo electrónico'], ['ギター', 'gitā', 'guitar', 'guitarra'],
  ['サッカー', 'sakkā', 'soccer', 'fútbol'], ['ベッド', 'beddo', 'bed', 'cama'], ['ジュース', 'jūsu', 'juice', 'jugo'], ['チーズ', 'chīzu', 'cheese', 'queso'],
  ['ニュース', 'nyūsu', 'news', 'noticias'], ['コンピューター', 'konpyūtā', 'computer', 'computadora'], ['フォーク', 'fōku', 'fork', 'tenedor'],
  ['パーティー', 'pātī', 'party', 'fiesta'], ['ソファ', 'sofa', 'sofa', 'sofá'], ['ウェブ', 'webu', 'the web', 'la web'], ['チェック', 'chekku', 'check', 'revisión'],
];

const words = (list) => list.map(([text, romaji, en, es]) => ({ id: romaji.replace(/[^a-zA-Zāīūēō]/g, '') + '-' + text.length, text, romaji, en, es, say: text }));

// ---------- on-screen keyboards (desktop only) ----------

const HIRA_KEYBOARD = [
  'あいうえお', 'かきくけこ', 'さしすせそ', 'たちつてと', 'なにぬねの', 'はひふへほ', 'まみむめも', 'や ゆ よ', 'らりるれろ', 'わ を ん',
  'がぎぐげご', 'ざじずぜぞ', 'だぢづでど', 'ばびぶべぼ', 'ぱぴぷぺぽ', 'ゃゅょっー', 'ぁぃぅぇぉ',
];
const KATA_KEYBOARD = HIRA_KEYBOARD.map(toKata).concat(['ヴ    ']);

// ---------- export ----------

const hiragana = {
  id: 'hira', script: 'ja', kind: 'chars', name: 'Hiragana', native: 'ひらがな', lang: 'ja-JP', font: 'ja',
  blurb: 'The main Japanese syllabary, used for grammar and native words. Start here.',
  groups: hiraganaGroups(), keyboard: HIRA_KEYBOARD,
};
const katakana = {
  id: 'kata', script: 'ja', kind: 'chars', name: 'Katakana', native: 'カタカナ', lang: 'ja-JP', font: 'ja', after: 'hira',
  blurb: 'The same sounds in angular shapes, used for foreign words and names.',
  groups: katakanaGroups(), keyboard: KATA_KEYBOARD,
};
const hiraWords = {
  id: 'hira-words', script: 'ja', kind: 'words', name: 'Hiragana words', native: 'ことば', lang: 'ja-JP', font: 'ja', requires: 'hira',
  blurb: 'Short everyday words, using only the kana you know.', items: words(HIRA_WORDS),
};
const kataWords = {
  id: 'kata-words', script: 'ja', kind: 'words', name: 'Katakana words', native: 'ことば', lang: 'ja-JP', font: 'ja', requires: 'kata',
  blurb: 'Loanwords from English and other languages.', items: words(KATA_WORDS),
};

export const JAPANESE = {
  id: 'ja', name: 'Japanese', native: '日本語', lang: 'ja-JP',
  intro: 'Spanish gives you a head start: four of the five Japanese vowels are the Spanish ones, and the Japanese r is the Spanish single r in “pero”.',
  decks: [hiragana, katakana, hiraWords, kataWords],
};
