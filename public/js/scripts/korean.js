// Korean: Hangul letters (jamo), syllable blocks and words, with pronunciation guide data.
// Letters are compatibility jamo (ㄱ, ㅏ), which is what Korean keyboards type on their own.

// ---------- consonants ----------
// Each consonant has its sound at the start of a syllable and, if it can be a final (받침), at the end.
// Korean stops come in three kinds: plain (ㄱ ㄷ ㅂ ㅈ), aspirated (ㅋ ㅌ ㅍ ㅊ) and tense (ㄲ ㄸ ㅃ ㅉ).

const UNRELEASED = 'held at the end without releasing the air';
const finalK = { sym: 'k', ipa: 'k̚', type: 'Unreleased velar stop', how: `The back of the tongue closes against the soft palate and is ${UNRELEASED}.`, en: '“k” in “back” with the tongue left in place, no puff', es: 'Like stopping right on a “c”, without letting the air out' };
const finalT = { sym: 't', ipa: 't̚', type: 'Unreleased alveolar stop', how: `The tongue tip closes behind the top teeth and is ${UNRELEASED}.`, en: '“t” in “hot” with the tongue left in place, no puff', es: 'Like stopping right on a “t”, without letting the air out' };
const finalP = { sym: 'p', ipa: 'p̚', type: 'Unreleased bilabial stop', how: `The lips close and stay ${UNRELEASED}.`, en: '“p” in “cup” with the lips left closed, no puff', es: 'Like stopping right on a “p”, lips closed, no air out' };

const CONSONANTS = [
  {
    ch: 'ㄱ', id: 'g', name: '기역', nameR: 'giyeok', r: 'g / k', say: '가',
    initial: { sym: 'g', ipa: 'k ~ ɡ', type: 'Plain velar stop', how: 'Back of the tongue against the soft palate. At the start of a word it has a light puff of air; between vowels it becomes a voiced g.', en: 'Between “k” and “g” at the start of a word; a “g” as in “ago” between vowels', es: 'Between “c” in “casa” and “g” in “gato”. Between vowels it’s a hard g, not the soft g in “agua”' },
    final: finalK,
  },
  {
    ch: 'ㄴ', id: 'n', name: '니은', nameR: 'nieun', r: 'n', say: '나',
    initial: { sym: 'n', ipa: 'n', type: 'Alveolar nasal', how: 'Tongue tip behind the top teeth, air through the nose.', en: '“n” in “no”', es: '“n” in “no”: the same' },
    final: { sym: 'n', ipa: 'n', type: 'Alveolar nasal', how: 'The same n, ending the syllable.', en: '“n” in “sun”', es: '“n” in “pan”' },
  },
  {
    ch: 'ㄷ', id: 'd', name: '디귿', nameR: 'digeut', r: 'd / t', say: '다',
    initial: { sym: 'd', ipa: 't ~ d', type: 'Plain dental-alveolar stop', how: 'Tongue tip just behind the top teeth. A light puff at the start of a word; a voiced d between vowels.', en: 'Between “t” and “d” at the start of a word; “d” between vowels', es: 'Between “t” in “tú” and “d” in “dos”. Between vowels it stays a full d, not the soft d in “nada”' },
    final: finalT,
  },
  {
    ch: 'ㄹ', id: 'r', name: '리을', nameR: 'rieul', r: 'r / l', say: '라',
    initial: { sym: 'r', ipa: 'ɾ', type: 'Alveolar tap', how: 'Between vowels and at the start, the tongue tip flicks once behind the top teeth.', en: 'The quick tap in American “butter”', es: 'The single “r” in “pero”: the same' },
    final: { sym: 'l', ipa: 'l', type: 'Lateral', how: 'At the end of a syllable, and when doubled (ㄹㄹ), the tongue stays up and air flows around its sides.', en: 'A light “l”, as in “leaf” (not the dark l in “ball”)', es: '“l” in “sal”: the same' },
  },
  {
    ch: 'ㅁ', id: 'm', name: '미음', nameR: 'mieum', r: 'm', say: '마',
    initial: { sym: 'm', ipa: 'm', type: 'Bilabial nasal', how: 'Lips closed, air through the nose.', en: '“m” in “me”', es: '“m” in “mamá”: the same' },
    final: { sym: 'm', ipa: 'm', type: 'Bilabial nasal', how: 'The same m, ending the syllable.', en: '“m” in “him”', es: '“m” at the end of “álbum”' },
  },
  {
    ch: 'ㅂ', id: 'b', name: '비읍', nameR: 'bieup', r: 'b / p', say: '바',
    initial: { sym: 'b', ipa: 'p ~ b', type: 'Plain bilabial stop', how: 'Lips close, then open. A light puff at the start of a word; a voiced b between vowels.', en: 'Between “p” and “b” at the start of a word; “b” between vowels', es: 'Between “p” and “b”. Between vowels it stays a full b, not the soft b in “haba”' },
    final: finalP,
  },
  {
    ch: 'ㅅ', id: 's', name: '시옷', nameR: 'siot', r: 's / t', say: '사',
    initial: { sym: 's', ipa: 's ~ ɕ', type: 'Plain alveolar fricative', how: 'An s with a little breath. Before ㅣ and the y-vowels it turns into a soft sh: 시 is “shi”.', en: '“s” in “sea”, slightly breathy; “sh” before i', es: '“s” in “sí”, with a little air; before i it sounds like “sh”' },
    final: finalT,
  },
  {
    ch: 'ㅇ', id: 'ng', name: '이응', nameR: 'ieung', r: '(silent) / ng', say: '앙',
    initial: { sym: '(silent)', ipa: '∅', type: 'Silent placeholder', how: 'At the start of a syllable it makes no sound. It fills the empty consonant slot so a vowel can start the block.', en: 'Silent, like the “h” in “hour”', es: 'Silent, like the “h” in “hola”' },
    final: { sym: 'ng', ipa: 'ŋ', type: 'Velar nasal', how: 'Back of the tongue against the soft palate, air through the nose.', en: '“ng” in “sing”', es: 'The “n” in “tengo” or “banco”' },
  },
  {
    ch: 'ㅈ', id: 'j', name: '지읒', nameR: 'jieut', r: 'j / t', say: '자',
    initial: { sym: 'j', ipa: 'tɕ ~ dʑ', type: 'Plain alveolo-palatal affricate', how: 'A light t sliding into a soft sh, with a little breath; voiced between vowels.', en: 'Between “ch” in “church” and “j” in “jam”', es: 'Between “ch” in “chico” and a strong “y” in “yo”' },
    final: finalT,
  },
  {
    ch: 'ㅎ', id: 'h', name: '히읗', nameR: 'hieut', r: 'h / t', say: '하',
    initial: { sym: 'h', ipa: 'h', type: 'Glottal fricative', how: 'Breath from the throat. Between vowels it often fades almost to nothing.', en: '“h” in “hat”', es: 'Much softer than the “j” in “jota”, like an aspirated Caribbean “s”' },
    final: { sym: '(t)', ipa: 't̚', type: 'Unreleased, usually silent', how: 'As a final it’s usually silent or makes the next consonant aspirated: 좋다 is said “jota”.', en: 'Mostly silent; it puffs up the next consonant', es: 'Mostly silent; it adds air to the next consonant' },
  },
  {
    ch: 'ㅋ', id: 'k', name: '키읔', nameR: 'kieuk', r: 'k', say: '카',
    initial: { sym: 'k', ipa: 'kʰ', type: 'Aspirated velar stop', how: 'Like ㄱ but with a strong puff of air.', en: '“k” in “kite”, with a strong puff of air', es: 'A “k” with a strong puff of air after it, stronger than any Spanish k' },
    final: finalK,
  },
  {
    ch: 'ㅌ', id: 't', name: '티읕', nameR: 'tieut', r: 't', say: '타',
    initial: { sym: 't', ipa: 'tʰ', type: 'Aspirated alveolar stop', how: 'Like ㄷ but with a strong puff of air.', en: '“t” in “top”, with a strong puff of air', es: 'A “t” with a strong puff of air after it' },
    final: finalT,
  },
  {
    ch: 'ㅍ', id: 'p', name: '피읖', nameR: 'pieup', r: 'p', say: '파',
    initial: { sym: 'p', ipa: 'pʰ', type: 'Aspirated bilabial stop', how: 'Like ㅂ but with a strong puff of air.', en: '“p” in “pie”, with a strong puff of air', es: 'A “p” with a strong puff of air after it' },
    final: finalP,
  },
  {
    ch: 'ㅊ', id: 'ch', name: '치읓', nameR: 'chieut', r: 'ch / t', say: '차',
    initial: { sym: 'ch', ipa: 'tɕʰ', type: 'Aspirated alveolo-palatal affricate', how: 'Like ㅈ but with a strong puff of air.', en: '“ch” in “church”, with a strong puff of air', es: 'A “ch” as in “chico” with a strong puff of air' },
    final: finalT,
  },
  {
    ch: 'ㄲ', id: 'kk', name: '쌍기역', nameR: 'ssanggiyeok', r: 'kk', say: '까',
    initial: { sym: 'kk', ipa: 'k͈', type: 'Tense velar stop', how: 'Throat tightened, no puff of air at all, released sharply.', en: '“k” in “skate”, said tensely', es: '“c” in “casa”, said tensely. Spanish k has no puff of air, so it’s already close' },
    final: finalK,
  },
  {
    ch: 'ㄸ', id: 'tt', name: '쌍디귿', nameR: 'ssangdigeut', r: 'tt', say: '따',
    initial: { sym: 'tt', ipa: 't͈', type: 'Tense alveolar stop', how: 'Throat tightened, no puff of air. Never used as a final.', en: '“t” in “stop”, said tensely', es: '“t” in “tú”, said tensely: Spanish t is already close' },
  },
  {
    ch: 'ㅃ', id: 'pp', name: '쌍비읍', nameR: 'ssangbieup', r: 'pp', say: '빠',
    initial: { sym: 'pp', ipa: 'p͈', type: 'Tense bilabial stop', how: 'Lips pressed, throat tightened, no puff of air. Never used as a final.', en: '“p” in “spin”, said tensely', es: '“p” in “papá”, said tensely: Spanish p is already close' },
  },
  {
    ch: 'ㅆ', id: 'ss', name: '쌍시옷', nameR: 'ssangsiot', r: 'ss / t', say: '싸',
    initial: { sym: 'ss', ipa: 's͈', type: 'Tense alveolar fricative', how: 'A sharp, hissing s with no breathiness.', en: 'A sharp “s”, as in “sss”, with no breath', es: 'A sharp, tense Spanish “s”' },
    final: finalT,
  },
  {
    ch: 'ㅉ', id: 'jj', name: '쌍지읒', nameR: 'ssangjieut', r: 'jj', say: '짜',
    initial: { sym: 'jj', ipa: 't͈ɕ', type: 'Tense alveolo-palatal affricate', how: 'Like ㅈ with the throat tightened and no puff of air. Never used as a final.', en: '“tch” in “catch it”, said tensely', es: '“ch” in “chico”, said tensely: Spanish ch is close' },
  },
];

// ---------- vowels ----------

const VOWELS = [
  { ch: 'ㅏ', id: 'a', r: 'a', ipa: 'a', type: 'Open central unrounded vowel', how: 'Mouth open, tongue low.', en: '“a” in “father”', es: '“a” in “casa”: the same' },
  { ch: 'ㅓ', id: 'eo', r: 'eo', ipa: 'ʌ', type: 'Open-mid back unrounded vowel', how: 'Jaw fairly open, tongue back, lips relaxed and unrounded.', en: '“u” in “cup”, or a British “o” in “hot” without rounding', es: 'No Spanish match: between “o” and “a”, with the lips unrounded' },
  { ch: 'ㅗ', id: 'o', r: 'o', ipa: 'o', type: 'Close-mid back rounded vowel', how: 'Lips well rounded, tongue back.', en: '“o” in “go”, without the “w” glide', es: '“o” in “solo”, with rounder lips' },
  { ch: 'ㅜ', id: 'u', r: 'u', ipa: 'u', type: 'Close back rounded vowel', how: 'Lips rounded and pushed out, tongue high and back.', en: '“oo” in “food”', es: '“u” in “tú”: the same' },
  { ch: 'ㅡ', id: 'eu', r: 'eu', ipa: 'ɯ', type: 'Close back unrounded vowel', how: 'Like ㅜ but with the lips spread flat, as if smiling.', en: '“oo” in “food” said with a smile; close to the vowel in “good” without rounding', es: 'No Spanish match: say “u” while smiling, lips spread' },
  { ch: 'ㅣ', id: 'i', r: 'i', ipa: 'i', type: 'Close front unrounded vowel', how: 'Tongue high and forward, lips spread.', en: '“ee” in “see”', es: '“i” in “sí”: the same' },
  { ch: 'ㅑ', id: 'ya', r: 'ya', ipa: 'ja', glide: 'y', type: 'y-glide + a', how: 'A quick y sliding into ㅏ: the extra stroke adds the y.', en: '“ya” in “yacht”', es: '“ia” in “familia”' },
  { ch: 'ㅕ', id: 'yeo', r: 'yeo', ipa: 'jʌ', glide: 'y', type: 'y-glide + eo', how: 'A quick y sliding into ㅓ.', en: '“yu” in “yummy”', es: 'An “i” glide into the ㅓ sound, like “io” with unrounded lips' },
  { ch: 'ㅛ', id: 'yo', r: 'yo', ipa: 'jo', glide: 'y', type: 'y-glide + o', how: 'A quick y sliding into ㅗ.', en: '“yo” in “yoga”', es: '“io” in “radio”' },
  { ch: 'ㅠ', id: 'yu', r: 'yu', ipa: 'ju', glide: 'y', type: 'y-glide + u', how: 'A quick y sliding into ㅜ.', en: '“you”', es: '“iu” in “ciudad”' },
  { ch: 'ㅐ', id: 'ae', r: 'ae', ipa: 'ɛ', type: 'Open-mid front unrounded vowel', how: 'Tongue forward, mouth a little more open than for ㅔ.', en: '“e” in “bed”', es: 'Spanish “e”, a little more open', note: 'Most speakers today say ㅐ and ㅔ the same; spelling tells them apart.' },
  { ch: 'ㅔ', id: 'e', r: 'e', ipa: 'e', type: 'Close-mid front unrounded vowel', how: 'Tongue forward, mouth half open.', en: '“e” in “bed”, a little higher', es: '“e” in “mesa”: the same', note: 'Most speakers today say ㅐ and ㅔ the same.' },
  { ch: 'ㅒ', id: 'yae', r: 'yae', ipa: 'jɛ', glide: 'y', type: 'y-glide + ae', how: 'A quick y sliding into ㅐ. Rare.', en: '“ye” in “yes”', es: '“ie” in “tiene”' },
  { ch: 'ㅖ', id: 'ye', r: 'ye', ipa: 'je', glide: 'y', type: 'y-glide + e', how: 'A quick y sliding into ㅔ.', en: '“ye” in “yes”', es: '“ie” in “tiene”', note: 'After most consonants it’s said as plain e: 시계 is “sige”.' },
  { ch: 'ㅘ', id: 'wa', r: 'wa', ipa: 'wa', glide: 'w', type: 'w-glide + a', how: 'ㅗ + ㅏ: a quick w sliding into a.', en: '“wa” in “wander”', es: '“ua” in “agua”' },
  { ch: 'ㅙ', id: 'wae', r: 'wae', ipa: 'wɛ', glide: 'w', type: 'w-glide + ae', how: 'ㅗ + ㅐ: a quick w sliding into ae.', en: '“we” in “wet”', es: '“ue” in “bueno”', note: 'ㅙ, ㅚ and ㅞ sound almost the same today.' },
  { ch: 'ㅚ', id: 'oe', r: 'oe', ipa: 'we', glide: 'w', type: 'w-glide + e (today)', how: 'ㅗ + ㅣ in writing, but said “we” today. It was once a rounded front vowel [ø].', en: '“we” in “wet”', es: '“ue” in “bueno”', note: 'ㅙ, ㅚ and ㅞ sound almost the same today.' },
  { ch: 'ㅝ', id: 'wo', r: 'wo', ipa: 'wʌ', glide: 'w', type: 'w-glide + eo', how: 'ㅜ + ㅓ: a quick w sliding into eo.', en: '“wo” in “wonder”', es: '“uo” in “cuota”, with an unrounded o' },
  { ch: 'ㅞ', id: 'we', r: 'we', ipa: 'we', glide: 'w', type: 'w-glide + e', how: 'ㅜ + ㅔ: a quick w sliding into e. Rare.', en: '“we” in “wet”', es: '“ue” in “bueno”' },
  { ch: 'ㅟ', id: 'wi', r: 'wi', ipa: 'wi', glide: 'w', type: 'w-glide + i', how: 'ㅜ + ㅣ: a quick w sliding into i.', en: '“wee” in “week”', es: '“ui” in “fui”' },
  { ch: 'ㅢ', id: 'ui', r: 'ui', ipa: 'ɰi', glide: 'ɰ', type: 'Unrounded glide + i', how: 'ㅡ + ㅣ: start with lips spread on ㅡ and glide to ㅣ in one beat.', en: '“uh-ee” squeezed into one beat, lips spread', es: 'Like “ui” in “muy”, but starting with the lips spread', note: 'After a consonant it’s said as i (희 is “hi”), and as the possessive particle it’s often e.' },
];

const SOUND_NOTE = 'Korean has three kinds of stops: plain (ㄱ ㄷ ㅂ ㅈ, a light puff), aspirated (ㅋ ㅌ ㅍ ㅊ, a strong puff) and tense (ㄲ ㄸ ㅃ ㅉ, no puff, tight throat).';

// ---------- letters deck ----------

const consonantItem = (c) => ({
  id: c.id, char: c.ch, romaji: c.r, name: c.name, nameRomaji: c.nameR, say: c.say, hint: c.hint || '',
  ipa: c.final ? `${c.initial.ipa} … ${c.final.ipa}` : c.initial.ipa,
  parts: [
    { kind: 'initial', ...c.initial },
    ...(c.final ? [{ kind: 'final', ...c.final }] : []),
  ],
  notes: [
    ...(['g', 'd', 'b', 'j', 'k', 't', 'p', 'ch', 'kk', 'tt', 'pp', 'jj'].includes(c.id) ? [SOUND_NOTE] : []),
    ...(c.final ? [] : [`${c.ch} never ends a syllable.`]),
  ],
});
const vowelItem = (v) => ({
  id: v.id, char: v.ch, romaji: v.r, ipa: v.ipa, say: compose(['ㅇ', v.ch]), hint: '',
  parts: [{ kind: 'vowel', sym: v.r, ipa: v.ipa, type: v.type, how: v.how, en: v.en, es: v.es }],
  notes: [v.note, 'Written alone, a vowel sits next to a silent ㅇ: ' + compose(['ㅇ', v.ch]) + '.'].filter(Boolean),
});

const byCh = Object.fromEntries([...CONSONANTS, ...VOWELS].map((x) => [x.ch, x]));
const pick = (chars) => [...chars].map((ch) => byCh[ch]).map((x) => (x.initial ? consonantItem(x) : vowelItem(x)));

const LETTER_GROUPS = [
  { id: 'v1', name: 'Basic vowels', chars: 'ㅏㅓㅗㅜㅡㅣ', base: true },
  { id: 'c1', name: 'Consonants 1', chars: 'ㄱㄴㄷㄹㅁ', base: true },
  { id: 'c2', name: 'Consonants 2', chars: 'ㅂㅅㅇㅈㅎ', base: true },
  { id: 'v2', name: 'Y-vowels', chars: 'ㅑㅕㅛㅠ', base: true },
  { id: 'c3', name: 'Aspirated consonants', chars: 'ㅋㅌㅍㅊ', base: true },
  { id: 'c4', name: 'Tense (doubled) consonants', chars: 'ㄲㄸㅃㅆㅉ' },
  { id: 'v3', name: 'ㅐ ㅔ ㅒ ㅖ', chars: 'ㅐㅔㅒㅖ' },
  { id: 'v4', name: 'Combined vowels', chars: 'ㅘㅙㅚㅝㅞㅟㅢ' },
];

// ---------- composing and splitting syllable blocks ----------

const L = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const V = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
const T = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const DOUBLE_FINAL = { ㄳ: 'ㄱㅅ', ㄵ: 'ㄴㅈ', ㄶ: 'ㄴㅎ', ㄺ: 'ㄹㄱ', ㄻ: 'ㄹㅁ', ㄼ: 'ㄹㅂ', ㄽ: 'ㄹㅅ', ㄾ: 'ㄹㅌ', ㄿ: 'ㄹㅍ', ㅀ: 'ㄹㅎ', ㅄ: 'ㅂㅅ' };
const JOIN_FINAL = Object.fromEntries(Object.entries(DOUBLE_FINAL).map(([k, v]) => [v, k]));
const JOIN_VOWEL = { ㅗㅏ: 'ㅘ', ㅗㅐ: 'ㅙ', ㅗㅣ: 'ㅚ', ㅜㅓ: 'ㅝ', ㅜㅔ: 'ㅞ', ㅜㅣ: 'ㅟ', ㅡㅣ: 'ㅢ' };
const isVowel = (j) => V.includes(j);
const syl = (l, v, t = '') => String.fromCharCode(0xac00 + (L.indexOf(l) * 21 + V.indexOf(v)) * 28 + T.indexOf(t));

// Split text into jamo keystrokes (combined finals become two consonants; combined vowels stay one key).
export function decompose(text) {
  const out = [];
  for (const ch of text) {
    const code = ch.charCodeAt(0) - 0xac00;
    if (code < 0 || code > 11171) {
      out.push(ch);
      continue;
    }
    const t = T[code % 28];
    out.push(L[Math.floor(code / 588)], V[Math.floor((code % 588) / 28)]);
    if (t) out.push(...(DOUBLE_FINAL[t] || t));
  }
  return out;
}

// Build syllable blocks from a jamo sequence, the way a two-set (dubeolsik) Korean keyboard does.
export function compose(seq) {
  const out = [];
  let cur = null; // { l, v, t }
  const flush = () => {
    if (!cur) return;
    if (cur.l && cur.v) out.push(syl(cur.l, cur.v, cur.t || ''));
    else out.push((cur.l || '') + (cur.v || ''));
    cur = null;
  };
  for (const j of seq) {
    if (!/[ㄱ-ㅣ]/.test(j)) {
      flush();
      out.push(j);
      continue;
    }
    if (!isVowel(j)) {
      if (cur && cur.l && cur.v && !cur.t && T.includes(j)) cur.t = j;
      else if (cur && cur.t && JOIN_FINAL[cur.t + j]) cur.t = JOIN_FINAL[cur.t + j];
      else {
        flush();
        cur = { l: L.includes(j) ? j : null };
        if (!cur.l) {
          out.push(j);
          cur = null;
        }
      }
    } else if (cur && cur.l && !cur.v) cur.v = j;
    else if (cur && cur.v && !cur.t && JOIN_VOWEL[cur.v + j]) cur.v = JOIN_VOWEL[cur.v + j];
    else if (cur && cur.t) {
      // A final followed by a vowel moves over to start the next block.
      const parts = DOUBLE_FINAL[cur.t] || cur.t;
      const moved = parts[parts.length - 1];
      cur.t = parts.length > 1 ? parts[0] : '';
      flush();
      cur = { l: moved, v: j };
    } else {
      flush();
      out.push(j);
    }
  }
  flush();
  return out.join('');
}

// On-screen keyboard: add a key to what's typed, or delete the last keystroke.
export const typeKey = (text, key) => compose([...decompose(text), key]);
export const deleteKey = (text) => compose(decompose(text).slice(0, -1));

// Letters (by deck item id) needed to read a syllable or word.
const letterId = Object.fromEntries([...CONSONANTS, ...VOWELS].map((x) => [x.ch, x.id]));
export function lettersIn(text) {
  const ids = new Set();
  for (const j of decompose(text)) if (letterId[j]) ids.add(letterId[j]);
  return [...ids];
}

// ---------- romanizing a single block (Revised Romanization, block on its own) ----------

const R_INITIAL = { ㄱ: 'g', ㄲ: 'kk', ㄴ: 'n', ㄷ: 'd', ㄸ: 'tt', ㄹ: 'r', ㅁ: 'm', ㅂ: 'b', ㅃ: 'pp', ㅅ: 's', ㅆ: 'ss', ㅇ: '', ㅈ: 'j', ㅉ: 'jj', ㅊ: 'ch', ㅋ: 'k', ㅌ: 't', ㅍ: 'p', ㅎ: 'h' };
const R_FINAL = { '': '', ㄱ: 'k', ㄲ: 'k', ㄳ: 'k', ㄴ: 'n', ㄵ: 'n', ㄶ: 'n', ㄷ: 't', ㄹ: 'l', ㄺ: 'k', ㄻ: 'm', ㄼ: 'l', ㄽ: 'l', ㄾ: 'l', ㄿ: 'p', ㅀ: 'l', ㅁ: 'm', ㅂ: 'p', ㅄ: 'p', ㅅ: 't', ㅆ: 't', ㅇ: 'ng', ㅈ: 't', ㅊ: 't', ㅋ: 'k', ㅌ: 't', ㅍ: 'p', ㅎ: 't' };
const R_VOWEL = Object.fromEntries(VOWELS.map((v) => [v.ch, v.r]));
const FINAL_IPA = { k: 'k̚', n: 'n', t: 't̚', l: 'l', m: 'm', p: 'p̚', ng: 'ŋ', '': '' };

function parts(block) {
  const code = block.charCodeAt(0) - 0xac00;
  return { l: L[Math.floor(code / 588)], v: V[Math.floor((code % 588) / 28)], t: T[code % 28] };
}
export function romanizeBlock(block) {
  const { l, v, t } = parts(block);
  return R_INITIAL[l] + R_VOWEL[v] + R_FINAL[t];
}

// ---------- syllable blocks deck ----------

const BLOCK_GROUPS = [
  { id: 'ba', name: 'Consonant + ㅏ', text: '가나다라마바사아자하' },
  { id: 'bo', name: 'Consonant + ㅗ, ㅜ', text: '고노도로모보소오조호구누두루무부수우주후' },
  { id: 'beo', name: 'Consonant + ㅓ, ㅡ, ㅣ', text: '거너더러머버서어저허그느드르스으기니디리미비시이지히' },
  { id: 'by', name: 'With y-vowels', text: '야여요유교료류녀며쇼' },
  { id: 'basp', name: 'Aspirated', text: '카타파차커토푸치' },
  { id: 'btense', name: 'Tense', text: '까따빠싸짜꼬또뿌씨찌' },
  { id: 'bae', name: 'With ㅐ and ㅔ', text: '개내대래매배새애재해게네데레메베세에제예' },
  { id: 'bw', name: 'With combined vowels', text: '과화와워위의외쇠뭐왜' },
  { id: 'fk', name: 'Final k (ㄱ ㄲ ㅋ)', text: '국각박밖엌', final: 'k' },
  { id: 'fn', name: 'Final n', text: '한산문눈안', final: 'n' },
  { id: 'ft', name: 'Final t (ㄷ ㅅ ㅆ ㅈ ㅊ ㅌ ㅎ)', text: '곧옷있낮꽃밭좋', final: 't' },
  { id: 'fl', name: 'Final l', text: '말물길일달', final: 'l' },
  { id: 'fm', name: 'Final m', text: '밤감봄몸김', final: 'm' },
  { id: 'fp', name: 'Final p (ㅂ ㅍ)', text: '밥집입앞숲', final: 'p' },
  { id: 'fng', name: 'Final ng', text: '강방공형영', final: 'ng' },
  { id: 'fx', name: 'Double finals', text: '닭앉읽값많', final: 'x' },
];

const FINAL_NOTES = {
  k: 'ㄱ, ㄲ and ㅋ all end a block as the same unreleased k.',
  t: 'ㄷ, ㅅ, ㅆ, ㅈ, ㅊ, ㅌ and ㅎ all end a block as the same unreleased t.',
  p: 'ㅂ and ㅍ both end a block as the same unreleased p.',
  x: 'With two final consonants, only one is said on its own; the other comes back when a vowel follows (닭이 is “dalgi”).',
};

function blockItem(block, group) {
  const { l, v, t } = parts(block);
  const c = byCh[l];
  const vow = byCh[v];
  const r = romanizeBlock(block);
  const finalSound = R_FINAL[t];
  const initialIpa = l === 'ㅇ' ? '' : (c.initial.ipa.split(' ~ ')[0] === 's' && /^[ㅣㅑㅕㅛㅠㅒㅖㅟ]$/.test(v) ? 'ɕ' : c.initial.ipa.split(' ~ ')[0]);
  const partsOut = [];
  if (l !== 'ㅇ') partsOut.push({ kind: 'initial', ...c.initial, sym: `${l} ${c.initial.sym}` });
  else partsOut.push({ kind: 'initial', ...c.initial, sym: 'ㅇ (silent)' });
  partsOut.push({ kind: 'vowel', sym: `${v} ${vow.r}`, ipa: vow.ipa, type: vow.type, how: vow.how, en: vow.en, es: vow.es });
  if (t) {
    const letters = DOUBLE_FINAL[t] || t;
    const said = [...letters].map((x) => byCh[x]).find((x) => R_FINAL[x.ch] === finalSound) || byCh[letters[0]];
    partsOut.push({ kind: 'final', ...(said.final || finalT), sym: `${t} ${finalSound}` });
  }
  const notes = [];
  if (group.final && FINAL_NOTES[group.final]) notes.push(FINAL_NOTES[group.final]);
  if (vow.note) notes.push(vow.note);
  return {
    id: `b${block.charCodeAt(0).toString(16)}`, char: block, romaji: r, ipa: initialIpa + vow.ipa + (FINAL_IPA[finalSound] ?? ''),
    say: block, hint: '', parts: partsOut, notes, needs: lettersIn(block),
  };
}

// ---------- words ----------

const WORDS = [
  ['안녕하세요', 'annyeonghaseyo', 'hello', 'hola'], ['감사합니다', 'gamsahamnida', 'thank you', 'gracias'], ['네', 'ne', 'yes', 'sí'],
  ['아니요', 'aniyo', 'no', 'no'], ['물', 'mul', 'water', 'agua'], ['밥', 'bap', 'cooked rice; a meal', 'arroz; comida'],
  ['사람', 'saram', 'person', 'persona'], ['한국', 'hanguk', 'Korea', 'Corea'], ['한국어', 'hangugeo', 'Korean (language)', 'coreano (idioma)'],
  ['친구', 'chingu', 'friend', 'amigo, amiga'], ['학교', 'hakgyo', 'school', 'escuela'], ['집', 'jip', 'house, home', 'casa'],
  ['가족', 'gajok', 'family', 'familia'], ['엄마', 'eomma', 'mom', 'mamá'], ['아빠', 'appa', 'dad', 'papá'], ['나무', 'namu', 'tree', 'árbol'],
  ['바다', 'bada', 'sea', 'mar'], ['하늘', 'haneul', 'sky', 'cielo'], ['사랑', 'sarang', 'love', 'amor'], ['고양이', 'goyangi', 'cat', 'gato'],
  ['개', 'gae', 'dog', 'perro'], ['커피', 'keopi', 'coffee', 'café'], ['우유', 'uyu', 'milk', 'leche'], ['김치', 'gimchi', 'kimchi', 'kimchi'],
  ['라면', 'ramyeon', 'ramen', 'ramen'], ['시간', 'sigan', 'time; hour', 'tiempo; hora'], ['오늘', 'oneul', 'today', 'hoy'], ['내일', 'naeil', 'tomorrow', 'mañana'],
  ['어제', 'eoje', 'yesterday', 'ayer'], ['책', 'chaek', 'book', 'libro'], ['문', 'mun', 'door', 'puerta'], ['눈', 'nun', 'eye; snow', 'ojo; nieve'],
  ['손', 'son', 'hand', 'mano'], ['발', 'bal', 'foot', 'pie'], ['머리', 'meori', 'head; hair', 'cabeza; pelo'], ['비', 'bi', 'rain', 'lluvia'],
  ['꽃', 'kkot', 'flower', 'flor'], ['산', 'san', 'mountain', 'montaña'], ['강', 'gang', 'river', 'río'], ['돈', 'don', 'money', 'dinero'],
  ['이름', 'ireum', 'name', 'nombre'], ['음식', 'eumsik', 'food', 'comida'], ['병원', 'byeongwon', 'hospital', 'hospital'],
  ['지하철', 'jihacheol', 'subway', 'metro'], ['비행기', 'bihaenggi', 'airplane', 'avión'], ['선생님', 'seonsaengnim', 'teacher', 'maestro, profesor'],
  ['좋아요', 'joayo', 'good; I like it', 'bueno; me gusta'], ['맛있어요', 'masisseoyo', 'it’s delicious', 'está delicioso'],
  ['괜찮아요', 'gwaenchanayo', 'it’s okay', 'está bien'], ['주세요', 'juseyo', 'please give me', 'deme, por favor'], ['여기', 'yeogi', 'here', 'aquí'],
  ['화장실', 'hwajangsil', 'restroom', 'baño'], ['의자', 'uija', 'chair', 'silla'], ['왜', 'wae', 'why', 'por qué'], ['뭐', 'mwo', 'what', 'qué'],
];

// ---------- export ----------

const letters = {
  id: 'hangul', script: 'ko', kind: 'chars', name: 'Hangul letters', native: '한글', lang: 'ko-KR', htmlLang: 'ko', writeIn: 'Hangul',
  blurb: '19 consonants and 21 vowels, with how each sounds at the start and end of a syllable. Start here.',
  groups: LETTER_GROUPS.map((g) => ({ id: g.id, name: g.name, base: !!g.base, items: pick(g.chars) })),
  keyboardRows: ['ㅂㅈㄷㄱㅅㅛㅕㅑㅐㅔ', 'ㅁㄴㅇㄹㅎㅗㅓㅏㅣ', 'ㅋㅌㅊㅍㅠㅜㅡ', 'ㅃㅉㄸㄲㅆㅒㅖ', 'ㅘㅙㅚㅝㅞㅟㅢ'],
  typeKey, deleteKey,
};
const blocks = {
  id: 'hangul-blocks', script: 'ko', kind: 'chars', name: 'Syllable blocks', native: '음절', lang: 'ko-KR', htmlLang: 'ko', writeIn: 'Hangul',
  after: 'hangul', needsDeck: 'hangul',
  blurb: 'Letters stacked into blocks, from simple pairs to blocks with final consonants.',
  groups: BLOCK_GROUPS.map((g) => ({ id: g.id, name: g.name, items: [...g.text].map((b) => blockItem(b, g)) })),
  keyboardRows: letters.keyboardRows, typeKey, deleteKey,
};
const words = {
  id: 'ko-words', script: 'ko', kind: 'words', name: 'Korean words', native: '단어', lang: 'ko-KR', htmlLang: 'ko', requires: 'hangul',
  blurb: 'Everyday words, using only the letters you know.',
  items: WORDS.map(([text, romaji, en, es], i) => ({ id: `w${i}-${romaji}`, text, romaji, en, es, say: text })),
  needsOf: lettersIn,
  breakdown: (text) => [...text].map((b) => ({ ch: b, r: /[가-힣]/.test(b) ? romanizeBlock(b) : '' })),
  unitCount: (text) => [...text].length,
};

export const KOREAN = {
  id: 'ko', name: 'Korean', native: '한국어', lang: 'ko-KR', htmlLang: 'ko',
  intro: 'Hangul was designed to be learned in a day: each block is letters stacked in reading order, left to right and top to bottom. Spanish helps here too: the Korean single r is the Spanish r in “pero”, and Spanish k, t and p are close to Korean tense ㄲ, ㄸ and ㅃ.',
  decks: [letters, blocks, words],
};
