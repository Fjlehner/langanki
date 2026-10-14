# LangAnki

Anki-style flashcards for learning writing systems: Japanese hiragana and katakana, Korean Hangul and Hebrew now, with Hindi (Devanagari) to follow. Every character comes with a pronunciation guide: IPA, a consonant and vowel breakdown, and the closest sounds in English and Spanish.

## What's in this build

- **Language tabs:** the overview has a tab per language with a count of cards waiting; each tab has its own Today card, progress and decks.
- **Hebrew:** a print letters deck (22 letters, 5 final forms, and the dotted pairs בּ/ב, כּ/כ, פּ/פ, שׁ/שׂ), a vowel points deck (13 niqqud marks on מ and א), a words deck (45 words shown with vowel points, plus their unpointed spelling), and a cursive deck (Gveret Levin font, hosted in `public/fonts` under the OFL). Points, words and cursive unlock after the 27 print letters. Hebrew text is right to left; writing cards use the Hebrew keyboard (standard layout on the desktop on-screen keyboard).
- **Korean:** a Hangul letters deck (14 basic and 5 tense consonants, 21 vowels, each with letter name and its sound at the start and end of a block), a syllable-blocks deck (156 blocks, from simple pairs to finals and double finals) that unlocks after the 24 basic letters, and a Korean words deck. Romanization is Revised Romanization; word cards show block-by-block spelling and note sound changes. Desktop gets a two-set (dubeolsik) on-screen keyboard that composes blocks as you type. Korean doesn't depend on Japanese progress.

- **Decks:** hiragana and katakana (base characters, voiced forms, combinations like きゃ, small っ, long vowels, and katakana sounds for foreign words), plus a hiragana word deck and a katakana word deck with meanings in English and Spanish.
- **Two directions:** a recognition card (see the character, recall the sound) and a writing card (read or hear the sound, type the character). A writing card unlocks after its recognition card has graduated and been remembered at a later review.
- **Timed grading:** the app times how long you take to show the answer, and you only say whether you got it. A correct answer within 3 seconds counts as Easy, within 8 as Good, slower as Hard; a miss is Again. New and learning cards top out at Good. Writing cards are checked automatically and timed to the Check button (6 and 15 seconds), and word cards get extra time per character. Settings can switch to choosing Again, Hard, Good or Easy yourself, and any card can be graded by hand from the link under the buttons.
- **Scheduling:** FSRS-5 (the scheduler in current Anki) with Anki-style learning steps (1 and 10 minutes, 10 minutes after a lapse). The study day rolls over at 4 a.m. Target retention is 90% by default.
- **New cards:** 10 per day per script by default (hiragana and katakana separately), with the same allowance for writing cards. Adjustable and pausable per deck in Settings.
- **Hiragana first:** katakana unlocks once the 46 basic hiragana have graduated, so the two scripts aren't mixed at the start. It can be started early from the overview.
- **Word decks** unlock once all 46 base characters of a script have graduated. A word appears only when every character in it has.
- **Progress on the overview:** learned characters by deck (with how many you can write), weak spots (characters missed after their first hour, forgotten after being learned, or read slowly) with a button to practice just those, and up next (the next new characters per deck, unlock milestones and the next review).
- **Keep going when caught up:** "Learn 10 more new cards" raises today's new-card allowance for each open deck, and "Review early" studies up to 20 of the soonest-due cards ahead of schedule. Both appear on the overview and at the end of a session once nothing is due.
- **Start over:** Settings can reset a started deck (and its word deck) on every device.
- **Quiet mode:** recognition only, no sound, for places where audio isn't an option.
- **Typing:** phones and tablets use their own language keyboard. Desktops also get an on-screen kana keyboard laid out like a kana table.
- **Audio:** the browser's built-in voices. If a device has no voice for a language, play buttons are hidden. Recorded clips can be dropped in later through `RECORDINGS` in `public/js/speech.js`.
- **Codes instead of accounts:** a 10-character code saves progress on the server and opens it on other devices, with restore links, replacing and erasing.

## Run it locally

No build step. The site lives in `public/`:

```sh
cd public && python3 -m http.server 8000
```

Then open http://localhost:8000. Without the Worker, progress stays on the device and codes are unavailable.

## Deploy on Cloudflare

The site deploys as the Cloudflare Worker `langanki` (see `wrangler.jsonc`). It serves the static files in `public/`, and `src/worker.js` answers `/api/*` using the D1 database `langanki`. With Workers Builds connected to this repository, every push to `main` redeploys it with `npx wrangler deploy`. No build command is needed.

To run everything locally with a local database:

```sh
npx wrangler d1 execute langanki --local --file schema.sql
npx wrangler dev --port 8787
```

## Tests

```sh
pip install playwright && python3 -m playwright install chromium
python3 tests/e2e.py                                  # phone and desktop walk-through, several simulated days
python3 tests/sync_e2e.py http://127.0.0.1:8787       # codes and sync across devices, against wrangler dev
```

## Files

| Path | What it does |
| --- | --- |
| `public/index.html`, `public/styles.css` | Page shell and all styling, light and dark |
| `public/js/app.js` | Screens, study player, settings, codes and sync wiring |
| `public/js/scripts/japanese.js` | Hiragana and katakana data, pronunciation parts, word lists, keyboard layouts |
| `public/js/scripts/hebrew.js` | Hebrew letters, vowel points, words and cursive |
| `public/fonts/` | Gveret Levin cursive Hebrew font and its license |
| `public/js/scripts/korean.js` | Hangul letters, syllable blocks and words; block composition and romanization |
| `public/js/scripts/index.js` | All scripts and decks, study scopes and word helpers; Hebrew and Hindi are listed as coming next |
| `public/js/fsrs.js` | FSRS-5 scheduler and learning steps |
| `public/js/progress.js` | Learned, weak spots and up next for the overview |
| `public/js/study.js` | Which cards exist and are unlocked, daily limits, the study queue |
| `public/js/store.js` | Local progress storage |
| `public/js/sync.js` | Codes, saving to the server and merging two devices' progress |
| `public/js/speech.js` | Pronunciation audio |
| `public/js/device.js` | Phone versus desktop detection, and a test clock |
| `src/worker.js` | Sync API on Cloudflare |
| `schema.sql` | Database tables |
| `wrangler.jsonc` | Cloudflare deploy settings |
