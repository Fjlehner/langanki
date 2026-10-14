// Hebrew: print letters (with final forms and dot pairs), vowel points, words, then cursive.
// Hebrew is written right to left. Pronunciation follows modern Israeli Hebrew.

const DAGESH = 'ּ';
const SHIN_DOT = 'ׁ';
const SIN_DOT = 'ׂ';
const QAMATS = 'ָ';

const silentPart = (how) => ({ kind: 'consonant', sym: '(silent)', ipa: '∅ / ʔ', type: 'Silent carrier', how, en: 'Silent: just a seat for a vowel, like the “h” in “hour”', es: 'Silent, like the “h” in “hola”' });

// Each letter: id, char, name (English and Hebrew), romanization, what to say aloud, guide parts, notes.
const LETTERS = [
  { id: 'alef', ch: 'א', name: 'alef', he: 'אָלֶף', r: '(silent)', hint: 'alef', say: 'אָ', parts: [silentPart('Carries a vowel at the start of a syllable, or sits silently in a word. Sometimes a light catch in the throat.')] },
  {
    id: 'bet', ch: 'ב', name: 'bet / vet', he: 'בֵּית', r: 'b / v', say: 'בָּ',
    parts: [
      { kind: 'consonant', label: 'With a dot: בּ', sym: 'b', ipa: 'b', type: 'Voiced bilabial stop', how: 'Lips close, then open with the voice on.', en: '“b” in “bat”', es: '“b” in “bien”, a full b even between vowels' },
      { kind: 'consonant', label: 'Without: ב', sym: 'v', ipa: 'v', type: 'Voiced labiodental fricative', how: 'Top teeth on the lower lip, voice on.', en: '“v” in “vine”', es: 'Not the Spanish v (which is a b): top teeth on the lower lip, like an English v' },
    ],
    notes: ['The dot (dagesh) is usually there at the start of a word. Everyday text leaves dots out, so you learn which words have b and which have v.'],
  },
  { id: 'gimel', ch: 'ג', name: 'gimel', he: 'גִּימֶל', r: 'g', say: 'גָּ', parts: [{ kind: 'consonant', sym: 'g', ipa: 'ɡ', type: 'Voiced velar stop', how: 'Back of the tongue against the soft palate, voice on.', en: '“g” in “go”, always hard', es: '“g” in “gato”, hard even before e and i (unlike “gente”)' }], notes: ['With an apostrophe (ג׳) it spells the “j” in foreign words like ג׳ינס (jeans).'] },
  { id: 'dalet', ch: 'ד', name: 'dalet', he: 'דָּלֶת', r: 'd', say: 'דָּ', parts: [{ kind: 'consonant', sym: 'd', ipa: 'd', type: 'Voiced alveolar stop', how: 'Tongue tip behind the top teeth, voice on.', en: '“d” in “do”', es: '“d” in “dos”, a full d even between vowels' }] },
  { id: 'he', ch: 'ה', name: 'he', he: 'הֵא', r: 'h', say: 'הָ', parts: [{ kind: 'consonant', sym: 'h', ipa: 'h', type: 'Glottal fricative', how: 'A breath from the throat.', en: '“h” in “hat”', es: 'A soft breath, much softer than the “j” in “jota”' }], notes: ['At the end of a word it’s usually silent and just marks a vowel: מָה is “ma”.'] },
  {
    id: 'vav', ch: 'ו', name: 'vav', he: 'וָו', r: 'v', say: 'וָ',
    parts: [
      { kind: 'consonant', sym: 'v', ipa: 'v', type: 'Voiced labiodental fricative', how: 'Top teeth on the lower lip.', en: '“v” in “vine”', es: 'Like an English v, teeth on the lip' },
      { kind: 'vowel', label: 'As a vowel: וֹ וּ', sym: 'o / u', ipa: 'o / u', type: 'Vowel letter', how: 'With a dot on top (וֹ) it’s o; with a dot inside (וּ) it’s u.', en: '“o” in “go” / “oo” in “food”', es: '“o” / “u”: the Spanish vowels' },
    ],
  },
  { id: 'zayin', ch: 'ז', name: 'zayin', he: 'זַיִן', r: 'z', say: 'זָ', parts: [{ kind: 'consonant', sym: 'z', ipa: 'z', type: 'Voiced alveolar fricative', how: 'Like s with the voice on.', en: '“z” in “zoo”', es: 'A buzzing s; most Spanish has no z sound (it’s the s in “mismo”)' }] },
  { id: 'chet', ch: 'ח', name: 'chet', he: 'חֵית', r: 'ch', hint: 'chet', say: 'חָ', parts: [{ kind: 'consonant', sym: 'ch', ipa: 'χ', type: 'Voiceless uvular fricative', how: 'A raspy breath from the back of the throat.', en: 'The “ch” in Scottish “loch” or German “Bach”', es: 'The “j” in “jota” as said in Spain: the same sound' }], notes: ['Sounds the same as כ without a dot (khaf).'] },
  { id: 'tet', ch: 'ט', name: 'tet', he: 'טֵית', r: 't', hint: 'tet', say: 'טָ', parts: [{ kind: 'consonant', sym: 't', ipa: 't', type: 'Voiceless alveolar stop', how: 'Tongue tip behind the top teeth.', en: '“t” in “stop”', es: '“t” in “tú”' }], notes: ['Sounds the same as ת (tav).'] },
  { id: 'yod', ch: 'י', name: 'yod', he: 'יוֹד', r: 'y', say: 'יָ', parts: [{ kind: 'consonant', sym: 'y', ipa: 'j', type: 'Palatal approximant', how: 'The tongue glides from near the roof of the mouth.', en: '“y” in “yes”', es: '“y” in “ya”, said lightly, or “i” in “tiene”' }], notes: ['Also marks an i or e vowel: מִי is “mi”.'] },
  {
    id: 'kaf', ch: 'כ', name: 'kaf / khaf', he: 'כַּף', r: 'k / kh', hint: 'kaf', say: 'כָּ',
    parts: [
      { kind: 'consonant', label: 'With a dot: כּ', sym: 'k', ipa: 'k', type: 'Voiceless velar stop', how: 'Back of the tongue against the soft palate.', en: '“k” in “skin”', es: '“c” in “casa”' },
      { kind: 'consonant', label: 'Without: כ', sym: 'kh', ipa: 'χ', type: 'Voiceless uvular fricative', how: 'A raspy breath from the back of the throat.', en: '“ch” in Scottish “loch”', es: '“j” in “jota” (Spain): the same sound' },
    ],
    notes: ['Without a dot it sounds the same as ח (chet).'],
  },
  { id: 'lamed', ch: 'ל', name: 'lamed', he: 'לָמֶד', r: 'l', say: 'לָ', parts: [{ kind: 'consonant', sym: 'l', ipa: 'l', type: 'Alveolar lateral', how: 'Tongue tip up, air around its sides.', en: 'A light “l”, as in “leaf”', es: '“l” in “la”: the same' }] },
  { id: 'mem', ch: 'מ', name: 'mem', he: 'מֵם', r: 'm', say: 'מָ', parts: [{ kind: 'consonant', sym: 'm', ipa: 'm', type: 'Bilabial nasal', how: 'Lips closed, air through the nose.', en: '“m” in “me”', es: '“m” in “mamá”' }] },
  { id: 'nun', ch: 'נ', name: 'nun', he: 'נוּן', r: 'n', say: 'נָ', parts: [{ kind: 'consonant', sym: 'n', ipa: 'n', type: 'Alveolar nasal', how: 'Tongue tip behind the teeth, air through the nose.', en: '“n” in “no”', es: '“n” in “no”' }] },
  { id: 'samekh', ch: 'ס', name: 'samekh', he: 'סָמֶךְ', r: 's', hint: 'samekh', say: 'סָ', parts: [{ kind: 'consonant', sym: 's', ipa: 's', type: 'Voiceless alveolar fricative', how: 'Air hissing past the tongue tip.', en: '“s” in “see”', es: '“s” in “sí”' }], notes: ['Sounds the same as שׂ (sin).'] },
  { id: 'ayin', ch: 'ע', name: 'ayin', he: 'עַיִן', r: '(silent)', hint: 'ayin', say: 'עָ', parts: [silentPart('Usually silent today, carrying a vowel. Some speakers, especially of Middle Eastern background, say a deep throat sound [ʕ].')], notes: ['Sounds the same as א (alef) for most speakers.'] },
  {
    id: 'pe', ch: 'פ', name: 'pe / fe', he: 'פֵּא', r: 'p / f', say: 'פָּ',
    parts: [
      { kind: 'consonant', label: 'With a dot: פּ', sym: 'p', ipa: 'p', type: 'Voiceless bilabial stop', how: 'Lips close, then open, with little puff of air.', en: '“p” in “spin”', es: '“p” in “papá”' },
      { kind: 'consonant', label: 'Without: פ', sym: 'f', ipa: 'f', type: 'Voiceless labiodental fricative', how: 'Top teeth on the lower lip.', en: '“f” in “fun”', es: '“f” in “fuego”' },
    ],
  },
  { id: 'tsadi', ch: 'צ', name: 'tsadi', he: 'צָדִי', r: 'ts', say: 'צָ', parts: [{ kind: 'consonant', sym: 'ts', ipa: 'ts', type: 'Voiceless alveolar affricate', how: 'A t released straight into an s.', en: '“ts” in “cats”, even at the start of a word', es: 'No Spanish match: “ts” as in “tsunami”' }], notes: ['With an apostrophe (צ׳) it spells “ch” in words like צ׳יפס (chips).'] },
  { id: 'kuf', ch: 'ק', name: 'kuf', he: 'קוֹף', r: 'k', hint: 'kuf', say: 'קָ', parts: [{ kind: 'consonant', sym: 'k', ipa: 'k', type: 'Voiceless velar stop', how: 'Back of the tongue against the soft palate.', en: '“k” in “skin”', es: '“c” in “casa”' }], notes: ['Sounds the same as כּ (kaf with a dot).'] },
  { id: 'resh', ch: 'ר', name: 'resh', he: 'רֵישׁ', r: 'r', say: 'רָ', parts: [{ kind: 'consonant', sym: 'r', ipa: 'ʁ', type: 'Voiced uvular fricative', how: 'Made at the very back of the mouth, like a soft gargle, as in French.', en: 'The French r in “Paris”', es: 'Not the Spanish r: it’s made in the throat, close to a soft, voiced “j”' }] },
  {
    id: 'shin', ch: 'ש', name: 'shin / sin', he: 'שִׁין', r: 'sh / s', say: 'שָׁ',
    parts: [
      { kind: 'consonant', label: 'Dot on the right: שׁ', sym: 'sh', ipa: 'ʃ', type: 'Voiceless postalveolar fricative', how: 'Lips slightly rounded, tongue behind the ridge.', en: '“sh” in “ship”', es: 'No standard Spanish match; like the “sh” in Rioplatense “calle”' },
      { kind: 'consonant', label: 'Dot on the left: שׂ', sym: 's', ipa: 's', type: 'Voiceless alveolar fricative', how: 'A plain s.', en: '“s” in “see”', es: '“s” in “sí”' },
    ],
    notes: ['Without dots you can’t tell sh from s by sight; most words have sh.'],
  },
  { id: 'tav', ch: 'ת', name: 'tav', he: 'תָּו', r: 't', hint: 'tav', say: 'תָּ', parts: [{ kind: 'consonant', sym: 't', ipa: 't', type: 'Voiceless alveolar stop', how: 'Tongue tip behind the top teeth.', en: '“t” in “stop”', es: '“t” in “tú”' }], notes: ['Sounds the same as ט (tet).'] },
];

// Five letters change shape at the end of a word.
const FINALS = [
  { id: 'kaf-sofit', ch: 'ך', of: 'kaf', name: 'final khaf', he: 'כַּף סוֹפִית', r: 'kh', say: 'לֶךְ', example: 'לֶךְ (lekh, go!)' },
  { id: 'mem-sofit', ch: 'ם', of: 'mem', name: 'final mem', he: 'מֵם סוֹפִית', r: 'm', say: 'שָׁלוֹם', example: 'שָׁלוֹם (shalom)' },
  { id: 'nun-sofit', ch: 'ן', of: 'nun', name: 'final nun', he: 'נוּן סוֹפִית', r: 'n', say: 'בֵּן', example: 'בֵּן (ben, son)' },
  { id: 'pe-sofit', ch: 'ף', of: 'pe', name: 'final fe', he: 'פֵּא סוֹפִית', r: 'f', say: 'כַּף', example: 'כַּף (kaf, spoon)' },
  { id: 'tsadi-sofit', ch: 'ץ', of: 'tsadi', name: 'final tsadi', he: 'צָדִי סוֹפִית', r: 'ts', say: 'עֵץ', example: 'עֵץ (ets, tree)' },
];

// Dotted forms, each its own card: the dot changes the sound.
const DOTTED = [
  { id: 'bet-dot', ch: 'ב' + DAGESH, of: 'bet', r: 'b', say: 'בָּ', part: 0, note: 'With the dot: b. Without: v.' },
  { id: 'kaf-dot', ch: 'כ' + DAGESH, of: 'kaf', r: 'k', say: 'כָּ', part: 0, note: 'With the dot: k. Without: kh, like ח.' },
  { id: 'pe-dot', ch: 'פ' + DAGESH, of: 'pe', r: 'p', say: 'פָּ', part: 0, note: 'With the dot: p. Without: f.' },
  { id: 'shin-dot', ch: 'ש' + SHIN_DOT, of: 'shin', r: 'sh', say: 'שָׁ', part: 0, note: 'Dot on the right: sh (shin).' },
  { id: 'sin-dot', ch: 'ש' + SIN_DOT, of: 'shin', r: 's', say: 'שָׂ', part: 1, note: 'Dot on the left: s (sin).' },
];

const byId = Object.fromEntries(LETTERS.map((l) => [l.id, l]));

const letterItem = (l) => ({
  id: l.id, char: l.ch, romaji: l.r, hint: l.hint || '', name: l.he, nameRomaji: l.name, say: l.say,
  ipa: l.parts.map((p) => p.ipa).join(' / '),
  parts: l.parts, notes: l.notes || [],
});
const finalItem = (f) => {
  const base = byId[f.of];
  const part = base.parts[base.parts.length > 1 && f.of !== 'pe' && f.of !== 'kaf' ? 0 : base.parts.length - 1];
  return {
    id: f.id, char: f.ch, romaji: f.r, hint: `${f.name}, at the end of a word`, name: f.he, nameRomaji: f.name, say: f.say,
    ipa: part.ipa, parts: [{ ...part, label: `Final form of ${base.ch}` }],
    notes: [`The form ${base.ch} takes at the end of a word, as in ${f.example}.`, f.of === 'kaf' ? 'At the end of a word it’s almost always kh.' : ''].filter(Boolean),
  };
};
const dottedItem = (d) => {
  const base = byId[d.of];
  const p = base.parts[d.part];
  return { id: d.id, char: d.ch, romaji: d.r, hint: '', say: d.say, ipa: p.ipa, parts: [p], notes: [d.note], noProd: true };
};

// ---------- vowel points (niqqud), shown on מ (and א for the reduced vowels) ----------

const V = {
  a: { sym: 'a', ipa: 'a', type: 'Open central vowel', how: 'Mouth open, tongue low.', en: '“a” in “father”', es: '“a” in “casa”: the same' },
  e: { sym: 'e', ipa: 'e', type: 'Mid front vowel', how: 'Tongue halfway up and forward.', en: '“e” in “bed”', es: '“e” in “mesa”: the same' },
  i: { sym: 'i', ipa: 'i', type: 'Close front vowel', how: 'Tongue high and forward.', en: '“ee” in “see”', es: '“i” in “sí”: the same' },
  o: { sym: 'o', ipa: 'o', type: 'Mid back rounded vowel', how: 'Lips rounded, tongue back.', en: '“o” in “go”, without the w glide', es: '“o” in “solo”: the same' },
  u: { sym: 'u', ipa: 'u', type: 'Close back rounded vowel', how: 'Lips rounded and pushed out.', en: '“oo” in “food”', es: '“u” in “tú”: the same' },
  shva: { sym: 'e or silent', ipa: 'e ~ ∅', type: 'Reduced vowel', how: 'Usually silent; at the start of a word it’s often a quick e.', en: 'A quick, light “e”, or nothing', es: 'A quick “e”, or nothing' },
};

const POINTS = [
  { id: 'patach', ch: 'מַ', name: 'patach', he: 'פַּתָּח', v: 'a', note: 'A short line under the letter.' },
  { id: 'kamatz', ch: 'מָ', name: 'kamatz', he: 'קָמָץ', v: 'a', note: 'A small T under the letter. Said a, the same as patach (in a few closed syllables it’s o).' },
  { id: 'segol', ch: 'מֶ', name: 'segol', he: 'סֶגּוֹל', v: 'e', note: 'Three dots in a triangle.' },
  { id: 'tsere', ch: 'מֵ', name: 'tsere', he: 'צֵירֵי', v: 'e', note: 'Two dots side by side. Said e, often ei before י.' },
  { id: 'chirik', ch: 'מִ', name: 'chirik', he: 'חִירִיק', v: 'i', note: 'One dot under the letter, often followed by י: מִי is “mi”.' },
  { id: 'cholam', ch: 'מֹ', name: 'cholam', he: 'חוֹלָם', v: 'o', note: 'A dot above, at the top left of the letter.' },
  { id: 'cholam-male', ch: 'מוֹ', name: 'cholam male', he: 'חוֹלָם מָלֵא', v: 'o', note: 'A vav with a dot on top: the same o, spelled with a letter.' },
  { id: 'kubutz', ch: 'מֻ', name: 'kubutz', he: 'קֻבּוּץ', v: 'u', note: 'Three slanted dots under the letter.' },
  { id: 'shuruk', ch: 'מוּ', name: 'shuruk', he: 'שׁוּרוּק', v: 'u', note: 'A vav with a dot inside: the same u, spelled with a letter.' },
  { id: 'shva', ch: 'מְ', name: 'shva', he: 'שְׁוָא', v: 'shva', note: 'Two dots stacked vertically.' },
  { id: 'chataf-patach', ch: 'אֲ', name: 'chataf patach', he: 'חֲטַף פַּתָּח', v: 'a', note: 'Shva plus patach: a short a, mostly under א ה ח ע.' },
  { id: 'chataf-segol', ch: 'אֱ', name: 'chataf segol', he: 'חֲטַף סֶגּוֹל', v: 'e', note: 'Shva plus segol: a short e.' },
  { id: 'chataf-kamatz', ch: 'אֳ', name: 'chataf kamatz', he: 'חֲטַף קָמָץ', v: 'o', note: 'Shva plus kamatz: a short o. Rare.' },
];

const pointItem = (p) => {
  const carrier = p.ch[0] === 'א' ? '' : 'm';
  const vr = p.v === 'shva' ? 'e' : p.v;
  return {
    id: p.id, char: p.ch, romaji: `${carrier}${p.v === 'shva' ? '(e)' : vr}`, name: p.he, nameRomaji: p.name, nameLabel: 'Vowel point', say: p.ch,
    ipa: (carrier ? 'm' : '') + V[p.v].ipa, hint: '', noProd: true,
    parts: [
      ...(carrier ? [{ kind: 'consonant', ...byId.mem.parts[0] }] : [{ ...silentPart('Here just a seat for the vowel.') }]),
      { kind: 'vowel', label: `Vowel point: ${p.name}`, ...V[p.v] },
    ],
    notes: [p.note, 'Vowel points (niqqud) appear in children’s books, poetry and learner texts. Everyday Hebrew leaves them out.'],
    needs: [carrier ? 'mem' : 'alef', ...(p.ch.includes('ו') ? ['vav'] : [])],
  };
};

// ---------- words ----------

const WORDS = [
  ['שָׁלוֹם', 'shalom', 'hello; peace', 'hola; paz'], ['תּוֹדָה', 'toda', 'thank you', 'gracias'], ['כֵּן', 'ken', 'yes', 'sí'], ['לֹא', 'lo', 'no', 'no'],
  ['מַיִם', 'mayim', 'water', 'agua'], ['לֶחֶם', 'lechem', 'bread', 'pan'], ['אֹכֶל', 'okhel', 'food', 'comida'], ['בַּיִת', 'bayit', 'house', 'casa'],
  ['אִמָּא', 'ima', 'mom', 'mamá'], ['אַבָּא', 'aba', 'dad', 'papá'], ['יֶלֶד', 'yeled', 'boy, child', 'niño'], ['יַלְדָּה', 'yalda', 'girl', 'niña'],
  ['סֵפֶר', 'sefer', 'book', 'libro'], ['עִיר', 'ir', 'city', 'ciudad'], ['אֶרֶץ', 'erets', 'land; country', 'tierra; país'], ['שֶׁמֶשׁ', 'shemesh', 'sun', 'sol'],
  ['יָם', 'yam', 'sea', 'mar'], ['עֵץ', 'ets', 'tree', 'árbol'], ['כֶּלֶב', 'kelev', 'dog', 'perro'], ['חָתוּל', 'chatul', 'cat', 'gato'],
  ['יוֹם', 'yom', 'day', 'día'], ['לַיְלָה', 'layla', 'night', 'noche'], ['בֹּקֶר', 'boker', 'morning', 'mañana'], ['עֶרֶב', 'erev', 'evening', 'tarde, noche'],
  ['טוֹב', 'tov', 'good', 'bueno'], ['גָּדוֹל', 'gadol', 'big', 'grande'], ['קָטָן', 'katan', 'small', 'pequeño'], ['חָבֵר', 'chaver', 'friend', 'amigo'],
  ['אַהֲבָה', 'ahava', 'love', 'amor'], ['מִשְׁפָּחָה', 'mishpacha', 'family', 'familia'], ['שֻׁלְחָן', 'shulchan', 'table', 'mesa'], ['כִּסֵּא', 'kise', 'chair', 'silla'],
  ['דֶּלֶת', 'delet', 'door', 'puerta'], ['חַלּוֹן', 'chalon', 'window', 'ventana'], ['עִבְרִית', 'ivrit', 'Hebrew', 'hebreo'], ['יִשְׂרָאֵל', 'yisra’el', 'Israel', 'Israel'],
  ['קָפֶה', 'kafe', 'coffee', 'café'], ['חָלָב', 'chalav', 'milk', 'leche'], ['בְּבַקָּשָׁה', 'bevakasha', 'please; you’re welcome', 'por favor; de nada'],
  ['סְלִיחָה', 'slicha', 'excuse me; sorry', 'perdón, disculpe'], ['מָה', 'ma', 'what', 'qué'], ['מִי', 'mi', 'who', 'quién'], ['אֵיפֹה', 'eifo', 'where', 'dónde'],
  ['עַכְשָׁיו', 'akhshav', 'now', 'ahora'], ['רֹאשׁ', 'rosh', 'head', 'cabeza'],
];

// Strip vowel points and other marks, leaving the letters.
export const stripPoints = (s) => s.replace(/[֑-ׇ]/g, '');
const letterIdByChar = Object.fromEntries([...LETTERS.map((l) => [l.ch, l.id]), ...FINALS.map((f) => [f.ch, f.id])]);
const lettersIn = (text) => [...new Set([...stripPoints(text)].map((c) => letterIdByChar[c]).filter(Boolean))];

// Split a pointed word into letter clusters with a rough reading of each, for the answer side.
const VOWEL_MARK = { 'ַ': 'a', 'ָ': 'a', 'ֶ': 'e', 'ֵ': 'e', 'ִ': 'i', 'ֹ': 'o', 'ֻ': 'u', 'ֲ': 'a', 'ֱ': 'e', 'ֳ': 'o', 'ְ': '' };
function breakdown(text) {
  const clusters = text.match(/[א-ת][֑-ׇ]*/g) || [];
  return clusters.map((c, i) => {
    const base = c[0];
    const marks = c.slice(1);
    const dot = marks.includes(DAGESH);
    let cons = {
      א: '', ב: dot ? 'b' : 'v', ג: 'g', ד: 'd', ה: i === clusters.length - 1 ? '' : 'h', ו: 'v', ז: 'z', ח: 'ch', ט: 't', י: 'y', כ: dot ? 'k' : 'kh', ך: 'kh', ל: 'l', מ: 'm', ם: 'm', נ: 'n', ן: 'n',
      ס: 's', ע: '', פ: dot ? 'p' : 'f', ף: 'f', צ: 'ts', ץ: 'ts', ק: 'k', ר: 'r', ש: marks.includes(SIN_DOT) ? 's' : 'sh', ת: 't',
    }[base] ?? '';
    if (base === 'ו' && marks.includes('ֹ')) return { ch: c, r: 'o' };
    if (base === 'ו' && dot) return { ch: c, r: 'u' };
    if (base === 'י' && !marks && i > 0) cons = '';
    const vowel = [...marks].map((m) => VOWEL_MARK[m]).find((v) => v !== undefined) || '';
    return { ch: c, r: cons + vowel };
  });
}

// ---------- export ----------

const letterGroups = [
  { id: 'l1', name: 'א to ו', ids: ['alef', 'bet', 'gimel', 'dalet', 'he', 'vav'], base: true },
  { id: 'l2', name: 'ז to ל', ids: ['zayin', 'chet', 'tet', 'yod', 'kaf', 'lamed'], base: true },
  { id: 'l3', name: 'מ to צ', ids: ['mem', 'nun', 'samekh', 'ayin', 'pe', 'tsadi'], base: true },
  { id: 'l4', name: 'ק to ת', ids: ['kuf', 'resh', 'shin', 'tav'], base: true },
];

const letters = {
  id: 'he-letters', script: 'he', kind: 'chars', name: 'Hebrew letters', native: 'אָלֶף־בֵּית', lang: 'he-IL', htmlLang: 'he', writeIn: 'Hebrew letters',
  blurb: 'The 22 letters and 5 final forms in print, plus the dots that change b to v, k to kh, p to f and sh to s. Start here.',
  groups: [
    ...letterGroups.map((g) => ({ id: g.id, name: g.name, base: true, items: g.ids.map((id) => letterItem(byId[id])) })),
    { id: 'finals', name: 'Final forms', base: true, items: FINALS.map(finalItem) },
    { id: 'dots', name: 'Dots that change the sound', items: DOTTED.map(dottedItem) },
  ],
  keyboardRows: ['קראטוןםפ', 'שדגכעיחלךף', 'זסבהנמצתץ'],
};
const points = {
  id: 'he-points', script: 'he', kind: 'chars', name: 'Vowel points', native: 'נִקּוּד', lang: 'he-IL', htmlLang: 'he', after: 'he-letters', needsDeck: 'he-letters',
  blurb: 'The dots and dashes that show vowels in learner texts. All five vowels are the Spanish ones.',
  groups: [
    { id: 'pa', name: 'a and e', items: POINTS.filter((p) => ['patach', 'kamatz', 'segol', 'tsere'].includes(p.id)).map(pointItem) },
    { id: 'pi', name: 'i, o and u', items: POINTS.filter((p) => ['chirik', 'cholam', 'cholam-male', 'kubutz', 'shuruk'].includes(p.id)).map(pointItem) },
    { id: 'ps', name: 'Shva and short vowels', items: POINTS.filter((p) => p.id === 'shva' || p.id.startsWith('chataf')).map(pointItem) },
  ],
};
const words = {
  id: 'he-words', script: 'he', kind: 'words', name: 'Hebrew words', native: 'מִלִּים', lang: 'he-IL', htmlLang: 'he', requires: 'he-letters',
  blurb: 'Everyday words with vowel points, using only the letters you know.',
  items: WORDS.map(([text, romaji, en, es], i) => ({ id: `w${i}-${romaji.replace(/[^a-z]/g, '')}`, text, romaji, en, es, say: text, plain: stripPoints(text) })),
  needsOf: lettersIn,
  breakdown,
  unitCount: (text) => stripPoints(text).length,
};
const cursive = {
  id: 'he-cursive', script: 'he', kind: 'chars', name: 'Cursive', native: 'כְּתַב יָד', lang: 'he-IL', htmlLang: 'he', after: 'he-letters', cursive: true,
  blurb: 'The handwritten letters Israelis use day to day. Their shapes differ a lot from print.',
  groups: [
    ...letterGroups.map((g) => ({ id: `c${g.id}`, name: g.name, items: g.ids.map((id) => ({ ...letterItem(byId[id]), noProd: true, notes: [`Print form: ${byId[id].ch}`, ...(byId[id].notes || [])] })) })),
    { id: 'cfinals', name: 'Final forms', items: FINALS.map((f) => ({ ...finalItem(f), noProd: true })) },
  ],
};

export const HEBREW = {
  id: 'he', name: 'Hebrew', native: 'עברית', lang: 'he-IL', htmlLang: 'he',
  intro: 'Hebrew reads right to left and writes mostly consonants; vowels are optional dots and dashes. Good news for a Spanish speaker: Hebrew has exactly the five Spanish vowels, and ח and כ are the Spanish “j” in “jota”.',
  decks: [letters, points, words, cursive],
};
