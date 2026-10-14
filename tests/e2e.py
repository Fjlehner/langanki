"""End-to-end walk through LangAnki in headless Chromium, on a phone and on a desktop.

Run from the repository root:
    python3 tests/e2e.py [screenshot_dir]

Serves ./public itself (no sync server, so codes are skipped), studies hiragana over
several simulated days, checks that writing cards and the word deck unlock, uses the
desktop on-screen keyboard, and saves screenshots in light and dark mode.
"""
import json
import os
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "tests", "screens")
PORT = 8766
BASE = f"http://localhost:{PORT}/"
DAY_MS = 24 * 3600 * 1000
os.makedirs(OUT, exist_ok=True)

server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], cwd=os.path.join(ROOT, "public"),
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.8)
errors = []

ANSWER_JS = """async () => {
  const { deckById } = await import('/js/scripts/index.js');
  const label = document.querySelector('.card__label span').textContent;
  const deck = label.startsWith('Katakana') ? deckById('kata') : deckById('hira');
  const romaji = document.querySelector('.prompt__romaji').textContent;
  const hint = document.querySelector('.prompt__hint')?.textContent || '';
  const item = deck.items.find((it) => it.romaji === romaji && (it.hint || '') === hint);
  return item ? item.char : null;
}"""


def shot(page, name):
    page.screenshot(path=os.path.join(OUT, f"{name}.png"), full_page=False)


def set_clock(page, offset_ms):
    page.evaluate(f"sessionStorage.setItem('langanki.clockOffset', '{int(offset_ms)}')")


def state(page):
    return json.loads(page.evaluate("localStorage.getItem('langanki.v1')"))


GOT_IT = ".study__actions [data-autofocus][data-grade]"


def study_all(page, grade=None, max_cards=200, type_answers=True, on_card=None, wrong_every=0):
    """Answer every card in the session. Returns how many of each direction were seen."""
    seen = {"r": 0, "p": 0}
    for i in range(max_cards):
        if page.locator(".finished").count():
            return seen
        page.wait_for_selector(".card")
        is_prod = page.locator("#typed").count() > 0
        if on_card:
            on_card(page, i, is_prod)
        if is_prod:
            seen["p"] += 1
            answer = page.evaluate(ANSWER_JS)
            assert answer, "couldn't find the expected answer"
            if wrong_every and seen["p"] % wrong_every == 0:
                page.fill("#typed", "x")
            else:
                page.fill("#typed", answer)
            page.click("[data-act=check]")
            if page.locator("[data-act=override]").count():
                page.click("[data-grade='1']")
                continue
            assert page.locator(".result--ok").count() == 1, "typed answer should be correct"
        else:
            if page.locator("[data-act=reveal]").count():
                seen["r"] += 1
                page.click("[data-act=reveal]")
        page.click(GOT_IT if grade is None else f"[data-grade='{grade}']")
    raise AssertionError("session never finished")


try:
    with sync_playwright() as p:
        browser = p.chromium.launch()

        # ---------------- phone ----------------
        phone = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        page = phone.new_page()
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" and "Failed to load resource" not in m.text else None)
        page.goto(BASE + "?device=mobile")
        page.wait_for_selector(".welcome")
        shot(page, "01-phone-welcome")
        assert page.locator(".qr").count() == 0, "no QR code on phones"

        page.click("text=I have a code")
        page.fill("#restore-code", "abc")
        page.click(".restore button[type=submit]")
        assert page.is_visible("#restore-error"), "bad code should show an error"

        page.click("[data-act=start]")
        page.wait_for_selector(".today")
        shot(page, "02-phone-home")
        # Katakana waits for hiragana: only hiragana is offered at the start.
        assert page.locator("[data-study=kata]").count() == 0, "katakana should start locked"
        assert page.locator("[data-act=unlock-early][data-deck=kata]").count() == 1
        assert page.locator(".tab").count() == 4, "a tab per language"
        assert page.locator(".tab--soon").count() == 1, "only Hindi is still coming"
        assert page.get_attribute(".tab.is-active", "data-tab") == "ja"
        assert "10 new cards" in page.inner_text(".today__line")

        # Day 0: first study session.
        page.click("[data-study=hira]")
        page.wait_for_selector(".card")
        assert page.locator(".tag--new").count() == 1
        shot(page, "03-phone-card-front")
        page.click("[data-act=reveal]")
        assert page.locator(".guide[open]").count() == 1, "new cards show the guide open"
        assert page.locator(".part").count() >= 1
        shot(page, "04-phone-card-back")
        page.screenshot(path=os.path.join(OUT, "04b-phone-card-back-full.png"), full_page=True)
        # Timed grading: only "Missed it" and "Got it", and a new card tops out at Good.
        assert page.locator(".study__actions [data-grade]").count() == 2
        assert page.get_attribute(GOT_IT, "data-grade") == "3", "a new card answered fast counts as Good"
        assert "Answered in" in page.inner_text(".timing")
        # Undo returns to the same card's front.
        page.click(GOT_IT)
        page.click("[data-act=undo]")
        assert page.locator("[data-act=reveal]").count() == 1
        seen = study_all(page)
        assert all(k.startswith("hira:") for k in state(page)["cards"]), "no katakana before hiragana"
        assert seen["r"] >= 10 and seen["p"] == 0, seen  # each new card is seen at both learning steps
        shot(page, "05-phone-finished")
        # Caught up: learn more new cards today.
        page.click("[data-act=learn-more][data-scope=ja]")
        page.wait_for_selector(".card")
        seen_more = study_all(page)
        assert len([k for k in state(page)["cards"] if k.startswith("hira:")]) == 20, "learn more adds another 10"
        page.click("[data-go=home]")
        assert page.locator("[data-act=review-ahead][data-scope=ja]").count() == 1
        shot(page, "05b-phone-caught-up")
        page.click("[data-act=review-ahead][data-scope=ja]")
        page.wait_for_selector(".card")
        study_all(page)

        # Phone production cards never show the on-screen keyboard.
        # Day 4: reviews come back; production still locked until the review is passed.
        set_clock(page, 4 * DAY_MS)
        page.goto(BASE)
        page.wait_for_selector(".today")
        txt = page.inner_text(".deck")
        shot(page, "06-phone-home-day4")
        page.click("[data-study=hira]")

        def no_keyboard(pg, i, is_prod):
            assert pg.locator(".kb").count() == 0, "phone must not show the on-screen keyboard"
            if is_prod and i < 40 and not os.path.exists(os.path.join(OUT, "07-phone-production.png")):
                shot(pg, "07-phone-production")

        checked = {"easy": False}

        def review_easy(pg, i, is_prod):
            no_keyboard(pg, i, is_prod)
            # Reviews answered fast count as Easy (new and learning cards top out at Good).
            if not is_prod and pg.locator("[data-act=reveal]").count():
                pg.click("[data-act=reveal]")
                g = pg.get_attribute(GOT_IT, "data-grade")
                if pg.locator(".tag--new").count():
                    assert g == "3", "a new card answered fast counts as Good"
                if g == "4":
                    checked["easy"] = True

        seen = study_all(page, on_card=review_easy)
        print("day 4 seen", seen)

        # Day 9: production cards are unlocked for items that passed a review.
        set_clock(page, 9 * DAY_MS)
        page.goto(BASE)
        page.click("[data-study=hira]")
        seen = study_all(page, on_card=review_easy, wrong_every=3)
        print("day 9 seen", seen)
        assert checked["easy"], "a fast review should have counted as Easy"

        # Progress panels: learned, weak spots (from the missed writing cards), up next.
        page.goto(BASE)
        page.wait_for_selector(".prog")
        assert page.locator(".prog__panel").count() == 3, "progress shows only for scripts with cards"
        assert page.locator(".chip-ch--learned, .chip-ch--strong").count() >= 10
        assert page.locator(".weak li").count() > 0, "missed cards should show as weak spots"
        assert page.locator(".chip-ch--next").count() > 0
        shot(page, "06b-phone-progress")
        page.locator(".prog").first.screenshot(path=os.path.join(OUT, "06c-phone-progress-panels.png"))
        page.click("[data-act=practice-weak][data-scope=ja]")
        page.wait_for_selector(".card")
        study_all(page)
        assert seen["p"] > 0, "writing cards should appear after a passed review"

        # Quiet mode: no writing cards, no play buttons.
        set_clock(page, 30 * DAY_MS)
        page.goto(BASE)
        page.check("#quiet", force=True)
        page.wait_for_timeout(100)
        assert state(page)["settings"]["quiet"] is True

        def quiet_check(pg, i, is_prod):
            assert not is_prod, "quiet mode must skip writing cards"
            assert pg.locator("[data-say]").count() == 0

        page.click("[data-study=ja]")
        seen = study_all(page, on_card=quiet_check)
        print("quiet seen", seen)
        page.goto(BASE)
        page.uncheck("#quiet", force=True)

        # Browse and guide.
        page.click("[data-browse=hira]")
        page.wait_for_selector(".tiles")
        shot(page, "08-phone-browse")
        page.click("[data-guide=fu]")
        page.wait_for_selector(".guide-page")
        assert "Bilabial" in page.inner_text(".guide-page") or "bilabial" in page.inner_text(".guide-page")
        assert "ES" in page.inner_text(".guide-page")
        shot(page, "09-phone-guide")
        page.screenshot(path=os.path.join(OUT, "09b-phone-guide-full.png"), full_page=True)

        # Words unlock once the 46 base hiragana have graduated.
        page.evaluate("""async () => {
          const { deckById } = await import('/js/scripts/index.js');
          const s = JSON.parse(localStorage.getItem('langanki.v1'));
          const t = Date.now() + Number(sessionStorage.getItem('langanki.clockOffset'));
          for (const it of deckById('hira').items.filter((i) => i.base)) {
            const id = `hira:${it.id}:r`;
            if (!s.cards[id] || s.cards[id].st !== 2) s.cards[id] = { st: 2, s: 5, d: 5, step: 0, due: t + 5 * 864e5, last: t, reps: 3, lapses: 0 };
          }
          localStorage.setItem('langanki.v1', JSON.stringify(s));
        }""")
        page.goto(BASE)
        page.wait_for_selector(".today")
        locked = page.locator(".deck--locked").all_inner_texts()
        assert len([x for x in locked if "Katakana words" in x or "Hiragana words" in x]) == 1, "only the katakana word deck should still be locked in Japanese"
        assert page.locator("[data-study=hira-words]").count() == 1
        page.click("[data-study=hira-words]")
        page.wait_for_selector(".glyph--word")
        page.click("[data-act=reveal]")
        assert page.locator(".meaning").count() == 1
        shot(page, "10-phone-word-back")
        study_all(page)

        # Korean: letters first; syllable blocks wait for the 24 basic letters.
        page.goto(BASE)
        page.wait_for_selector(".today")
        page.click("[data-tab=ko]")
        assert page.get_attribute(".tab.is-active", "data-tab") == "ko"
        assert page.locator("[data-act=unlock-early][data-deck=hangul-blocks]").count() == 1, "blocks start locked"
        assert page.locator(".deck--locked").filter(has_text="Korean words").count() == 1
        page.click("[data-study=hangul]")
        page.wait_for_selector(".card")
        assert page.locator(".glyph:lang(ko)").count() == 1
        page.click("[data-act=reveal]")
        assert page.locator(".part--initial").count() >= 1 or page.locator(".part--vowel").count() >= 1
        shot(page, "14-phone-korean-back")
        page.screenshot(path=os.path.join(OUT, "14b-phone-korean-back-full.png"), full_page=True)
        page.click(GOT_IT)
        study_all(page)
        assert all(not k.startswith("hangul-blocks") for k in state(page)["cards"])
        page.click("[data-go=home]")
        page.click("[data-browse=hangul]")
        page.click(".tile:has-text('ㄱ')")
        page.wait_for_selector(".guide-page")
        assert "giyeok" in page.inner_text(".guide-page") and page.locator(".part--final").count() == 1
        page.screenshot(path=os.path.join(OUT, "15-phone-korean-guide.png"), full_page=True)
        page.goto(BASE)
        assert page.get_attribute(".tab.is-active", "data-tab") == "ko", "the tab is remembered"
        shot(page, "16-phone-home-two-scripts")
        page.click("[data-tab=hi]")
        assert "coming next" in page.inner_text("h1")

        # Hebrew: print letters first; vowel points, cursive and words wait for the 27 letters.
        page.click("[data-tab=he]")
        assert page.locator("[data-act=unlock-early][data-deck=he-cursive]").count() == 1
        assert page.locator("[data-act=unlock-early][data-deck=he-points]").count() == 1
        page.click("[data-study=he-letters]")
        page.wait_for_selector(".card")
        assert page.evaluate("getComputedStyle(document.querySelector('.glyph')).direction") == "rtl"
        page.click("[data-act=reveal]")
        shot(page, "17-phone-hebrew-back")
        page.click(GOT_IT)
        study_all(page)
        page.click("[data-go=home]")
        page.click("[data-browse=he-letters]")
        page.click(".tile:has-text('ב')")
        page.wait_for_selector(".guide-page")
        txt = page.inner_text(".guide-page")
        page.screenshot(path=os.path.join(OUT, "18-phone-hebrew-guide.png"), full_page=True)
        assert "With a dot" in txt and "Without" in txt and "vine" in txt, txt[:400]
        page.screenshot(path=os.path.join(OUT, "18-phone-hebrew-guide.png"), full_page=True)
        page.evaluate("""async () => {
          const { deckById } = await import('/js/scripts/index.js');
          const s = JSON.parse(localStorage.getItem('langanki.v1'));
          const t = Date.now() + Number(sessionStorage.getItem('langanki.clockOffset'));
          for (const it of deckById('he-letters').items.filter((i) => i.base)) {
            s.cards[`he-letters:${it.id}:r`] = { st: 2, s: 5, d: 5, step: 0, due: t + 5 * 864e5, last: t - 2 * 864e5, reps: 3, lapses: 0 };
          }
          localStorage.setItem('langanki.v1', JSON.stringify(s));
        }""")
        page.goto(BASE)
        page.wait_for_selector("[data-study=he-cursive]")
        page.click("[data-study=he-cursive]")
        page.wait_for_selector(".glyph--cursive")
        assert "Gveret" in page.evaluate("getComputedStyle(document.querySelector('.glyph')).fontFamily")
        page.click("[data-act=reveal]")
        shot(page, "19-phone-hebrew-cursive")
        page.goto(BASE)
        page.click("[data-study=he-words]")
        page.wait_for_selector(".glyph--word")
        page.click("[data-act=reveal]")
        assert page.locator(".plain-word").count() == 1
        shot(page, "19b-phone-hebrew-word")
        page.goto(BASE)
        page.click("[data-study=he-points]")
        page.wait_for_selector(".card")
        page.click("[data-act=reveal]")
        shot(page, "19c-phone-hebrew-points")
        page.goto(BASE)
        page.click("[data-tab=ja]")
        page.screenshot(path=os.path.join(OUT, "16b-phone-home-full.png"), full_page=True)

        # Settings.
        page.goto(BASE)
        page.click("[data-go=settings]")
        page.click("[data-step='1']")
        assert state(page)["settings"]["newPerDay"] == 11
        page.check("input[value=print]", force=True)
        assert state(page)["settings"]["kanaStyle"] == "print"
        page.check("input[value=manual]", force=True)
        assert state(page)["settings"]["grading"] == "manual"
        page.check("input[value=dark]", force=True)
        shot(page, "11-phone-settings-dark")
        page.click("[data-go=home]")
        shot(page, "12-phone-home-dark")
        page.click("[data-study=kata]")
        page.click("[data-act=reveal]")
        assert page.locator(".grades [data-grade]").count() == 4, "manual grading shows all four grades"
        shot(page, "13-phone-card-dark")
        phone.close()

        # ---------------- desktop ----------------
        desk = browser.new_context(viewport={"width": 1280, "height": 800})
        page = desk.new_page()
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" and "Failed to load resource" not in m.text else None)
        page.goto(BASE + "?device=desktop")
        page.wait_for_selector(".qr svg")
        qr_png = os.path.join(OUT, "27-desktop-welcome-qr.png")
        page.locator(".qr__code").screenshot(path=qr_png)
        shot(page, "27b-desktop-welcome")
        import zxingcpp
        from PIL import Image
        found = zxingcpp.read_barcodes(Image.open(qr_png))
        assert found and found[0].text == BASE, [r.text for r in found]
        page.click("[data-act=start]")
        page.wait_for_selector(".today")
        shot(page, "20-desktop-home")
        page.click("[data-go=code]")
        page.wait_for_selector(".qr svg")
        shot(page, "28-desktop-get-code-qr")
        page.click("[data-go=home]")
        page.once("dialog", lambda d: d.accept())
        page.click("[data-act=unlock-early][data-deck=kata]")
        page.wait_for_selector("[data-study=kata]")
        page.click("[data-study=kata]")
        page.wait_for_selector(".card")
        page.keyboard.press("Space")
        assert page.locator(".timing").count() == 1, "Space reveals the answer"
        shot(page, "21-desktop-card-back")
        assert page.locator(".answer-row .grade").first.get_attribute("data-grade") != "1", "Got it is on the left"
        page.keyboard.press("1")
        study_all(page)
        set_clock(page, 4 * DAY_MS)
        page.goto(BASE)
        page.click("[data-study=kata]")
        study_all(page)
        set_clock(page, 9 * DAY_MS)
        page.goto(BASE)
        page.click("[data-study=kata]")

        used_keyboard = {"done": False}

        def desktop_prod(pg, i, is_prod):
            if is_prod and not used_keyboard["done"]:
                assert pg.locator(".kb").count() == 1, "desktop shows the on-screen keyboard"
                answer = pg.evaluate(ANSWER_JS)
                for ch in answer:
                    pg.click(f".kb__key[data-key='{ch}']")
                assert pg.input_value("#typed") == answer
                shot(pg, "22-desktop-production")
                pg.click(".kb__key[data-key=back]")
                assert pg.input_value("#typed") == answer[:-1]
                pg.click(".kb__key[data-key=clear]")
                used_keyboard["done"] = True

        seen = study_all(page, on_card=desktop_prod)
        assert used_keyboard["done"], "a katakana writing card should have appeared"
        page.click("[data-go=home]")
        page.locator(".prog").first.screenshot(path=os.path.join(OUT, "24-desktop-progress.png"))
        page.click("[data-browse=kata]")
        shot(page, "23-desktop-browse")

        # Start katakana over: its cards go and it locks again.
        page.click("[data-go=settings]")
        page.once("dialog", lambda d: d.accept())
        page.click("[data-act=reset-deck][data-deck=kata]")
        page.wait_for_selector(".flash")
        s = state(page)
        assert not any(k.startswith("kata") for k in s["cards"]), "katakana cards should be gone"
        assert "kata" in s["resets"]
        page.click("[data-go=home]")
        assert page.locator("[data-act=unlock-early][data-deck=kata]").count() == 1, "katakana should be locked again"

        # Korean writing on desktop: the on-screen keyboard composes blocks.
        page.evaluate("""async () => {
          const { deckById } = await import('/js/scripts/index.js');
          const s = JSON.parse(localStorage.getItem('langanki.v1'));
          const t = Date.now() + Number(sessionStorage.getItem('langanki.clockOffset'));
          for (const it of deckById('hangul').items.filter((i) => i.base)) {
            s.cards[`hangul:${it.id}:r`] = { st: 2, s: 5, d: 5, step: 0, due: t + 5 * 864e5, last: t - 2 * 864e5, reps: 3, lapses: 0 };
          }
          localStorage.setItem('langanki.v1', JSON.stringify(s));
        }""")
        page.goto(BASE)
        page.wait_for_selector(".today")
        page.click("[data-tab=ko]")
        assert page.locator("[data-study=hangul-blocks]").count() == 1, "blocks unlock after the basic letters"
        assert page.locator("[data-study=ko-words]").count() == 1, "Korean words unlock after the basic letters"
        page.evaluate("""() => { document.querySelector('[data-study=hangul-blocks]').click(); }""")
        page.wait_for_selector(".card")
        page.keyboard.press("Space")
        shot(page, "25-desktop-korean-block")
        page.goto(BASE)
        page.click("[data-study=hangul]")
        composed = {"done": False}

        def korean_prod(pg, i, is_prod):
            if is_prod and not composed["done"]:
                assert pg.locator(".kb--rows").count() == 1, "Korean keyboard on desktop"
                for k in "ㅎㅏㄴㄱㅡㄹ":
                    pg.click(f".kb__key[data-key='{k}']")
                assert pg.input_value("#typed") == "한글", pg.input_value("#typed")
                pg.click(".kb__key[data-key=back]")
                assert pg.input_value("#typed") == "한그"
                shot(pg, "26-desktop-korean-keyboard")
                pg.click(".kb__key[data-key=clear]")
                composed["done"] = True

        KO_ANSWER = """async () => {
          const { deckById } = await import('/js/scripts/index.js');
          const romaji = document.querySelector('.prompt__romaji').textContent;
          const it = deckById('hangul').items.find((x) => x.romaji === romaji);
          return it ? it.char : null;
        }"""
        for _ in range(200):
            if page.locator(".finished").count():
                break
            page.wait_for_selector(".card")
            if page.locator("#typed").count():
                korean_prod(page, 0, True)
                page.fill("#typed", page.evaluate(KO_ANSWER))
                page.click("[data-act=check]")
                assert page.locator(".result--ok").count() == 1
            elif page.locator("[data-act=reveal]").count():
                page.click("[data-act=reveal]")
            page.click(GOT_IT)
        desk.close()
        browser.close()
finally:
    server.terminate()

if errors:
    print("Console errors:")
    for e in errors:
        print("  ", e)
    sys.exit(1)
print("e2e passed; screenshots in", OUT)
