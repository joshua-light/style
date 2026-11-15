#!/usr/bin/env python3
"""Screenshot a page, a part of it, or a deck's slides, finished as on paper.

Usage:
  shot.py PAGE.html                  the whole page, cut into screens
  shot.py PAGE.html --select CSS     each part that matches, framed for export
  shot.py DECK.html                  one image per slide
  shot.py DECK.html --slide 3        one slide

Options:
  -o OUT.png    where to write. Several images are numbered: OUT-1.png, OUT-2.png.
                Without it the images go to a new temporary folder.
  --width PX    the window's width (1280). Use 1400 or more to see the contents rail in place.
  --scale N     device pixels per px (1). A slide at --scale 2 is 1920 by 1080.
  --tile PX     the height of one screen of a page (1500).

Prints the path of each image written.

Every mark is shown finished, as print shows it: no animation is caught
part-way, every slide is lit, every build piece is built, and popups, toasts,
and tooltips are left out. A part shot with --select sits on the page gray with
24px of padding and a 1px ink frame, the way the guide exports an image.

Needs Chrome or Chromium, on Linux or macOS. Set CHROME to its path if it is
not found. Works on a page before or after build.py.
"""
import argparse
import base64
import fcntl
import json
import os
import select
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

BROWSERS = ["google-chrome-stable", "google-chrome", "chromium", "chromium-browser", "chrome",
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            "/Applications/Chromium.app/Contents/MacOS/Chromium"]
TIMEOUT = 30  # seconds for any one answer from the browser
PAD = 24      # the guide's padding round an exported image

# What print does to a page, for the screen: every mark finished, every slide
# lit and built, nothing laid over the page, and a slide's number moved inside
# its frame so the slide can be cut out whole.
FINISHED = """
*, *::before, *::after { animation: none !important; transition: none !important; }
.deck > .slide { filter: none !important; }
.deck [data-build], .deck .ink { visibility: visible !important; }
.deck .popup, .tooltip, .toasts { display: none !important; }
.deck > .slide > .slide-no { top: var(--s3) !important; }
"""

# Runs in the page. Adds the CSS above, waits for the fonts and for style.js
# to settle, then measures the page, its slides, and the parts selected.
MEASURE = """
(async (css, selector) => {
  const style = document.createElement("style");
  style.textContent = css;
  document.head.append(style);
  await document.fonts.ready;
  await new Promise((done) => setTimeout(done, 150));
  // A part's box, with whatever hangs outside it: a title on its top border.
  // What a scrolling or clipping box holds stays inside that box.
  const box = (el) => {
    const r = el.getBoundingClientRect();
    let b = [r.left, r.top, r.right, r.bottom];
    const s = getComputedStyle(el);
    if (s.overflowX !== "visible" || s.overflowY !== "visible") return b;
    for (const kid of el.children) {
      const k = kid.getBoundingClientRect();
      if (!k.width && !k.height) continue;
      const kb = box(kid);
      b = [Math.min(b[0], kb[0]), Math.min(b[1], kb[1]), Math.max(b[2], kb[2]), Math.max(b[3], kb[3])];
    }
    return b;
  };
  const rect = (b) => {
    const x = Math.floor(b[0] + scrollX), y = Math.floor(b[1] + scrollY);
    return { x, y, width: Math.ceil(b[2] + scrollX) - x, height: Math.ceil(b[3] + scrollY) - y };
  };
  const plain = (el) => { const r = el.getBoundingClientRect(); return rect([r.left, r.top, r.right, r.bottom]); };
  const root = document.documentElement;
  let parts = [];
  if (selector) {
    try { parts = [...document.querySelectorAll(selector)]; }
    catch (error) { return { error: "not a CSS selector: " + selector }; }
    parts = parts.filter((el) => el.getBoundingClientRect().width > 0).map((el) => rect(box(el)));
  }
  return {
    page: { width: root.scrollWidth, height: root.scrollHeight },
    gray: getComputedStyle(root).getPropertyValue("--page").trim() || "#262626",
    slides: [...document.querySelectorAll(".deck > .slide")].map(plain),
    parts,
  };
})
"""

# Runs in the page. Lays a ring round one part: page gray out to the padding,
# then a 1px ink frame. It hides whatever neighbour stands inside the padding.
FRAME = """
((r, pad, gray) => {
  document.querySelector("[data-shot-frame]")?.remove();
  const ring = document.createElement("div");
  ring.setAttribute("data-shot-frame", "");
  ring.style.cssText = `position:absolute; left:${r.x}px; top:${r.y}px; width:${r.width}px; height:${r.height}px;` +
    `box-shadow: 0 0 0 ${pad - 1}px ${gray}, 0 0 0 ${pad}px #000; pointer-events:none; z-index:2147483647;`;
  document.documentElement.append(ring);
})
"""


class Browser:
    """A headless Chrome driven over the DevTools pipe: file descriptors 3 and 4, one JSON message per NUL."""

    def __init__(self, binary):
        self.profile = tempfile.mkdtemp(prefix="shot-profile-")
        to_read, self.to = os.pipe()
        self.back, back_write = os.pipe()
        # Park the browser's ends above 4, so the two dup2 calls cannot land on each other.
        high_read = fcntl.fcntl(to_read, fcntl.F_DUPFD, 10)
        high_write = fcntl.fcntl(back_write, fcntl.F_DUPFD, 10)

        def wire():
            os.dup2(high_read, 3)
            os.dup2(high_write, 4)

        self.proc = subprocess.Popen(
            [binary, "--headless=new", "--remote-debugging-pipe", "--no-first-run", "--no-default-browser-check",
             "--hide-scrollbars", "--mute-audio", f"--user-data-dir={self.profile}", "about:blank"],
            preexec_fn=wire, close_fds=False, stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for fd in (to_read, back_write, high_read, high_write):
            os.close(fd)
        self.buffer = b""
        self.events = []
        self.count = 0
        self.session = None

    def close(self):
        try:
            self.call("Browser.close", session=None)
        except SystemExit:
            pass
        try:
            self.proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            self.proc.kill()
        os.close(self.to)
        os.close(self.back)
        shutil.rmtree(self.profile, ignore_errors=True)

    def read(self):
        """Return the next message from the browser."""
        deadline = time.monotonic() + TIMEOUT
        while b"\0" not in self.buffer:
            if not select.select([self.back], [], [], max(0, deadline - time.monotonic()))[0]:
                sys.exit("shot.py: the browser did not answer")
            chunk = os.read(self.back, 1 << 20)
            if not chunk:
                sys.exit("shot.py: the browser quit")
            self.buffer += chunk
        message, self.buffer = self.buffer.split(b"\0", 1)
        return json.loads(message)

    def call(self, method, params=None, session=...):
        """Send a command and return its result. Events that arrive meanwhile are kept for wait()."""
        self.count += 1
        message = {"id": self.count, "method": method, "params": params or {}}
        if session is ...:
            session = self.session
        if session:
            message["sessionId"] = session
        os.write(self.to, json.dumps(message).encode() + b"\0")
        while True:
            answer = self.read()
            if answer.get("id") == self.count:
                if "error" in answer:
                    sys.exit(f"shot.py: {method}: {answer['error'].get('message')}")
                return answer.get("result", {})
            self.events.append(answer)

    def wait(self, event):
        while True:
            for i, message in enumerate(self.events):
                if message.get("method") == event:
                    del self.events[: i + 1]
                    return
            self.events.append(self.read())

    def open(self, url, width, height, scale):
        target = self.call("Target.createTarget", {"url": "about:blank"}, session=None)["targetId"]
        self.session = self.call("Target.attachToTarget", {"targetId": target, "flatten": True}, session=None)["sessionId"]
        self.call("Emulation.setDeviceMetricsOverride", {"width": width, "height": height, "deviceScaleFactor": scale, "mobile": False})
        self.call("Emulation.setEmulatedMedia", {"features": [{"name": "prefers-reduced-motion", "value": "reduce"}]})
        self.call("Page.enable")
        answer = self.call("Page.navigate", {"url": url})
        if answer.get("errorText"):
            sys.exit(f"shot.py: cannot open {url}: {answer['errorText']}")
        self.wait("Page.loadEventFired")

    def run(self, function, *args):
        """Call a JavaScript function in the page and return what it returns."""
        expression = f"({function})({', '.join(json.dumps(arg) for arg in args)})"
        answer = self.call("Runtime.evaluate", {"expression": expression, "awaitPromise": True, "returnByValue": True})
        if "exceptionDetails" in answer:
            sys.exit(f"shot.py: {answer['exceptionDetails'].get('exception', {}).get('description', 'the page script failed')}")
        return answer["result"].get("value")

    def shoot(self, clip, path):
        answer = self.call("Page.captureScreenshot", {"format": "png", "captureBeyondViewport": True, "clip": {**clip, "scale": 1}})
        path.write_bytes(base64.b64decode(answer["data"]))


def find_browser():
    named = os.environ.get("CHROME")
    for name in ([named] if named else BROWSERS):
        found = shutil.which(name)
        if found:
            return found
    sys.exit("shot.py: no Chrome or Chromium found" + (f" at {named}" if named else "; set CHROME to its path"))


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("page", type=Path)
    parser.add_argument("-o", "--out", type=Path)
    parser.add_argument("--select", metavar="CSS")
    parser.add_argument("--slide", type=int, metavar="N")
    parser.add_argument("--width", type=int, default=1280)
    parser.add_argument("--scale", type=float, default=1)
    parser.add_argument("--tile", type=int, default=1500)
    args = parser.parse_args()
    if not args.page.is_file():
        sys.exit(f"shot.py: no such page: {args.page}")
    if args.select and args.slide:
        parser.error("give --select or --slide, not both")

    browser = Browser(find_browser())
    try:
        browser.open(args.page.resolve().as_uri(), args.width, 900, args.scale)
        found = browser.run(MEASURE, FINISHED, args.select)
        if found.get("error"):
            sys.exit(f"shot.py: {found['error']}")
        page, slides = found["page"], found["slides"]

        # Each shot is (clip, the part to frame or None).
        if args.select:
            if not found["parts"]:
                sys.exit(f"shot.py: nothing on the page matches {args.select}")
            shots = []
            for part in found["parts"]:
                x, y = max(0, part["x"] - PAD), max(0, part["y"] - PAD)
                clip = {"x": x, "y": y, "width": part["x"] + part["width"] + PAD - x, "height": part["y"] + part["height"] + PAD - y}
                shots.append((clip, part))
        elif args.slide or slides:
            if not slides:
                sys.exit("shot.py: --slide needs a deck: the page has no .deck > .slide")
            if args.slide and not 1 <= args.slide <= len(slides):
                sys.exit(f"shot.py: the deck has slides 1 to {len(slides)}")
            shots = [(clip, None) for clip in (slides[args.slide - 1:args.slide] if args.slide else slides)]
        else:
            tops = range(0, page["height"], args.tile)
            shots = [({"x": 0, "y": top, "width": page["width"], "height": min(args.tile, page["height"] - top)}, None) for top in tops]

        if args.out:
            folder, stem, suffix = args.out.parent, args.out.stem, args.out.suffix or ".png"
            folder.mkdir(parents=True, exist_ok=True)
        else:
            folder, stem, suffix = Path(tempfile.mkdtemp(prefix="shot-")), args.page.stem, ".png"
        first = args.slide or 1
        for n, (clip, part) in enumerate(shots, first):
            name = stem + (f"-{n}" if len(shots) > 1 or args.slide else "") + suffix
            if part:
                browser.run(FRAME, part, PAD, found["gray"])
            browser.shoot(clip, folder / name)
            print(folder / name)
    finally:
        browser.close()


if __name__ == "__main__":
    main()
