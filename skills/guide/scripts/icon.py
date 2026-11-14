#!/usr/bin/env python3
"""Print the markup for a symbol icon, or find one by name.

Usage:
  icon.py NAME...              a bare outlined glyph for each name
  icon.py --tile NAME...       the glyph on a dark 24px tile
  icon.py --tile --fill c1 NAME...   the glyph on a tile in a series or state colour
  icon.py --find WORD          names that contain WORD

Names are Remix Icon's, with or without the "-fill" suffix: "sword", "coins-fill".
The icons live in assets/icons/remix-fill.json (Remix Icon 4.8.0, fill set).
Exits with status 1 and lists near matches when a name is unknown.
"""
import argparse
import difflib
import json
import sys
from pathlib import Path

ICONS = Path(__file__).resolve().parent.parent / "assets" / "icons" / "remix-fill.json"


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("names", nargs="*")
    parser.add_argument("--find", metavar="WORD")
    parser.add_argument("--tile", action="store_true")
    parser.add_argument("--fill", metavar="TOKEN", help="colour token for a tile, such as c1 or warn")
    args = parser.parse_args()
    icons = json.loads(ICONS.read_text(encoding="utf-8"))

    if args.find:
        print("\n".join(name for name in icons if args.find.lower() in name))
        return 0
    if not args.names:
        parser.error("give an icon name, or --find WORD")

    status = 0
    for raw in args.names:
        name = raw.removesuffix("-fill")
        body = icons.get(name)
        if body is None:
            near = difflib.get_close_matches(name, icons, n=5, cutoff=0.5)
            print(f"unknown icon {raw!r}; near matches: {', '.join(near) or 'none'}", file=sys.stderr)
            status = 1
            continue
        svg = f'<svg viewBox="0 0 24 24" aria-hidden="true">{body}</svg>'
        if args.tile:
            fill = f' style="--fill:var(--{args.fill})"' if args.fill else ""
            print(f'<span class="icon"{fill}>{svg}</span>')
        else:
            print(f'<span class="glyph">{svg}</span>')
    return status


if __name__ == "__main__":
    sys.exit(main())
