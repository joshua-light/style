#!/usr/bin/env python3
"""Print a code sample as highlighted markup for a page.

Usage:
  highlight.py LANG [FILE]            a <pre><code> block; reads stdin without FILE
  highlight.py --inline LANG [FILE]   a <code> span for use inside a sentence

LANG is a Pygments lexer name: python, typescript, lua, bash, css, html, json.
The output carries Pygments' token classes; style.css colours them.
Needs Pygments (pip install pygments). Exits with status 1 when it is missing
or LANG is unknown; the page can then keep a plain <pre><code> block.
"""
import argparse
import sys
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("lang")
    parser.add_argument("file", nargs="?", type=Path)
    parser.add_argument("--inline", action="store_true")
    args = parser.parse_args()

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
    if args.inline:
        print(f'<code class="language-{args.lang}">{body}</code>')
    else:
        print(f'<pre><code class="language-{args.lang}">{body}</code></pre>')
    return 0


if __name__ == "__main__":
    sys.exit(main())
