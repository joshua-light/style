# style

My visual style, packaged as a plugin for Claude Code and Codex. It steers reports, explainers, dashboards, slides, and charts toward one look: dark gray panels, black borders, square corners, a Warrior-tan accent, Melli-textured fills, and Expressway text with outlined headings.

Open `skills/guide/assets/showcase.html` in a browser to see every component.

## Credits

The style builds on work by others:

- [ElvUI](https://tukui.org/elvui) by the Tukui team. Its pixel-thin black borders, dark backdrops, and outlined text set the look.
- [EllesmereUI](https://www.curseforge.com/wow/addons/ellesmereui) by Ellesmere. Its overall polish is the starting point.
- **Melli**, the status-bar texture shipped with ElvUI. `style.css` reproduces its luminance curve as a CSS gradient; the texture file is not included.
- [Expressway](https://typodermicfonts.com/) by Ray Larabie, Typodermic Fonts. The typeface both interfaces use.

## Fonts

Expressway is licensed by Typodermic and its files carry a "do not distribute" notice, so this repo does not include them. Put your own copies here:

| File | Style |
| --- | --- |
| `skills/guide/assets/fonts/expressway.{woff2,ttf,otf}` | Expressway Bold, the file ElvUI ships as `Expressway.ttf`. |
| `skills/guide/assets/fonts/expressway-xb.{woff2,ttf,otf}` | Expressway Extra Bold. |

Without them, pages fall back to Overpass. Embedding the font in pages you publish may need a web licence from Typodermic.

## Layout

| Path | Purpose |
| --- | --- |
| `skills/guide/SKILL.md` | The rules. Both tools load it. |
| `skills/guide/assets/style.css` | Tokens and components. |
| `skills/guide/assets/showcase.html` | Reference markup for every component. |
| `skills/guide/scripts/build.py` | Inlines the stylesheet and fonts into a page. |
| `.claude-plugin/` | Claude Code plugin and marketplace manifests. |
| `.codex-plugin/plugin.json` | Codex plugin manifest. |
| `.agents/plugins/marketplace.json` | Codex marketplace manifest. |
| `assets/icon.svg` | Icon source. Re-render the PNG with `rsvg-convert -w 1024 -h 1024 assets/icon.svg -o assets/icon.png`. |

## Install

Claude Code:

```sh
claude plugin marketplace add /path/to/style
claude plugin install style@j-light-style
```

Codex:

```sh
codex plugin marketplace add /path/to/style
codex plugin add style@j-light-style
```

## Update after editing

Claude Code reads the plugin straight from this directory. Edits apply at the next session start or after `/reload-plugins`.

Codex runs a cached copy. Refresh it by reinstalling; no version bump needed:

```sh
codex plugin add style@j-light-style
```

## License

MIT for the code and rules in this repo. Expressway, ElvUI, and EllesmereUI belong to their authors.
