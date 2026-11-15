#!/usr/bin/env python3
"""Check a page against the style guide's rules.

Usage: lint.py PAGE.html... [--strict] [--ignore RULE,RULE]

Reads the page's own CSS (its <style> blocks and style attributes), its markup,
and its text. The stylesheet and script that build.py inlines are skipped: they
are the style. Works on a page before or after build.py.

Prints one finding per line: PAGE:LINE: LEVEL RULE: what is wrong and what to
write instead. An error breaks a rule the guide states as "never". A warning
is a rule with exceptions the guide allows: check each by eye.

Exits with status 1 on any error; with --strict, on any warning too.

A line that carries "lint-ok: RULE" in a comment is exempt from that rule.
Use it only for an exception the guide names, and say why in the comment.
"""
import argparse
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ASSETS = Path(__file__).resolve().parent.parent / "assets"

ERROR, WARN = "error", "warn"

# Text inside these is not set in the text face, or is not shown at all.
VERBATIM = {"script", "style", "pre", "code", "kbd", "samp", "textarea", "title"}
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}

ARROWS = re.compile("[←-⇿⟰-⟿⤀-⥿⬀-⬑▲-◅]")
EMOJI = re.compile("[☀-➿⭐⭕\U0001f000-\U0001faff]")
MATHS = re.compile("[≈≤≥≠√]")

# Wrong forms from the guide's Numbers and dates table.
NUMBERS = [
    (re.compile(r"~\s?\d+"), 'a rough value is a word: "about 40"'),
    (re.compile(r"\d+\s+%"), "no space before a percent sign"),
    (re.compile(r"\b\d{1,2}:\d{2}\s?[AaPp]\.?[Mm]\b"), 'time of day uses the 24-hour clock: "21:30"'),
    (re.compile(r"\b\d{1,2}/\d{1,2}/\d{2,4}\b"), 'a date is day, short month, year: "15 Nov 2026"'),
    (re.compile(r"(?<![\w/])[Nn]/[Aa](?![\w/])"), 'no value is a faint dash: <span class="faint">–</span>'),
]

COLOUR = re.compile(r"#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(")
NAMED = re.compile(
    r"(?<![\w-])(?:white|black|red|green|blue|yellow|orange|purple|pink|gray|grey|silver|gold|brown|cyan|"
    r"magenta|teal|navy|lime|maroon|olive|aqua|fuchsia|tan|crimson|coral|salmon|khaki|indigo|violet|beige)(?![\w-])")
COLOUR_PROPS = re.compile(r"^(color|background|border|outline|fill|stroke|caret-color|accent-color|text-decoration|column-rule|stop-color|flood-color)")
SPACE_PROPS = re.compile(r"^(margin|padding|gap|row-gap|column-gap)")
# A length the scale does not hold: anything but 0 and a 1px edge.
RAW_LENGTH = re.compile(r"(?<![\w.-])(?!0(?:px)?(?![\w.])|1px(?![\w.]))\d*\.?\d+(?:px|rem|em)\b")
RAW_TIME = re.compile(r"(?<![\w.-])(?!0m?s\b)\d*\.?\d+m?s\b")
DASHED = re.compile(r"\b(dashed|dotted)\b")
# Tokens a page reads and never sets: faces, scales, surfaces, palette, line styles.
OWNED = re.compile(
    r"^--(texture|hatch|border|outline|fit|ink-ring|line|ring|font[\w-]*|code-[\w-]+|fs-[\w-]+|lh-[\w-]+|s[1-7]|"
    r"ink|sunken|page|inset|panel|raised|head|surface|text(-[\w-]+)?|"
    r"azure|gold|amethyst|copper|silver|rose|green|yellow|red|c[1-6]|c-other|good|warn|bad|info|"
    r"class-[\w-]+|quality-[\w-]+)$")
TOKEN_USE = re.compile(r"var\(\s*(--[\w-]+)\s*(,)?")
TOKEN_NAME = re.compile(r"(--[A-Za-z_][\w-]*)")
# Styled by nothing, and still fine: the default span, written out.
PLAIN_CLASSES = {"span-12"}
# Driven by style.js: a page that uses one needs the script.
SCRIPTED = {"data-tip", "data-key", "data-tab", "data-go", "data-bind", "data-build", "data-check",
            "data-reveal", "data-open", "data-toast", "data-link"}
SCRIPTED_CLASSES = {"deck", "stepper", "sortable", "rail", "quiz", "menu"}

LIMITS = [
    # (container class, counted class or tag, most allowed, rule, message)
    ("pie", ".pie-slice", 5, "pie-slices", "a pie holds five slices at most: fold the rest into \"other\""),
    ("steps", "li", 6, "six-steps", "six steps at most: split the list, or use a plain numbered list"),
    ("pins", ".pin", 6, "six-pins", "six pins at most"),
    ("slide", ".popup", 1, "one-popup", "one popup per slide: a slide that needs two wants to be two slides"),
    ("slide", "h1", 1, "one-title", "one title per slide"),
]


def the_style():
    """Return (classes, tokens): the class names the stylesheet styles or the script handles, and the custom properties either one names."""
    css = re.sub(r"/\*.*?\*/", "", (ASSETS / "style.css").read_text(encoding="utf-8"), flags=re.S)
    js = (ASSETS / "style.js").read_text(encoding="utf-8")
    classes = set(re.findall(r"\.(-?[A-Za-z_][\w-]*)", css)) | PLAIN_CLASSES
    classes |= set(re.findall(r"\.(-?[A-Za-z_][\w-]*)", js))
    for group in re.findall(r"classList\.\w+\(([^)]*)\)", js):
        classes |= set(re.findall(r"[\"']([\w-]+)[\"']", group))
    tokens = set(re.findall(r"(--[A-Za-z_][\w-]*)\s*:", css)) | set(TOKEN_NAME.findall(js))
    return classes, tokens


def css_statements(css):
    """Yield (kind, text, line offset) for each prelude and declaration in a stylesheet.

    kind is "prelude" for a selector or an at-rule that opens a block, and
    "decl" for a declaration or a blockless at-rule. Comments are blanked
    first, keeping their newlines, so offsets hold.
    """
    css = re.sub(r"/\*.*?\*/", lambda m: re.sub(r"[^\n]", " ", m.group()), css, flags=re.S)
    start, depth, quote = 0, 0, ""
    for i, ch in enumerate(css):
        if quote:
            if ch == quote and css[i - 1] != "\\":
                quote = ""
        elif ch in "\"'":
            quote = ch
        elif ch == "(":
            depth += 1
        elif ch == ")":
            depth = max(0, depth - 1)
        elif depth == 0 and ch in "{};":
            text = css[start:i]
            if text.strip():
                lead = len(text) - len(text.lstrip())
                yield ("prelude" if ch == "{" else "decl"), text.strip(), css.count("\n", 0, start + lead)
            start = i + 1
    if css[start:].strip():
        yield "decl", css[start:].strip(), css.count("\n", 0, start)


class Page(HTMLParser):
    def __init__(self, path, classes, tokens):
        super().__init__(convert_charrefs=True)
        self.path = path
        self.known = set(classes)
        self.tokens = set(tokens)
        self.token_uses = []   # (token, line) for each var() with no fallback
        self.findings = []
        self.stack = []        # open elements: (tag, classes)
        self.scopes = []       # open limited containers: [depth, counted, most, rule, message, count, line]
        self.stats = []        # open stats: [depth, has delta, has note, line]
        self.skip_data = False  # inside the stylesheet or script build.py inlined
        self.in_body = False
        self.has_sheet = False
        self.has_script = False
        self.needs_script = None  # line of the first part style.js drives
        self.is_deck = False
        self.titles = []
        self.used = []         # (class, line)
        self.mark = None       # [line, text] of the open <mark>

    # ── Findings ──

    def add(self, level, rule, message, line=None):
        self.findings.append((line or self.getpos()[0], level, rule, message))

    # ── CSS ──

    def check_css(self, css, line, inline=False):
        for kind, text, offset in css_statements(css):
            at = line + offset
            if kind == "prelude":
                self.check_prelude(text, at)
            elif text.startswith("@import"):
                self.add(ERROR, "stands-alone", "no @import: a page stands alone on style.css", at)
            elif ":" in text:
                prop, value = text.split(":", 1)
                self.check_decl(prop.strip().lower(), value.strip(), at, inline)

    def check_prelude(self, text, at):
        low = text.lower()
        if "prefers-color-scheme" in low:
            self.add(ERROR, "dark-only", "the style is dark only: no colour-scheme query", at)
        if low.startswith("@font-face"):
            self.add(ERROR, "one-face", "no @font-face on a page: the stylesheet owns the faces", at)
        if low.startswith("@keyframes"):
            self.add(WARN, "page-motion", "the stylesheet owns motion: a page sets a duration, never an animation of its own", at)
        if "::selection" in low or "scrollbar" in low:
            self.add(ERROR, "page-chrome", "never restyle scrollbars or selected text on a page", at)
        self.known |= set(re.findall(r"\.(-?[A-Za-z_][\w-]*)", text))

    def check_decl(self, prop, value, at, inline):
        low = value.lower()
        for name, fallback in TOKEN_USE.findall(value):
            if not fallback:
                self.token_uses.append((name, at))
        if prop.startswith("--"):
            if OWNED.match(prop):
                self.add(ERROR, "owned-token", f"{prop} belongs to the stylesheet: never set it on a page", at)
            elif COLOUR.search(value):
                self.add(WARN, "raw-colour", f"{prop} holds a raw colour: use a token, or soften a new colour as the guide's Colour section says", at)
            return
        if "radius" in prop and not re.fullmatch(r"0(px)?(\s+0(px)?)*", low):
            self.add(ERROR, "rounded", "nothing is rounded: drop border-radius", at)
        if prop in ("box-shadow", "text-shadow") and low != "none":
            self.add(ERROR, "shadow", f"no {prop}: depth comes from the gray steps, and the outline is a text stroke", at)
        if prop == "filter" and low == "var(--ink-ring)":
            self.add(WARN, "filter-ring", "the filter ring is exact on horizontal and vertical edges only: a sloped line takes .line or .wire", at)
        elif prop in ("filter", "backdrop-filter") and low != "none":
            self.add(ERROR, "filter", f"no {prop} on a page: no blur, glow, or shadow", at)
        if "gradient(" in low:
            self.add(ERROR, "gradient", "nothing has a gradient: every fill is flat", at)
        if (prop.startswith(("border", "outline")) and DASHED.search(low)) or (prop == "stroke-dasharray" and low != "none"):
            self.add(ERROR, "own-dash", "never write a dash or dots of your own: mark the part .ghost", at)
        if prop == "outline" and re.match(r"(none|0)\b", low):
            self.add(ERROR, "focus", "never remove the focus outline", at)
        if COLOUR.search(value) or (COLOUR_PROPS.match(prop) and NAMED.search(low)):
            self.add(ERROR, "raw-colour", f"raw colour in {prop}: use a token such as var(--panel) or var(--c2)", at)
        if prop == "font-family" and not re.fullmatch(r"var\(--font[\w-]*\)|inherit", low):
            self.add(ERROR, "one-face", "never name a font family on a page: use var(--font)", at)
        if prop == "font" and not low.startswith("inherit"):
            self.add(ERROR, "one-face", "no font shorthand on a page: it names a family and a size off the scale", at)
        if prop == "font-weight" and low not in ("400", "700", "normal", "bold", "inherit"):
            self.add(ERROR, "weight", "two weights only: 400 and 700", at)
        if prop == "font-style" and low in ("italic", "oblique"):
            self.add(ERROR, "italic", "nothing is italic", at)
        if prop == "font-size" and not re.fullmatch(r"var\(--fs-[\w-]+\)|inherit|1em|100%", low):
            self.add(ERROR, "type-scale", "a size off the scale: pick a --fs-* token by meaning", at)
        if prop == "letter-spacing" and not re.fullmatch(r"0|normal|inherit|var\(.*\)", low):
            self.add(WARN, "tracking", "prose is never tracked: the stylesheet tracks uppercase labels and outlined text itself", at)
        if prop in ("-webkit-font-smoothing", "text-rendering", "-webkit-text-stroke", "paint-order"):
            self.add(ERROR, "text-rendering", f"never set {prop} on a page: plain text keeps the browser's rendering, and the stylesheet strokes headings", at)
        if prop == "color-scheme" and "light" in low:
            self.add(ERROR, "dark-only", "the style is dark only", at)
        if SPACE_PROPS.match(prop) and RAW_LENGTH.search(low):
            self.add(WARN, "space-scale", f"raw length in {prop}: every gap is a step, var(--s1) to var(--s7)", at)
        if prop.startswith(("animation", "transition")) and RAW_TIME.search(low):
            self.add(WARN, "page-motion", f"raw time in {prop}: use var(--t-fast) or var(--t-slow), or a multiple of one", at)
        if prop == "opacity" and low not in ("0", "1"):
            self.add(WARN, "transparency", "nothing is transparent: dim with the gray steps or --text-dim", at)

    # ── Markup ──

    def handle_starttag(self, tag, attrs):
        self.open(tag, attrs)
        if tag not in VOID:
            self.stack.append((tag, self.classes(attrs)))

    def handle_startendtag(self, tag, attrs):
        self.open(tag, attrs)

    def handle_endtag(self, tag):
        if tag == "mark" and self.mark:
            line, text = self.mark
            if re.fullmatch(r"[\d\s.,:%+\-–/KMBkmhs]+", text.strip() or "x") and re.search(r"\d", text):
                self.add(WARN, "mark-names", "a mark names a thing: never mark a number", line)
            self.mark = None
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                del self.stack[i:]
                break
        else:
            return
        depth = len(self.stack)
        while self.scopes and self.scopes[-1][0] > depth:
            _, _, most, rule, message, count, line = self.scopes.pop()
            if count > most:
                self.add(WARN, rule, f"{message} (found {count})", line)
        while self.stats and self.stats[-1][0] > depth:
            _, delta, note, line = self.stats.pop()
            if delta and not note:
                self.add(WARN, "delta-note", "a delta never appears without its comparison: add a .stat-note (\"vs last week\")", line)
        if tag == "style" or tag == "script":
            self.skip_data = False

    @staticmethod
    def classes(attrs):
        return set((dict(attrs).get("class") or "").split())

    def inside(self, *names):
        """True inside an element with one of these tags or classes."""
        return any(tag in names or classes & set(names) for tag, classes in self.stack)

    def in_picture(self, tag, classes):
        """True for a picture's own SVG: one with no class, in a figure.frame. Its colours are the picture's."""
        if not self.inside("frame"):
            return False
        return (tag == "svg" and not classes) or any(t == "svg" and not c for t, c in self.stack)

    def open(self, tag, attrs):
        line = self.getpos()[0]
        attr = dict(attrs)
        classes = self.classes(attrs)
        depth = len(self.stack) + 1
        if tag == "body":
            self.in_body = True

        # The style itself, linked or inlined by build.py.
        if tag == "link" and re.search(r"style\.css$", attr.get("href") or ""):
            self.has_sheet = True
        if tag == "script" and re.search(r"style\.js$", attr.get("src") or ""):
            self.has_script = True
        if tag in ("style", "script") and "data-style" in attr:
            self.skip_data = True
            self.has_sheet |= tag == "style"
            self.has_script |= tag == "script"
        remote = attr.get("href") if tag == "link" else attr.get("src") if tag == "script" else None
        if remote and re.match(r"(https?:)?//", remote) and attr.get("rel") != "canonical":
            self.add(ERROR, "stands-alone", f"a page stands alone: no remote <{tag}> ({remote})", line)

        # Classes and limits.
        if not self.inside("pre", "code"):  # a highlighter's token classes need no style
            for name in classes:
                self.used.append((name, line))
        if classes & SCRIPTED_CLASSES or SCRIPTED & set(attr):
            self.needs_script = self.needs_script or line
        if "deck" in classes:
            self.is_deck = True
        if tag == "h1" and not self.inside("slide"):
            self.titles.append(line)
        for scope in self.scopes:
            counted = scope[1]
            hit = counted[1:] in classes if counted.startswith(".") else (tag == counted and depth == scope[0] + 1)
            scope[5] += hit
        for stat in self.stats:
            stat[1] |= "delta" in classes
            stat[2] |= "stat-note" in classes
        if tag not in VOID:
            for container, counted, most, rule, message in LIMITS:
                if container in classes:
                    self.scopes.append([depth, counted, most, rule, message, 0, line])
            if "stat" in classes:
                self.stats.append([depth, False, False, line])
        if tag in ("ul", "ol") and not classes:
            nested = sum(1 for t, c in self.stack if t in ("ul", "ol") and not c)
            if nested >= 3:
                self.add(WARN, "list-depth", "lists nest three levels at most", line)

        # Elements the style has no place for.
        if tag in ("i", "em"):
            self.add(WARN, "italic", f"<{tag}>: nothing is italic, use <strong> for emphasis", line)
        if tag in ("font", "center", "marquee"):
            self.add(ERROR, "markup", f"<{tag}>: use the stylesheet's classes", line)
        if tag == "input" and (attr.get("type") or "").lower() == "radio":
            self.add(ERROR, "radio", "there are no radio buttons: use .tabs to pick one of several", line)
        if "title" in attr and self.in_body:
            self.add(WARN, "tooltip", "use data-tip, not title: the browser's own tooltip is off-style", line)
        if tag == "img" and "alt" not in attr:
            self.add(WARN, "alt", "an <img> needs an alt (empty for decoration)", line)
        if tag == "mark":
            self.mark = [line, ""]
        if "formula" in classes and "aria-label" not in attr:
            self.add(WARN, "formula-label", "say the formula in words in its aria-label", line)

        if attr.get("style"):
            self.check_css(attr["style"], line, inline=True)
        for name in ("data-tip", "data-tip-value", "data-tip-note"):  # text the page shows
            self.check_text(attr.get(name) or "", line, numbers=False)
        if self.in_picture(tag, classes):
            return

        # SVG.
        if tag in ("lineargradient", "radialgradient"):
            self.add(ERROR, "gradient", "nothing has a gradient: every fill is flat", line)
        if tag == "filter":
            self.add(ERROR, "filter", "no SVG filter: no blur, glow, or shadow", line)
        if tag == "rect":
            if any(re.fullmatch(r"0*[1-9][\d.]*(px)?", attr.get(a) or "") for a in ("rx", "ry")):
                self.add(ERROR, "rounded", "nothing is rounded: drop rx and ry", line)
            if "dot" in classes:
                self.add(ERROR, "marker", 'a marker is a circle: <circle class="dot" r="4">', line)
        if "stroke-dasharray" in attr:
            self.add(ERROR, "own-dash", "never write a dash pattern of your own: mark the part .ghost", line)
        if "font-family" in attr:
            self.add(ERROR, "one-face", "never name a font family on a page", line)
        if "filter" in attr and tag != "filter":
            self.add(ERROR, "filter", "no filter attribute: the stylesheet draws the ink ring", line)
        for name in ("fill", "stroke", "stop-color", "color", "bgcolor"):
            value = attr.get(name) or ""
            if COLOUR.search(value) or NAMED.fullmatch(value.lower().strip()):
                self.add(ERROR, "raw-colour", f'raw colour in {name}="{value}": use a class, or style="--fill: var(--c2)"', line)

    # ── Text ──

    def handle_data(self, data):
        line = self.getpos()[0]
        tag = self.stack[-1][0] if self.stack else ""
        if tag == "style":
            if not self.skip_data:
                self.check_css(data, line)
            return
        if not self.in_body or self.skip_data:
            return
        if self.mark is not None:
            self.mark[1] += data
        if self.inside("math") and tag in ("code", "span") and re.search(r"\^|\w_\w", data):
            self.add(ERROR, "maths", "exponents and indices are real <sup> and <sub>: never type ^ or _", line)
        if self.inside(*VERBATIM):
            return
        # Report at the line the character sits on, not where the text node starts.
        for offset, part in enumerate(data.split("\n")):
            self.check_text(part, line + offset, numbers=not self.inside("del", "math", "formula"),
                            maths=not self.inside("math", "formula"))

    def check_text(self, text, line, numbers=True, maths=False):
        found = ARROWS.search(text)
        if found:
            self.add(ERROR, "arrow", f'the font has no arrows or triangles ("{found.group()}"): write "to", use .delta or .link, or draw the head', line)
        found = EMOJI.search(text)
        if found:
            self.add(ERROR, "emoji", f'no emoji or symbol characters ("{found.group()}"): use a glyph from icon.py beside a word', line)
        if maths and MATHS.search(text):
            self.add(WARN, "maths-signs", f'"{MATHS.search(text).group()}" belongs inside maths: elsewhere write "about" or "at most"', line)
        if numbers:
            for pattern, message in NUMBERS:
                found = pattern.search(text)
                if found:
                    self.add(WARN, "number-form", f'"{found.group()}": {message}', line)

    # ── Whole page ──

    def finish(self, source):
        # A token is defined wherever the page names it outside a var(): its CSS, a style attribute, a script, data-bind.
        defined = self.tokens | set(TOKEN_NAME.findall(TOKEN_USE.sub("", source)))
        for name, line in self.token_uses:
            if name not in defined:
                self.add(ERROR, "unknown-token", f"{name} is not a token of the stylesheet or the page: the declaration has no effect", line)
        if not self.has_sheet:
            self.add(ERROR, "stylesheet", 'the page does not load the style: add <link rel="stylesheet" href="style.css">', 1)
        if self.needs_script and not self.has_script:
            self.add(ERROR, "script", 'a part here is driven by style.js: add <script src="style.js" defer></script>', self.needs_script)
        if not self.is_deck:
            for line in self.titles[1:]:
                self.add(WARN, "one-title", "the title appears once per page: make this an <h2>", line)
        seen = set()
        for name, line in self.used:
            if name not in self.known and name not in seen and not name.startswith("language-"):
                seen.add(name)
                self.add(WARN, "unknown-class", f'.{name} is not in the stylesheet or the page\'s CSS: copy the markup from the showcase', line)


def lint(path, classes, tokens, ignore):
    source = path.read_text(encoding="utf-8")
    page = Page(path, classes, tokens)
    page.feed(source)
    page.close()
    page.finish(source)
    lines = source.split("\n")
    kept = []
    for line, level, rule, message in sorted(set(page.findings)):
        allowed = re.search(r"lint-ok:\s*([\w, -]+)", lines[line - 1]) if 0 < line <= len(lines) else None
        if rule in ignore or (allowed and rule in re.split(r"[,\s]+", allowed.group(1))):
            continue
        kept.append((line, level, rule, message))
    return kept


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("pages", nargs="+", type=Path)
    parser.add_argument("--strict", action="store_true", help="fail on warnings too")
    parser.add_argument("--ignore", default="", metavar="RULE,RULE", help="rules to leave out")
    args = parser.parse_args()
    classes, tokens = the_style()
    ignore = set(filter(None, args.ignore.split(",")))

    failed = False
    for path in args.pages:
        findings = lint(path, classes, tokens, ignore)
        for line, level, rule, message in findings:
            print(f"{path}:{line}: {level} {rule}: {message}")
        errors = sum(1 for f in findings if f[1] == ERROR)
        warnings = len(findings) - errors
        print(f"{path}: {errors} error{'s' * (errors != 1)}, {warnings} warning{'s' * (warnings != 1)}", file=sys.stderr)
        failed |= bool(errors or (args.strict and warnings))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
