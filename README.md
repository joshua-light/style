# style

My visual style, packaged as a plugin for Claude Code and Codex. It steers reports, explainers, dashboards, slides, and charts toward one look: dark gray panels, black borders, square corners, a Warrior-tan accent, flat colour fills, and Expressway text with outlined headings.

Open `skills/guide/assets/showcase.html` in a browser to see every component. Open `examples/voyager-deck.html` to see a deck: step through it with the arrow keys or a click.

## Credits

The style builds on work by others:

- [ElvUI](https://tukui.org/elvui) by the Tukui team. Its pixel-thin black borders, dark backdrops, and outlined text set the look.
- [EllesmereUI](https://www.curseforge.com/wow/addons/ellesmereui) by Ellesmere. Its overall polish is the starting point.
- [Expressway](https://typodermicfonts.com/) by Ray Larabie, Typodermic Fonts. The typeface both interfaces use.
- [Fira Sans](https://github.com/mozilla/Fira) by Carrois Apostrophe, for Mozilla and Telefónica. The bundled fallback.
- [Remix Icon](https://remixicon.com) by Remix Design. Its fill set supplies the symbol icons.
- [Michael Silveira](https://michaelsilveira.me/), for the [didactician](https://github.com/gravitypersists/didactician) skill and the [ETH explainer](https://gravitypersists.github.io/explainer-eth-disproved/) made with it. The explainer components here follow that page: steppers, quizzes, margin notes, linked prose. `examples/eth-explainer.html` restyles its text and figures.

## Fonts

Out of the box, pages are set in Fira Sans. Its Regular and Bold ship in `skills/guide/assets/fonts/` under the SIL Open Font License, cut down to Latin, Greek, Cyrillic, and symbols.

The style was drawn for Expressway and uses it where you add it. Expressway is licensed by Typodermic and its files carry a "do not distribute" notice, so this repo does not include them. Put your own copies here:

| File | Style |
| --- | --- |
| `skills/guide/assets/fonts/expressway.{woff2,ttf,otf}` | Expressway Bold, the file ElvUI ships as `Expressway.ttf`. |
| `skills/guide/assets/fonts/expressway-xb.{woff2,ttf,otf}` | Expressway Extra Bold. Sets emphasis only where Regular is not installed. |

With the Bold file in place, text is set in Expressway Regular, a free download from [DaFont](https://www.dafont.com/expressway.font) or 1001 Fonts. Its desktop licence forbids converting or embedding the file, so do not put it in this repo: install it on your machine (for example in `~/.local/share/fonts/`) and the stylesheet finds it by name. On a machine without it, text falls back to Expressway Bold.

Install the TrueType file, `expressway rg.ttf` (version 6.000), not the OpenType `expressway rg.otf` (version 6.100). The OpenType file has wrong hinting zones: on Linux its round letters (`o`, `e`, `s`) render a pixel taller than `n` and `r` at text sizes.

Without the Bold file, Fira Sans sets everything, even where Expressway Regular is installed: the two faces never mix. Fira Sans takes Expressway's ascent and descent, so layouts match in either face.

Embedding Expressway in pages you publish may need a web licence from Typodermic.

## Layout

| Path | Purpose |
| --- | --- |
| `skills/guide/SKILL.md` | The rules. Both tools load it. |
| `skills/guide/assets/style.css` | Tokens and components. |
| `skills/guide/assets/style.js` | Tooltips, hover highlighting, reveal on scroll, tabs, sorting, steppers, quizzes, bound sliders, the contents rail, deck keys, builds, and popups. |
| `skills/guide/assets/style.mplstyle` | The same look for matplotlib charts. |
| `skills/guide/assets/showcase.html` | Reference markup for every component. |
| `skills/guide/assets/icons/remix-fill.json` | Remix Icon's fill set, one icon per line. |
| `skills/guide/assets/fonts/` | Fira Sans, the fallback face, and its licence. Your Expressway files go here too; git ignores them. |
| `skills/guide/scripts/build.py` | Inlines the stylesheet, script, and fonts into a page. |
| `skills/guide/scripts/icon.py` | Prints the markup for an icon, or looks one up by name. |
| `skills/guide/scripts/highlight.py` | Prints a code sample as highlighted markup. Needs Pygments. |
| `skills/guide/scripts/mpl_style.py` | Finishes a matplotlib figure: ink rings on lines, outlined title. |
| `examples/voyager-deck.html` | The reference deck: builds, growth, a popup, motion to scale, and a speed slider for review. |
| `examples/eth-explainer.html` | A long explainer page: Michael Silveira's ETH explainer, restyled. Its licence sits beside it. |
| `.claude-plugin/` | Claude Code plugin and marketplace manifests. |
| `.codex-plugin/plugin.json` | Codex plugin manifest. |
| `.agents/plugins/marketplace.json` | Codex marketplace manifest. |
| `assets/icon.svg` | Icon source. Re-render the PNG with `rsvg-convert -w 1024 -h 1024 assets/icon.svg -o assets/icon.png`. |

## Install

Claude Code:

```sh
claude plugin marketplace add joshua-light/style
claude plugin install style@j-light-style
```

Codex:

```sh
codex plugin marketplace add joshua-light/style
codex plugin add style@j-light-style
```

To edit the style, clone the repo and give either tool the clone's path instead of `joshua-light/style`.

## Update after editing

Installed from a local path, Claude Code reads the plugin straight from that directory. Edits apply at the next session start or after `/reload-plugins`.

Codex runs a cached copy. Refresh it by reinstalling; no version bump needed:

```sh
codex plugin add style@j-light-style
```

## License

MIT for the code and rules in this repo. Expressway, ElvUI, and EllesmereUI belong to their authors.

The Fira Sans files in `skills/guide/assets/fonts/` are published under the SIL Open Font License 1.1; the licence text sits beside them.

The text and figures of `examples/eth-explainer.html` come from [explainer-eth-disproved](https://github.com/gravitypersists/explainer-eth-disproved), copyright 2026 Michael Silveira, used under the MIT License. The notice is in the page and in `examples/eth-explainer-LICENSE.txt`.

The icons in `skills/guide/assets/icons/` are Remix Icon 4.8.0, published under Apache 2.0; the licence text sits beside them. Remix Icon releases from January 2026 use the Remix Icon License v1.0 instead, which also allows icons inside a design system but not resale as an icon pack. Read it before updating the set.
