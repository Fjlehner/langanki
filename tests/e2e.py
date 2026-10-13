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
        s = state(page)
        assert len([k for k in s["cards"] if k.startswith("hira:")]) == 10

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

        page.wait_for_selector(".card")
        page.click("[data-act=reveal]")
        assert page.get_attribute(GOT_IT, "data-grade") == "4", "a review answered fast counts as Easy"
        page.click(GOT_IT)
        seen = study_all(page, on_card=no_keyboard)
        print("day 4 seen", seen)

        # Day 9: production cards are unlocked for items that passed a review.
        set_clock(page, 9 * DAY_MS)
        page.goto(BASE)
        page.click("[data-study=hira]")
        seen = study_all(page, on_card=no_keyboard, wrong_every=3)
        print("day 9 seen", seen)
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

        page.click("[data-study=all]")
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
        assert page.locator(".deck--locked").count() == 1, "only the katakana word deck should still be locked"
        page.click("[data-study=hira-words]")
        page.wait_for_selector(".glyph--word")
        page.click("[data-act=reveal]")
        assert page.locator(".meaning").count() == 1
        shot(page, "10-phone-word-back")
        study_all(page)

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
        page.click("[data-act=start]")
        page.wait_for_selector(".today")
        shot(page, "20-desktop-home")
        page.once("dialog", lambda d: d.accept())
        page.click("[data-act=unlock-early][data-deck=kata]")
        page.wait_for_selector("[data-study=kata]")
        page.click("[data-study=kata]")
        page.wait_for_selector(".card")
        page.keyboard.press("Space")
        assert page.locator(".timing").count() == 1, "Space reveals the answer"
        shot(page, "21-desktop-card-back")
        page.keyboard.press("2")
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
        page.click("[data-browse=kata]")
        shot(page, "23-desktop-browse")
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
