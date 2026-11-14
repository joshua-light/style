---
name: guide
description: Joshua Light's personal visual style — dark gray surfaces, black borders, no rounding, Warrior-tan accent, Melli-textured data fills, Expressway text with outlined headings (the ElvUI / EllesmereUI look). Use before creating or restyling anything meant to be looked at — reports, explainers, dashboards, slides, charts, diagrams, HTML/SVG/image output. Also use when the user gives feedback on how something looks, so the preference gets recorded.
---

# Visual style guide

The look comes from ElvUI and EllesmereUI, the World of Warcraft interfaces: dark gray panels, one-pixel black borders, square corners, flat dark heads, a tan accent on text, colour fills under the Melli texture, and Expressway text with black-outlined headings. It reads like an inked comic panel.

Apply these rules to every visual output. Where another design skill disagrees on palette, font, rounding, or light mode, these rules win. Use other skills for method only, such as choosing a chart form.

## Build a page

Paths are relative to this skill's directory.

1. Read `assets/showcase.html`. It holds the markup for every component.
2. Write the page with `<link rel="stylesheet" href="style.css">` in its head and the showcase's classes in its body.
3. Run `python3 scripts/build.py page.html`. It inlines `assets/style.css` and embeds the fonts, so the page stands alone.
4. Open or screenshot the result and check it against the rules below.

Page-specific CSS goes in a second `<style>` and uses the tokens (`var(--s4)`, `var(--panel)`), never raw values. If `build.py` warns that Expressway is missing, the page falls back to Overpass; tell the user.

## Surfaces and ink

The style is dark only. Never add a light theme.

| Token | Value | Use |
| --- | --- | --- |
| `--ink` | `#000000` | Every border, every outline. The only black. |
| `--sunken` | `#1a1a1a` | Table heads (`--head`), bar tracks, code, wells. |
| `--page` | `#242424` | The page. |
| `--panel` | `#2e2e2e` | Panels, callouts, slides. |
| `--raised` | `#3a3a3a` | Neutral tags, hover. |

- Every container edge is `1px solid #000`.
- Nothing is rounded: no `border-radius`, no round markers. The pie chart is the one round shape.
- Depth comes from the gray steps. No soft shadows, no blur, no glow, no transparency.
- No box has a head bar. Panel titles and callout kinds sit on the top border (see On the border). Table heads are flat `--head`: much darker than the rows, never textured, never coloured.
- Melli is the only gradient.

## Melli

Melli is a status-bar texture: a vertical luminance curve that multiplies the colour under it.

- Melli goes on colour fills only: bars, columns, stacked segments, pies, swatches, coloured tags.
- Gray surfaces stay flat: the page, panel bodies, every head, neutral tags.
- In CSS: `background: var(--melli), <colour>`.
- Melli always runs top to bottom, on columns too. Never rotate it.
- Outside CSS, multiply the colour by this curve, top to bottom: 0.69 at 0%, 0.83 at 40%, 0.97 at 73%, 1.0 from 84% to 90%, 0.76 at 100%.

## Text

Expressway sets everything except code. The regular weight is already bold; extra-bold marks headings and emphasis. Nothing is italic.

Each size has one meaning. Pick the size by meaning, never by looks, and never use a size off the scale.

| Token | Size / line | Meaning |
| --- | --- | --- |
| `--fs-title` | 40 / 48 | The name of the whole piece. Once per page or slide. |
| `--fs-heading` | 28 / 36 | Section heads and hero numbers. |
| `--fs-subheading` | 20 / 28 | Subsection heads and the lead sentence. |
| `--fs-body` | 16 / 24 | Prose read in sentences. |
| `--fs-label` | 14 / 20 | Anything scanned: table cells, meter labels, legends, callouts, panel heads. |
| `--fs-note` | 12 / 16 | Captions, axis ticks, units, eyebrows, table heads. |

- Headings and titles wear the black outline: title, heading, subheading, hero numbers (`.stat-value`), the titles of boxes (panel heads, stat labels), and text that sits on a border (stat deltas, meter names and values). Everything else stays plain: prose, table cells, legends, chart text.
- The outline scales with the text: 7% of the font size, between 1.25px and 2px. That gives 1.25px on small titles, 1.4px at 20px, and 2px from 28px.
- Draw it as a stroke under the fill, twice the visible width (`-webkit-text-stroke: calc(2 * var(--outline)) #000` with `paint-order: stroke fill`). Never fake it with stacked `text-shadow`s: they look lumpy.
- Outlined letters must sit at least 2px apart, or the fills swallow the line between them and a letter looks half-outlined. The stylesheet's `--fit` adds that spacing to headings.
- Plain text keeps the browser's default rendering. Never set `-webkit-font-smoothing`, `text-rendering`, `paint-order`, or a text stroke (even `0px`) on it: together they made body text look soft in Chrome. Only headings and titles get the stroke.
- Never clip outlined text at the glyph edge. A box with `overflow: hidden` needs padding as wide as the outline around its text.
- Without an outline, text needs a surface it reads on. White text sits only on gray surfaces. Text on a colour fill (coloured tags, callout kinds, stacked-bar segments) is ink black. Plain text never sits on a bar: it would cross from fill to track. A meter's name and value are outlined and sit on the bar's top edge.
- Text has three colours: `--text` `#f2f2f2` for content, `--text-dim` `#b8b8b8` for labels and captions, `--text-faint` `#8f8f8f` for markers and disabled items.
- Coloured text is for links and eyebrows (accent) and deltas (green up, crimson down). Text never wears a series colour.
- Uppercase with extra tracking appears only at note size: eyebrows, table heads, tags, stat labels.
- Prose lines stop at 640px (`--measure`).
- Bulleted lists use square markers at every level and nest three levels at most. Numbered lists switch to letters one level down. Numbers are `--text-dim`; bullets are `--text-faint`.
- A quote is its own box with a large outlined opening mark in the accent colour on its top border, and the source in a `<cite>` at note size. The mark is an ornament and the only glyph off the type scale. Never mark a quote with only a side rule or dim text: it does not read as a quote.
- Expressway has no arrows, triangles, or `≈ ≤ ≥`. Use `.delta` for up and down; write "to" and "about".

## On the border

Titles and key values sit across a box's top border, not inside it. They look laid on top of the frame.

- A panel's title is 20px extra-bold, 12px in from the left, centred on the top border. There is no head bar.
- A tag may sit on the same border at the right.
- A callout names its kind in a coloured tag at the top left. The tag sets it apart from a panel.
- A stat wears its label at the top left and its delta or tag at the top right.
- A meter bar wears its name at the top left and its value at the top right.
- Only the top border carries text. Never hang text off the bottom or the sides.
- Text on a border is always outlined, so it reads over both surfaces. A tag is a solid chip and needs none.
- Centre it with an offset of half the line height, in whole pixels. Never use a transform: it lands on half pixels and blurs the text.
- A box with text on its border needs 24px of clear space above it.

## Space

Every gap is one of seven steps. Each has one meaning.

| Token | px | Meaning |
| --- | --- | --- |
| `--s1` | 4 | Touch: bar to bar, swatch to label. |
| `--s2` | 8 | Item: rows in a group, list items, label to value. |
| `--s3` | 12 | Cell: horizontal padding of cells, heads, and bars. |
| `--s4` | 16 | Panel: panel padding, and the gutter between panels. |
| `--s5` | 24 | Block: between blocks in the flow. |
| `--s6` | 32 | Subsection: above a subheading. |
| `--s7` | 48 | Section: above a heading; the page margin. |

- Panel padding equals the gutter, so a grid of panels looks evenly spaced inside and out.
- `.page` and `.flow` space their children by these rules. Do not add margins by hand.
- `.page` is 960px wide; `.page.wide` is 1200px for dashboards.
- Grid columns sit 16px apart and rows 24px apart: titles on a top border need the room.
- `.grid` has 12 columns. Children span 12 unless given `.span-3`, `-4`, `-6`, `-8`, or `-9`. Below 760px, spans collapse.
- Fixed heights: 28px for table heads; 16px for a bar; 20px for a meter bar; 8px for a thin bar; 24px for a stacked bar; 20px for a tag.

## Colour

The accent is `--accent` `#c69b6d`, the Warrior class colour. It dresses text only: links and eyebrows.

- Charts never use the accent. No bar, column, line, swatch, or tag is filled with `--accent`, and no series colour is defined from it. Changing the accent must not recolour any data.
- The accent is not a replacement for other colours. States keep their usual colours: green for good, red for bad. A gain, a kill, or a tip is green, never the accent.

Data and state colours are three metals and five enamels:

| Token | Value | Use |
| --- | --- | --- |
| `--azure` | `#5fa5de` | Series. Also neutral notes. |
| `--gold` | `#cfb53b` | Series. |
| `--amethyst` | `#9964c4` | Series. |
| `--copper` | `#db7c3d` | Series. Also needs attention. |
| `--silver` | `#c9cdd2` | Series. |
| `--rose` | `#df8db5` | Series. |
| `--green` | `#5bc663` | Positive state. Never a series. A plain light green: never teal, mint, or blue-green. |
| `--crimson` | `#e13c5b` | Negative state, danger. Never a series. |

State tokens: `--good` green, `--warn` copper, `--bad` crimson, `--info` azure.

Series colours, assigned in this order: `--c1` azure, `--c2` gold, `--c3` amethyst, `--c4` copper, `--c5` silver, `--c6` rose. `--c-other` `#7a7a7a` holds everything past six. A mark with no `--fill` takes `--c1`.

- Never add a yellow, amber, or lime. None separates from gold, least of all for colour-blind readers.
- Set a fill with `style="--fill: var(--c2)"`.
- A colour follows its entity across every chart on the page, whatever its rank.
- A chart with one series uses one colour.
- Status colours mark state only, and always sit next to a word.
- Colour never carries identity alone: label the mark or add a `.legend`.

## Components

Markup for each is in `assets/showcase.html`.

- **Panel** (`.panel`): an optional `.panel-head` title on the top border, body padded 16px. A `.tag` inside the head lands on the border at the right. `.panel-body.flush` lets a table run edge to edge; under a title, the strip between the panel's top border and the table head is `--head` too, and the table head keeps a black line above and below it.
- **Callout** (`.callout.note|tip|warn|bad`): the kind's name in a tag of the kind's colour, on the top border at the left. Keep to one or two per screen.
- **Stat** (`.panel.stat`): note-size label on the top border at the left, `.stat-foot` with one `.delta` or `.tag` on the same border at the right, heading-size value inside, then an optional `.stat-note` caption at the bottom left saying what the delta compares against ("vs last week"), thin bar, or sparkline. A delta never appears without its comparison.
- **Bar** (`.bar`): the signature mark, a Melli fill in a sunken track. It carries no plain text. `.bar.thin` is the small one. `.bar.stack` splits one bar into `.bar-seg` parts, which may hold an ink label.
- **Meter** (`.meter`): a ranked list of `.meter-row`s, each a label, a bar, and a value. The name sits on the bar's top edge at the left and the value on the same edge at the right, as a unit frame names a health bar. This is the horizontal bar chart.
- **Table** (`.table`): note-size uppercase heads, label-size cells, numbers right-aligned with `.num`.
- **Pie** (`.pie`): an SVG of `.pie-slice` circles and `.pie-cut` lines. Each slice sets `--v`, its share in percent, and `--at`, the sum of the shares before it. No arc geometry is needed.
- **Tag** (`.tag`): a short state word.
- **Slide** (`.slide`): a 16:9 panel with 48px padding. One title, one supporting line, one figure.

## Charts

- Ranked values: a `.meter`.
- Values over a few categories: `.cols`. Label each column directly; there is no y-axis. `--max` sets the scale.
- Parts of a whole: `.bar.stack` with a legend, or a `.pie`.
- A pie holds five slices at most, starts at 12 o'clock, and runs clockwise from the largest slice, with "other" last. Every boundary gets a black cut line, and Melli runs top to bottom over the whole disc. Names and values go in a `.legend.list` beside it, never on the slices. No donuts, no exploded slices, no 3D.
- Change over time: an inline SVG `.chart`. Lines are 2px with mitered joins and a black ring; markers are 8px squares; gridlines are `--sunken`; the baseline is ink. Label each line at its end and keep the legend.
- A trend inside a stat: `.spark`.
- An SVG chart scales as a whole, text included. Draw its `viewBox` at the width it will render.
- Charts from other tools (matplotlib, plotly) follow the same tokens: `--panel` background, 1px black edges on every mark, square markers, mitered joins, the Melli curve on fills, plain Expressway labels with the outline on the title only (font files are in `assets/fonts/`).

## Motion

| Token | Value | Meaning |
| --- | --- | --- |
| `--t-fast` | 120ms | A state changes: hover, press. |
| `--t-base` | 240ms | An element enters. |
| `--t-slow` | 480ms | Data draws: bars fill, columns rise, lines trace. |
| `--t-step` | 40ms | Delay between staggered siblings. |

- Add `.anim` to a container to turn motion on. Bars, columns, and lines inside it animate on their own.
- `.enter` fades an element in over an 8px rise. `.stagger` on a parent delays each child by one step.
- A line needs `pathLength="1"` to trace. A pie slice needs `pathLength="100"`.
- Everything plays once, on entry. Nothing loops, bounces, or moves more than 8px.
- The stylesheet already honours reduced-motion settings.

## Recording preferences

When the user states a visual preference or corrects how something looks, offer to record it. Edit the source repo (`joshua-light/style`), not the installed copy: change `assets/style.css` and `assets/showcase.html`, then the matching rule here. Write each rule as a concrete instruction.
