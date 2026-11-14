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
2. Write the page with `<link rel="stylesheet" href="style.css">` and `<script src="style.js" defer></script>` in its head and the showcase's classes in its body. The script drives tooltips, hover highlighting, reveal on scroll, tabs, sortable tables, and stepping through a deck.
3. Run `python3 scripts/build.py page.html`. It inlines `assets/style.css` and `assets/style.js` and embeds the fonts, so the page stands alone.
4. Open or screenshot the result and check it against the rules below.

Page-specific CSS goes in a second `<style>` and uses the tokens (`var(--s4)`, `var(--panel)`), never raw values. If `build.py` warns that Expressway is missing, the page falls back to Overpass; tell the user.

## Surfaces and ink

The style is dark only. Never add a light theme.

| Token | Value | Use |
| --- | --- | --- |
| `--ink` | `#000000` | Every border, every outline. The only black. |
| `--sunken` | `#1a1a1a` | Table heads (`--head`), bar tracks, code, wells. |
| `--page` | `#1e1e1e` | The page. |
| `--inset` | `#222222` | A box inside a box: nested panels, table rows. |
| `--panel` | `#2e2e2e` | Top-level boxes: panels, callouts, slides. |
| `--raised` | `#3a3a3a` | Neutral tags. |

- Every container edge is `1px solid #000`.
- Nothing is rounded: no `border-radius`, no round markers. The pie chart is the one round shape.
- A top-level box is light gray (`--panel`). A box inside it is dark (`--inset`): a stat, table, or chart panel on a slide, a panel in a panel. The stylesheet does this by nesting; never set it by hand, and never make a top-level panel dark.
- Depth comes from the gray steps. No soft shadows, no blur, no glow, no transparency.
- No box has a head bar. Panel titles and callout kinds sit on the top border (see On the border). Table rows are `--inset`; heads are flat `--head`, one step darker, never textured, never coloured. A hovered row turns `--panel`.
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
- Highlight the names of things inside running text with `<mark>`, as game text colours an item's name: an item, a player, a category ("Buy <mark>of Shadow Wrath</mark>"). A mark is accent-coloured, with no background and no underline.
  - Mark names only. Never mark a number, a verdict, or a whole phrase, and never give a mark a state colour.
  - Mark running text only: body, leads, list items. Titles and headings stay white.
  - Keep it sparse: most sentences have no mark. When highlighting starts to compete with the content, remove marks.
- Other coloured text: links and eyebrows (accent) and deltas (green up, crimson down). Text never wears a series colour.
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
- No panel shows empty space. Panels in a grid row share a height, and the content takes the spare room: table rows stretch, a sparkline grows, a chart row centres. Pick spans so the content also fills the width; a `.legend.list` takes what a pie leaves.
- When one panel is much taller than its neighbour, give it `.rows-2` and stack two short panels beside it.
- `.grid` has 12 columns. Children span 12 unless given `.span-3`, `-4`, `-6`, `-8`, or `-9`. Below 760px, spans collapse.
- Fixed heights: 28px for table heads; 16px for a bar; 20px for a meter bar; 8px for a thin bar; 24px for a stacked bar; 20px for a tag.

## Colour

The accent is `--accent` `#c69b6d`, the Warrior class colour. It dresses text only: links and eyebrows.

- Charts never use the accent. No bar, column, line, swatch, or tag is filled with `--accent`, and no series colour is defined from it. Changing the accent must not recolour any data.
- The accent is not a replacement for other colours. States keep their usual colours: green for good, red for bad. A gain, a kill, or a tip is green, never the accent.

Data and state colours are three metals and six enamels:

| Token | Value | Use |
| --- | --- | --- |
| `--azure` | `#5fa5de` | Series. Also neutral notes. |
| `--gold` | `#cfb53b` | Series. |
| `--amethyst` | `#9964c4` | Series. |
| `--copper` | `#db7c3d` | Series. |
| `--silver` | `#c9cdd2` | Series. |
| `--rose` | `#df8db5` | Series. |
| `--green` | `#5bc663` | Positive state. Never a series. A plain light green: never teal, mint, or blue-green. |
| `--yellow` | `#ffeb4e` | Warning, needs attention. Never a series. Never orange. |
| `--crimson` | `#e13c5b` | Negative state, danger. Never a series. |

State tokens: `--good` green, `--warn` yellow, `--bad` crimson, `--info` azure.

Series colours, assigned in this order: `--c1` azure, `--c2` gold, `--c3` amethyst, `--c4` copper, `--c5` silver, `--c6` rose. `--c-other` `#7a7a7a` holds everything past six. A mark with no `--fill` takes `--c1`.

- Never add an amber, lime, or second yellow. None separates from gold, least of all for colour-blind readers. `--yellow` separates only because it is much lighter: never darken it.
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
- **Icon**: see Icons below.
- **Table extras**: `<tfoot>` holds totals, as dark as the head and extra-bold. A `<th colspan>` row inside a `<tbody>` heads a group; give each group its own `<tbody>`. `class="sortable"` sorts on a click of a head; mark the starting column with `aria-sort`.
- **Key-value list** (`dl.kv`): label and value pairs, ruled, values at the right. For a handful of facts about one thing.
- **Empty state** (`.empty`): one dim centred line, with an optional glyph, in a panel that has nothing to show. Say what would fill it.
- **Figure frame** (`figure.frame`): an image, SVG, or video in a 1px ink frame, caption below.
- **Slide**: see Slides and decks below.

## Code

Code is set in the monospace face inside a `--sunken` box with a black border.

- Highlight any sample longer than a line. Run `python3 scripts/highlight.py LANG FILE` (or pipe the code in) and paste the output; `--inline` gives a `<code>` span for a sentence. It needs Pygments; without it, leave the block plain.
- The scheme is "Metals", warm and restrained:

| Role | Colour |
| --- | --- |
| Keywords, HTML tags | accent tan |
| Strings | gold |
| Numbers, constants (`true`, `nil`, `None`) | copper |
| Function names, types, built-ins | silver |
| Comments | `--text-faint` |
| Punctuation, operators | `--text-dim` |
| Other names | white |

- Never add a colour outside this table: no green, azure, amethyst, or rose in code.
- Code has one weight and no italics, comments included.
- Never write token colours into a page. The stylesheet owns them through the `--code-*` tokens.
- Keep lines under 60 characters where the block sits in half a page, so nothing scrolls sideways.

## Icons

- **Glyph** (`.glyph`): a symbol, such as a sword for "flips" or a clock for "time". Glyphs come only from Remix Icon's fill set, which ships in `assets/icons/remix-fill.json`.
  - Get the markup with `python3 scripts/icon.py NAME`; look a name up with `python3 scripts/icon.py --find WORD`. Paste the output into the page. Never draw a glyph by hand or fetch one from another set.
  - A glyph has no background. This is the default for every icon.
  - A glyph takes the colour of the text it is attached to: accent beside an eyebrow, white beside a value, dim beside a caption. Never give a glyph a colour of its own.
  - A glyph is as tall as one line of that text: 16px beside a note, 24px beside body text, 36px beside a hero number. The stylesheet sizes it; never set a size by hand.
  - A glyph wears the same black outline as a heading. Never show one without it.
  - Never use line icons, pixel icons, emoji, or a second icon set: thin strokes cannot carry the outline.
- Attach a glyph to its text with `<span class="with-icon">GLYPH<span>Label</span></span>`, 8px apart. `.with-icon` also works as a class on the text's own element, such as `<p class="eyebrow with-icon">`.
- An icon never carries meaning alone: pair it with a word.
- **Tile** (`.icon` holding a glyph): the glyph in a bordered 24px square, from `icon.py --tile NAME`, dark or with `--fill c1` on a colour under Melli. The exception: use it only where the icon must stand as a mark of its own, such as beside a meter bar. A tile on a colour follows the colour rules.
- **Picture icon** (`.icon` holding an image): real art, such as a game item: `<span class="icon"><img src="…" alt=""></span>`. 24px, with a black border; the image is zoomed 20% and cropped to trim the frame game icons carry.
- Beside a meter bar: put a tile or picture icon first in the `.meter-row`. It stands left of the bar, centred on it, 4px away, and the name stays over the bar.

## Charts

- Ranked values: a `.meter`.
- Values over a few categories: `.cols`. Label each column directly; there is no y-axis. `--max` sets the scale.
- Parts of each column: stack several `.col-fill` in one `.col`, top part first, one colour per series, with a legend.
- Two series per category: put the fills side by side in `.col-bars`. Two series at most; values go in tooltips.
- A value against a goal: add `<span class="bar-mark" style="--at:80">` inside the `.bar`. It is a white tick with an ink ring. Say what it marks in a caption or legend.
- Gains and losses: `.bar.diverge`. The fill grows right from the middle for a gain and left (`.bar-fill.neg`) for a loss; `--v` is a share of one half. Gains are green, losses crimson, and the signed value sits beside each bar.
- Two dimensions, such as day by hour: `.heat`. Each `.heat-cell` takes `--v` from 0 to 100. One hue only, set with `--fill`; never a rainbow. Put a `.heat-scale` key under it, and give every cell a tooltip.
- Parts of a whole: `.bar.stack` with a legend, or a `.pie`.
- A pie holds five slices at most, starts at 12 o'clock, and runs clockwise from the largest slice, with "other" last. Every boundary gets a black cut line, and Melli runs top to bottom over the whole disc. Names and values go in a `.legend.list` beside it, never on the slices. No donuts, no exploded slices, no 3D.
- A single trend where the amount matters: add an `.area` under the line, with a second copy as `.area-melli` and the `#melli` gradient from the showcase. One series only: areas hide each other.
- Change over time: an inline SVG `.chart`. Lines are 2px with mitered joins and a black ring; markers are 8px squares; gridlines are `--sunken`; the baseline is ink. Label each line at its end and keep the legend.
- A trend inside a stat: `.spark`.
- An SVG chart scales as a whole, text included. Draw its `viewBox` at the width it will render.
- For matplotlib, use the ready theme: `plt.style.use("assets/style.mplstyle")`, then `from mpl_style import finish` (in `scripts/`) and call `finish(fig)` before saving. It adds the Melli shading, the ink edges, and the outlined title.
- Charts from other tools (matplotlib, plotly) follow the same tokens: `--panel` background, 1px black edges on every mark, square markers, mitered joins, the Melli curve on fills, plain Expressway labels with the outline on the title only (font files are in `assets/fonts/`).

## Explainers

- **Diagram** (`.diagram`): a chain of `.node` boxes joined by `.link` arrows. `.diagram.down` runs top to bottom. A node holds a `<strong>` name and an optional `<span>` note.
- A diagram that branches or loops is an inline SVG `.chart` with `.box` rectangles, `.wire` paths, and `.arrow` heads. Wires are 2px light gray with an ink ring and mitered corners, and run only horizontally and vertically. Label a branch beside its wire. Draw it at the width it renders.
- The font has no arrows. Never type an arrow character: use `.link`, or draw the head.
- **Timeline** (`ol.timeline`): one `<li>` per event with its date in `.timeline-when`. Set `--fill` on an `<li>` to colour its marker; state colours only for state.
- **Steps** (`ol.steps`): a numbered list with its numbers in squares. `.steps.across` sets three to five short steps side by side.
- **Icon list** (`ul.icon-list`): each item is a glyph and its text. Use it where each line is a different kind of thing; use plain bullets otherwise.
- **Before and after** (`.compare`): two panels with a `.link` between them. Tag each panel on its top border.

## Controls

For pages that are used, not only read.

- **Tabs** (`.tabs` of `.tab` buttons): a row of joined tags; the pressed one is lit. `data-tab="name"` shows the element with `data-tab-panel="name"` in the same panel. In a `.panel-head` the tabs sit on the top border at the right. Mark the first tab `aria-pressed="true"` and give the other panels `hidden`.
- **Button** (`.button`): 28px tall, raised gray. One `.button.primary` per view: a colour fill with ink text.
- **Input** (`.input`, also on `<select>`): 28px tall, sunken. Label it with `<label class="field">`.
- **Checkbox** (`input.check`): a sunken square that holds a smaller filled square when checked. There are no round radio buttons: use tabs to pick one of several.
- Controls show a 1px white outline on keyboard focus. Never remove it.

## Slides and decks

A slide (`.slide`) is a 16:9 panel with 48px padding. It holds one title, one supporting line, and one figure.

- The figure sits in an inner `.panel`, so stats, tables, and charts all rest on the dark inset gray. No chart sits bare on a slide.
- A deck is `<main class="page deck anim">` holding only slides. `.deck` turns on stepping with the arrow keys, Page Up/Down, and Space, and one slide per printed page.
- Decks use the 960px page. The type scale is fixed, so a wider slide looks half empty.
- Number each slide with `<span class="tag slide-no">3 / 9</span>` as its first child. It sits on the top border at the right.
- Layouts:
  - **Plain**: eyebrow, title, lead, then a full-width figure. For tables, wide charts, and rows of stats.
  - **Split** (`.slide.split`): two children, a `.flow` of text and a figure panel. For a figure that would not fill the width: a pie, a short bar list, three columns.
  - **Divider** (`.slide.divider`): an eyebrow and a title alone, at the foot of the slide. Opens a section.
  - **Big number**: an eyebrow, one `.hero-number`, and a lead saying what it counts. The only text above title size; one per deck section at most.
  - **Quote** (`.slide.quote`): one `<blockquote>`.
- A slide's title states the finding, not the topic: "Flips arrived on day seven and took over", not "Income per day".

## Print

- Pages print with their dark surfaces. A deck prints one slide per page, edge to edge: open the print dialog and save as PDF.
- Animations do not run on paper; every mark prints finished.

## Motion

| Token | Value | Meaning |
| --- | --- | --- |
| `--t-fast` | 120ms | A state changes: hover, press. |
| `--t-base` | 240ms | An element enters. |
| `--t-slow` | 480ms | Data draws: bars fill, columns rise, lines trace. |
| `--t-step` | 40ms | Delay between staggered siblings. |

- Add `.anim` to a container to turn motion on. Bars, columns, lines, and pies inside it animate on their own.
- `.enter` fades an element in over an 8px rise. `.stagger` on a parent delays each child by one step. Put `.enter` on every chart panel.
- With `style.js` loaded, each panel plays when a fifth of it scrolls into view, not on page load. Its marks start together.
- A line needs `pathLength="1"` to trace. A pie slice needs `pathLength="100"`.
- Everything plays once. Nothing replays on scrolling back, loops, bounces, or moves more than 8px.
- The stylesheet already honours reduced-motion settings.

## Hover

`style.js` adds a tooltip and linked highlighting to any mark.

- `data-tip="Name"` shows a tooltip while the pointer is over the element. `data-tip-value` puts a value at the right of the name; `data-tip-note` puts a dim line under it. The tooltip shows a swatch in the mark's `--fill`.
- `data-key="name"` links elements inside one panel. Hovering one lights up all of them, such as a pie slice and its legend row.
- The tooltip is a `--sunken` box with a black border: darker than any panel, no shadow, no rounding, no arrow. It follows the pointer.
- Hovering a mark darkens its siblings. Nothing fades to transparent.
- A tooltip adds detail. Names and values the reader needs stay visible in a label or legend.
- Give pie slices and unlabelled segments a tooltip. Use `data-tip`, not `title`: the browser's own tooltip is off-style.

## Recording preferences

When the user states a visual preference or corrects how something looks, offer to record it. Edit the source repo (`joshua-light/style`), not the installed copy: change `assets/style.css` (and `assets/style.js` for behaviour) and `assets/showcase.html`, then the matching rule here. Write each rule as a concrete instruction.
