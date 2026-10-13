"""Multi-device code and sync test against a running Worker (local `wrangler dev` or the live site).

    npx wrangler d1 execute langanki --local --file schema.sql
    npx wrangler dev --port 8787 &
    python3 tests/sync_e2e.py http://127.0.0.1:8787 [screenshot_dir]

Device A studies and gets a code. Device B restores it from the code and studies too.
Each must see the other's cards. Then: a restore link on device C, replacing the code,
and erasing everything.
"""
import json
import os
import sys

from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8787"
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "screens")
os.makedirs(OUT, exist_ok=True)
errors = []


def watch(page, name):
    page.on("pageerror", lambda e: errors.append(f"{name}: {e}"))
    page.on("console", lambda m: errors.append(f"{name}: {m.text}") if m.type == "error" and "Failed to load resource" not in m.text else None)


def state(page):
    return json.loads(page.evaluate("localStorage.getItem('langanki.v1')"))


def cards(page, prefix):
    return sorted(k for k in state(page)["cards"] if k.startswith(prefix))


def study(page, deck):
    page.goto(BASE + "/")
    page.click(f"[data-study={deck}]")
    for _ in range(100):
        if page.locator(".finished").count():
            return
        if page.locator("[data-act=reveal]").count():
            page.click("[data-act=reveal]")
        page.click("[data-grade='3']")
    raise AssertionError("session never finished")


def wait_saved(page):
    page.wait_for_function("() => !localStorage.getItem('langanki.pending')", timeout=10000)


with sync_playwright() as p:
    browser = p.chromium.launch()
    a = browser.new_context(viewport={"width": 390, "height": 844}).new_page()
    watch(a, "A")
    a.goto(BASE + "/")
    a.click("[data-act=start]")
    study(a, "hira")
    a.wait_for_function("() => localStorage.getItem('langanki.code')", timeout=10000)
    a.click("[data-go=home]")
    a.wait_for_selector(".banner .code-text")
    code = a.inner_text(".banner .code-text").strip()
    print("code", code)
    assert len(code) == 11 and code[5] == "-"
    a.screenshot(path=os.path.join(OUT, "sync-a-banner.png"))
    wait_saved(a)
    a_cards = cards(a, "hira:")
    assert len(a_cards) == 10

    # Device B restores with a sloppy version of the code (lowercase, no dash).
    b = browser.new_context(viewport={"width": 1100, "height": 900}).new_page()
    watch(b, "B")
    b.goto(BASE + "/")
    b.click("text=I have a code")
    b.fill("#restore-code", code.replace("-", "").lower())
    b.click(".restore button[type=submit]")
    b.wait_for_selector(".today")
    assert cards(b, "hira:") == a_cards, "B should have A's cards"
    study(b, "kata")
    b.click("[data-go=home]")
    wait_saved(b)
    assert len(cards(b, "kata:")) == 10

    # A pulls B's katakana when the tab regains focus.
    a.goto(BASE + "/")
    a.wait_for_function("() => Object.keys(JSON.parse(localStorage.getItem('langanki.v1')).cards).some(k => k.startsWith('kata:'))", timeout=10000)
    assert len(cards(a, "kata:")) == 10

    # Device C uses the restore link.
    c = browser.new_context().new_page()
    watch(c, "C")
    c.goto(BASE + "/#code=" + code)
    c.wait_for_selector(".today")
    assert "#code" not in c.url, "the code must be removed from the address bar"
    assert len(cards(c, "hira:")) == 10 and len(cards(c, "kata:")) == 10

    # Wrong code shows an error.
    d = browser.new_context().new_page()
    watch(d, "D")
    d.goto(BASE + "/")
    d.click("text=I have a code")
    d.fill("#restore-code", "00000-00000")
    d.click(".restore button[type=submit]")
    d.wait_for_selector("#restore-error:not([hidden])")
    print("wrong code:", d.inner_text("#restore-error"))

    # Replace the code on A; the old one stops working.
    a.on("dialog", lambda dlg: dlg.accept())
    a.click("[data-go=settings]")
    a.click("[data-act=rotate]")
    a.wait_for_selector(".code-big")
    new_code = a.inner_text(".code-big").strip()
    assert new_code != code
    status = a.evaluate(f"fetch('/api/profile', {{headers: {{'X-LangAnki-Code': '{code}'}}}}).then(r => r.status)")
    assert status == 404, status
    status = a.evaluate(f"fetch('/api/profile', {{headers: {{'X-LangAnki-Code': '{new_code}'}}}}).then(r => r.status)")
    assert status == 200, status

    # Erase everywhere.
    a.click("[data-go=settings]")
    a.click("[data-act=erase]")
    a.wait_for_selector(".welcome")
    status = a.evaluate(f"fetch('/api/profile', {{headers: {{'X-LangAnki-Code': '{new_code}'}}}}).then(r => r.status)")
    assert status == 404, status
    browser.close()

errors = [e for e in errors if "404" not in e]
if errors:
    print("Console errors:")
    for e in errors:
        print("  ", e)
    sys.exit(1)
print("sync test passed")
