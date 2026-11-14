#!/usr/bin/env python3
"""Make an HTML page self-contained: inline style.css and style.js, embed the fonts.

Usage: build.py PAGE.html [-o OUT.html]

Replaces the page's <link rel="stylesheet" href="…style.css"> (or the
<style data-style> block left by an earlier run) with the stylesheet, fonts
embedded as data URIs. Replaces <script src="…style.js"> (or an earlier
<script data-style> block) with the script; a page without it is left
without. Without -o the page is rewritten in place.

Expressway is not redistributable, so its files may be absent. The page then
falls back to Overpass from Google Fonts and this script says so on stderr.

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

# weight -> file stem; the first extension found wins. 400 is the fallback for
# text where Expressway Regular is not installed, so Bold is embedded twice.
FACES = {400: "expressway", 700: "expressway", 800: "expressway-xb"}
# Installed-font names tried before a face's embedded file.
LOCAL = {400: ("Expressway Regular", "Expressway-Regular")}
FORMATS = {".woff2": ("font/woff2", "woff2"), ".ttf": ("font/ttf", "truetype"), ".otf": ("font/otf", "opentype")}

LINK = re.compile(r"<link\b[^>]*href=[\"'][^\"']*style\.css[\"'][^>]*>", re.I)
BLOCK = re.compile(r"<style data-style>.*?</style>", re.S)
SCRIPT = re.compile(r"<script\b[^>]*src=[\"'][^\"']*style\.js[\"'][^>]*>\s*</script>", re.I)
SCRIPT_BLOCK = re.compile(r"<script data-style>.*?</script>", re.S)
FALLBACK = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Overpass:wght@400;700;800&display=swap">'


def font_faces():
    """Return (css, missing): @font-face rules for the fonts present, and the stems that are not."""
    css, missing = [], []
    for weight, stem in FACES.items():
        path = next((FONTS / (stem + ext) for ext in FORMATS if (FONTS / (stem + ext)).exists()), None)
        if path is None:
            if stem not in missing:
                missing.append(stem)
            continue
        mime, fmt = FORMATS[path.suffix]
        data = base64.b64encode(path.read_bytes()).decode("ascii")
        local = "".join(f'local("{name}"),' for name in LOCAL.get(weight, ()))
        css.append(
            f'@font-face{{font-family:"Expressway";font-weight:{weight};'
            f'src:{local}url("data:{mime};base64,{data}") format("{fmt}")}}'
        )
    return "\n".join(css), missing


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("page", type=Path)
    parser.add_argument("-o", "--out", type=Path)
    args = parser.parse_args()

    html = args.page.read_text(encoding="utf-8")
    css = (ASSETS / "style.css").read_text(encoding="utf-8")
    # The stylesheet's own @font-face rules point at files; swap them for embedded ones.
    css = re.sub(r"@font-face\s*\{[^}]*\}\s*", "", css)
    faces, missing = font_faces()

    block = f"<style data-style>\n{faces}\n{css}</style>"
    if missing:
        block = FALLBACK + "\n" + block
        print(
            f"build.py: no font file for {', '.join(missing)} in {FONTS}; "
            "falling back to Overpass. See the README for how to add Expressway.",
            file=sys.stderr,
        )

    # Drop the fallback link an earlier run may have left, so reruns do not stack it.
    html = html.replace(FALLBACK + "\n", "")
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
