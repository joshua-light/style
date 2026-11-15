#!/usr/bin/env python3
"""Make an HTML page self-contained: inline style.css and style.js, embed the fonts.

Usage: build.py PAGE.html [-o OUT.html]

Replaces the page's <link rel="stylesheet" href="…style.css"> (or the
<style data-style> block left by an earlier run) with the stylesheet, fonts
embedded as data URIs. Replaces <script src="…style.js"> (or an earlier
<script data-style> block) with the script; a page without it is left
without. Without -o the page is rewritten in place.

Expressway is not redistributable, so its files may be absent. The page is
then set in Fira Sans, the bundled fallback, and this script says so on stderr.
With Expressway's Bold file present, Fira Sans is left out: it would never show.

Expressway Regular is never embedded: its licence allows desktop use only. The
page reads it from the reader's installed fonts and falls back to the embedded
Bold where it is not installed.
"""
import argparse
import base64
import re
import sys
from pathlib import Path

ASSETS = Path(__file__).resolve().parent.parent / "assets"
FONTS = ASSETS / "fonts"

# A font file may come in any of these; the first found wins.
FORMATS = {".woff2": ("font/woff2", "woff2"), ".ttf": ("font/ttf", "truetype"), ".otf": ("font/otf", "opentype")}

LINK = re.compile(r"<link\b[^>]*href=[\"'][^\"']*style\.css[\"'][^>]*>", re.I)
BLOCK = re.compile(r"<style data-style>.*?</style>", re.S)
SCRIPT = re.compile(r"<script\b[^>]*src=[\"'][^\"']*style\.js[\"'][^>]*>\s*</script>", re.I)
SCRIPT_BLOCK = re.compile(r"<script data-style>.*?</script>", re.S)
# Pages built before Fira Sans was bundled fell back to Overpass over the network.
OLD_FALLBACK = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Overpass:wght@400;700;800&display=swap">'

FACE = re.compile(r"@font-face\s*\{[^}]*\}\s*")
FAMILY = re.compile(r'font-family:\s*"([^"]+)"')
SRC = re.compile(r"src:\s*([^;]*);")
FILE = re.compile(r'url\("fonts/([^"]+)"\)')
# With no Expressway rule on the page, the stack must not name the family: it
# would pick up an Expressway installed on the reader's machine.
PIN = ":root { --font: var(--font-fallback); }\n"


def embed(rule):
    """Swap a @font-face rule's font files for data URIs.

    Returns (rule, missing): the rule with each font embedded once, and the
    stems that have no file. local() sources stay. A rule left without any
    source comes back empty.
    """
    sources, seen, missing = [], set(), []
    for source in SRC.search(rule).group(1).split(","):
        source = source.strip()
        file = FILE.match(source)
        if not file:
            sources.append(source)
            continue
        stem = Path(file.group(1)).stem
        if stem in seen:  # the same font, listed in another format
            continue
        seen.add(stem)
        path = next((FONTS / (stem + ext) for ext in FORMATS if (FONTS / (stem + ext)).exists()), None)
        if path is None:
            missing.append(stem)
            continue
        mime, fmt = FORMATS[path.suffix]
        data = base64.b64encode(path.read_bytes()).decode("ascii")
        sources.append(f'url("data:{mime};base64,{data}") format("{fmt}")')
    if not sources:
        return "", missing
    return SRC.sub(lambda _: "src: " + ", ".join(sources) + ";", rule.strip(), count=1), missing


def font_faces(css):
    """Return (faces, pin, notes): the embedded @font-face rules, the rule that pins the fallback, and what to tell the user."""
    families = {}
    for rule in FACE.findall(css):
        families.setdefault(FAMILY.search(rule).group(1), []).append(embed(rule))
    missing = [stem for _, stems in families.get("Expressway", []) for stem in stems]
    if "expressway" not in missing:
        notes = [f"no font file for {stem} in {FONTS}; emphasis will not stand out where "
                 "Expressway Regular is not installed." for stem in missing]
        return "\n".join(rule for rule, _ in families["Expressway"] if rule), "", notes
    fallback = families.get("Fira Sans", [])
    notes = [f"no Expressway Bold in {FONTS}; the page is set in Fira Sans. "
             "See the README for how to add Expressway."]
    notes += [f"no font file for {stem} in {FONTS}; text falls back to the system sans."
              for _, stems in fallback for stem in stems]
    return "\n".join(rule for rule, _ in fallback if rule), PIN, notes


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("page", type=Path)
    parser.add_argument("-o", "--out", type=Path)
    args = parser.parse_args()

    html = args.page.read_text(encoding="utf-8")
    css = (ASSETS / "style.css").read_text(encoding="utf-8")
    # The stylesheet's own @font-face rules point at files; swap them for embedded ones.
    faces, pin, notes = font_faces(css)
    css = FACE.sub("", css)

    block = f"<style data-style>\n{faces}\n{css}{pin}</style>"
    for note in notes:
        print(f"build.py: {note}", file=sys.stderr)

    html = html.replace(OLD_FALLBACK + "\n", "")
    # A function replacement keeps backslashes in the CSS literal.
    if BLOCK.search(html):
        html = BLOCK.sub(lambda _: block, html, count=1)
    elif LINK.search(html):
        html = LINK.sub(lambda _: block, html, count=1)
    else:
        sys.exit('build.py: no <link rel="stylesheet" href="style.css"> found in the page')

    # The script is optional: only pages with tooltips or scroll reveal load it.
    # It moves to the end of the body, where a src script with defer would run.
    if SCRIPT.search(html) or SCRIPT_BLOCK.search(html):
        js = (ASSETS / "style.js").read_text(encoding="utf-8")
        html = SCRIPT_BLOCK.sub("", SCRIPT.sub("", html))
        tag = f"<script data-style>\n{js}</script>\n"
        if "</body>" not in html:
            sys.exit("build.py: no </body> to put the script before")
        html = html.replace("</body>", tag + "</body>", 1)

    out = args.out or args.page
    out.write_text(html, encoding="utf-8")
    print(f"{out} ({len(html.encode('utf-8')) // 1024} KB)")


if __name__ == "__main__":
    main()
