#!/usr/bin/env python3
"""Print a code sample as highlighted markup for a page.

Usage:
  highlight.py LANG [FILE]            a <pre><code> block; reads stdin without FILE
  highlight.py --inline LANG [FILE]   a <code> span for use inside a sentence
  highlight.py --number LANG [FILE]   the block with its lines numbered
  highlight.py --hl 5,7-9 LANG [FILE] the block with those lines lit
  highlight.py diff [FILE]            a diff: added and removed lines tinted

LANG is a Pygments lexer name: python, typescript, lua, bash, css, html, json.
The output carries Pygments' token classes; style.css colours them.
--number and --hl put each line in a span.line; they combine. A diff is not
highlighted: its "+" and "-" lines become .line.add and .line.del, and the
stylesheet draws the sign, so the output drops it.
Needs Pygments (pip install pygments). Exits with status 1 when it is missing
or LANG is unknown; the page can then keep a plain <pre><code> block.
"""
import argparse
import html
import sys
from pathlib import Path


def numbers(spec):
    """The line numbers in "5,7-9", as a set."""
    picked = set()
    for part in filter(None, spec.split(",")):
        first, _, last = part.partition("-")
        picked.update(range(int(first), int(last or first) + 1))
    return picked


def in_lines(body, classes=lambda n: ""):
    """Each line in a span.line that ends in its own newline: the spans are
    blocks, and a newline between two blocks would show as an empty line."""
    return "".join(f'<span class="{("line " + classes(n)).strip()}">{line}\n</span>'
                   for n, line in enumerate(body.split("\n"), 1))


def diff(code):
    """A unified diff as a pre.diff block. File and hunk headers are dropped."""
    out = []
    for line in code.split("\n"):
        if line.startswith(("+++", "---", "@@", "diff ", "index ")):
            continue
        cls = {"+": "line add", "-": "line del"}.get(line[:1], "line")
        text = line[1:] if line[:1] in "+- " else line
        out.append(f'<span class="{cls}">{html.escape(text)}\n</span>')
    return '<pre class="diff"><code>' + "".join(out) + "</code></pre>"


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("lang")
    parser.add_argument("file", nargs="?", type=Path)
    parser.add_argument("--inline", action="store_true")
    parser.add_argument("--number", action="store_true", help="number the lines")
    parser.add_argument("--hl", default="", metavar="LINES", help="lines to light, such as 5,7-9")
    args = parser.parse_args()

    if args.lang == "diff":
        code = args.file.read_text(encoding="utf-8") if args.file else sys.stdin.read()
        print(diff(code.strip("\n")))
        return 0

    try:
        from pygments import highlight
        from pygments.formatters import HtmlFormatter
        from pygments.lexers import get_lexer_by_name
        from pygments.util import ClassNotFound
    except ImportError:
        print("Pygments is not installed: pip install pygments", file=sys.stderr)
        return 1
    try:
        lexer = get_lexer_by_name(args.lang)
    except ClassNotFound:
        print(f"unknown language {args.lang!r}", file=sys.stderr)
        return 1

    code = args.file.read_text(encoding="utf-8") if args.file else sys.stdin.read()
    body = highlight(code.strip("\n"), lexer, HtmlFormatter(nowrap=True)).rstrip("\n")
    lit = numbers(args.hl)
    if args.inline:
        print(f'<code class="language-{args.lang}">{body}</code>')
    elif args.number or lit:
        body = in_lines(body, lambda n: "hl" if n in lit else "")
        numbered = ' class="numbered"' if args.number else ""
        print(f'<pre{numbered}><code class="language-{args.lang}">{body}</code></pre>')
    else:
        print(f'<pre><code class="language-{args.lang}">{body}</code></pre>')
    return 0


if __name__ == "__main__":
    sys.exit(main())
