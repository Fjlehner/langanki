# LangAnki: project handoff

Paste or attach this file in a new chat to pick the project up where it left off. Last updated October 13, 2026.

## What it is

LangAnki is a free, browser-based flashcard app for learning writing systems, built like Anki. Japanese hiragana and katakana, Korean Hangul and Hebrew are built; Hindi (Devanagari) comes next. It's a personal project for Joe, shared with family and friends, and runs on Cloudflare's free `workers.dev` address. It's a sibling of Unlearn (`Fjlehner/unlearn_h_and_t`) and reuses its code system.

## Where things live

| Thing | Where |
| --- | --- |
| Code | GitHub: `Fjlehner/langanki`, branch `main` |
| Live site | Cloudflare Worker `langanki` (open it in the Cloudflare dashboard and click Visit for the exact address) |
| Deploys | Workers Builds, if connected to the repo, redeploys on every push to `main` with `npx wrangler deploy`. No build step. |
| Database | Cloudflare D1 database `langanki`, ID `37613138-7744-4ba7-993c-f88cbb1a2ee5`, bound as `DB`. Tables created. |

## Decisions Joe made

- **Both card directions.** Recognition (see the character, recall the sound) and production (from the sound, produce the character). Production unlocks per character once recognition is reliable.
- **Quiet mode.** Recognition only, no audio, for the office.
- **Pronunciation guide for every character:** IPA, consonant and vowel mapping, and the closest sounds in English and Spanish (Joe speaks both).
- **Timed grading** (changed from self-grading at Joe's request): the learner only says Missed it or Got it, and a correct answer's grade comes from the time to Show answer. Thresholds are in `TIMING` in `app.js` (reading: Easy within 3 s, Good within 8 s, else Hard; writing: 6 s and 15 s; +1.5 s or +3 s per extra character in words). Easy is only given to cards past learning. Settings has a "Choose myself" option with all four grades. The answer time is stored in the review log as `ms`.
- **Production input:** the device's own language keyboard on phones and tablets; on desktops, also a clickable on-screen keyboard. The on-screen keyboard never appears on phones or tablets.
- **FSRS** scheduling. **10 new cards per day per script**, adjustable.
- **Audio:** built-in browser speech now, recorded clips later where a voice sounds poor.
- **Scope:**
  - Japanese: 46 base kana per script, voiced forms, combinations, small っ, long vowels, katakana extensions. Kanji is out of scope (likely a separate app).
  - Korean: individual letters first (14 basic and 5 doubled consonants, 21 vowels), then a curated few hundred common syllable blocks with final consonants and their sound changes.
  - Hebrew: 22 letters plus 5 final forms, dot-changed letters (בּ/ב, כּ/כ), vowel points on letters. Print first, then cursive as its own deck.
  - Hindi: vowels, ~33 consonants, matras, nukta letters, common conjuncts (क्ष, त्र, ज्ञ, श्र, क्य, स्त).
- **Word decks** unlock after a script's basics, with meanings in English and Spanish, using only learned characters.
- **Romanization:** Hepburn (Japanese), Revised Romanization (Korean), a simple readable scheme (Hebrew), simplified ISO 15919 with long vowels and retroflex marks (Hindi).
- **Phone first**, still comfortable on desktop.
- **One code per person** covering all scripts, separate from Unlearn codes.
- **Japanese first**, built so the other scripts are mostly data.
- **Hiragana before katakana.** Katakana stays locked until the 46 basic hiragana are learned, so the two scripts aren't mixed at the start. The locked deck has a "Start katakana now" button, and any katakana progress keeps it unlocked.

## How it's built

Static single-page app (no framework, no build step) plus a small Worker for sync. See README.md for the file list.

- Each script is a module in `public/js/scripts/` exporting decks. A character deck has `groups` of items `{ id, char, romaji, ipa, parts, notes, hint, say, noProd }`; `parts` are the consonant, glide and vowel pieces with `type`, `how`, `en`, `es`. A word deck has `requires` (its character deck) and items `{ text, romaji, en, es }`. Adding a script means writing its module and adding it to `scripts/index.js`.
- `keyboard` on a character deck lists rows of 5 for the desktop on-screen keyboard (shown as a table, rows across and vowels down).
- A character deck can have `after` (another deck id): it stays locked until that deck's base characters have graduated, unless `settings.unlocked[deckId]` is set or the deck already has cards.
- **Progress panels** on the overview (`progress.js`): learned per deck, weak spots scored from the last 30 days of the review log (misses after a card's first hour, lapses, relearning, slow average reading time over `TIMING.r.good`), and up next. "Practice these" starts a `Session` with `{ ids }`, studying those cards whether or not they're due.
- **Learn more / review early** (added because the daily limit felt too tight): `daily[day]['<deck>:extra']` raises a deck's new-card allowance for the day; `Session` with `{ ahead: true }` studies up to 20 review cards not yet due, soonest first.
- **Start a deck over:** Settings has a reset button per started character deck (it also clears that deck's word deck). `state.resets[deckId]` keeps the reset time, and merging drops any card for that deck last reviewed before it, so another device can't bring the old progress back.
- Card ids are `deck:item:dir`, with `dir` `r` or `p`.
- FSRS-5 default parameters; learning steps 1 and 10 minutes, relearning 10 minutes; day rolls over at 4 a.m. Production unlocks when the recognition card is in review with at least 3 reps (graduated, then passed a later review).
- Progress: localStorage key `langanki.v1`. Sync API and code format are the same as Unlearn's, with header `X-LangAnki-Code` and hash prefix `langanki:`. Merging keeps each card's most recently reviewed copy.
- Test hooks: `?device=mobile` or `?device=desktop` forces device detection for the tab; `sessionStorage['langanki.clockOffset']` shifts the clock.

## Korean (built October 13, 2026)

- `scripts/korean.js`: decks `hangul` (40 letters; the 24 in the first five groups are the "basic" set), `hangul-blocks` (156 curated blocks in 16 groups, `after: 'hangul'`, each block's `needs` lists the letters it uses) and `ko-words` (55 words, `needsOf` decomposes words into letters).
- Letters carry `name`/`nameRomaji` (기역, giyeok) and guide parts of kind `initial` and `final`. Tense ㄸ ㅃ ㅉ have no final part.
- Romanization: Revised Romanization; letters show both positions (g / k). Blocks are romanized on their own; words use pronounced RR (한국어 hangugeo) and the card notes when that differs from block-by-block spelling.
- `compose`/`decompose`/`typeKey`/`deleteKey` implement two-set keyboard composition (including combined vowels, double finals and a final moving to the next block before a vowel). The desktop keyboard is the dubeolsik layout plus rows for tense consonants and combined vowels.
- Fonts: Gowun Dodum (textbook) and Noto Sans KR (print), applied by `:lang(ko)`.
- Joe asked that Korean not depend on Japanese progress; each script's decks unlock only from within the script.
- The overview has a tab per language at the top (Joe's request), with a badge for cards waiting; Hebrew and Hindi tabs say they're coming next. The selected tab (`settings.tab`) shows that language's Today card, progress panels and decks, and is remembered. Study scopes are script ids (`ja`, `ko`) or deck ids.

## Hebrew (built October 14, 2026)

- `scripts/hebrew.js`: decks `he-letters` (27 print letters as the base set, plus 5 dotted forms that are recognition only), `he-points` (13 vowel points shown on מ or א; recognition only, since typing points is impractical on phones), `he-words` (45 words with points; the card also shows the unpointed spelling; `needsOf` strips points to find letters) and `he-cursive` (the 27 letters in cursive; recognition only). Points, words and cursive unlock after the 27 print letters, with a start-early button.
- Two-sound letters (ב כ פ ש) carry two guide parts with `label`s such as "With a dot: בּ". ח is romanized ch and כ without a dot kh; letters that share a sound (ט/ת, כּ/ק, ס/שׂ, א/ע) show their name as a hint on writing cards.
- Fonts: Frank Ruhl Libre (textbook style, clear vowel points), Noto Sans Hebrew (print), and Gveret Levin for cursive, self-hosted in `public/fonts` (OFL) so cursive never falls back to print. Hebrew elements get `direction: rtl`; decks have `rtl: true`.
- Pronunciation is modern Israeli: ר is a uvular [ʁ], ע usually silent, ח/כ = Spanish “j” in “jota”.

## Known gaps and ideas for next

- **Review the Hangul section with Joe in detail** (he asked to do this at another time).

- Build Hindi.
- Stroke order for kana.
- Recorded audio where browser voices are poor (`RECORDINGS` in `speech.js`).
- Fonts for the other scripts (for example Noto Sans KR, Noto Sans Hebrew, Noto Sans Devanagari) and a cursive Hebrew font.
- Tune the `TIMING` thresholds once real answer times are in the log.
- FSRS parameter optimization from the review log once there's enough history.

## Working on it

```sh
pip install playwright && python3 -m playwright install chromium
python3 tests/e2e.py
npx wrangler d1 execute langanki --local --file schema.sql
npx wrangler dev --port 8787 &
python3 tests/sync_e2e.py http://127.0.0.1:8787
```

Run both suites before pushing.

## Working with Joe

- Ask clarifying questions one at a time.
- When walking him through setup or troubleshooting, give one step at a time and wait for his result before the next.
- He tests on the live site from a desktop browser and on his phone.
