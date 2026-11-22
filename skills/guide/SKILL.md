---
name: guide
description: Joshua Light's personal visual style — dark gray surfaces, black borders, no rounding, Warrior-tan accent, flat colour fills, Expressway text with outlined headings (the ElvUI / EllesmereUI look). Every page is told as a story, one step at a time from the simplest case, with one chart form repeated, each term defined where it arrives, and one colour per recurring thing. Use before creating or restyling anything meant to be looked at — reports, explainers, animated explainers (films), dashboards, slides, charts, diagrams, HTML/SVG/image output. Also use when the user gives feedback on how something looks, so the preference gets recorded.
---

# Visual style guide

The look comes from ElvUI and EllesmereUI, the World of Warcraft interfaces: dark gray panels, one-pixel black borders, square corners, flat dark heads, a tan accent on text, flat colour fills, and Expressway text with black-outlined headings. It reads like an inked comic panel.

Apply these rules to every visual output. They cover the order and the words as well as the look: a story told one step at a time (see Story), in short sentences (see Words), with colours that keep one meaning (see Colour code). Where another design skill disagrees on palette, font, rounding, or light mode, these rules win. Use other skills for method only, such as choosing a chart form.

## Build a page

Paths are relative to this skill's directory.

1. Read `../../examples/showcase.html`. It holds the markup for every component. For any page read by people, read `../../examples/story-report.html` too: the reference story, with every step in the same form. For a deck, read `../../examples/voyager-deck.html` too: the reference deck. For an animated explainer, read `../../examples/gc-film.html` too: the reference for films.
2. Plan the page as a story (see Story): the goal, the subject, then one section per step, each with its question, its figure, and its takeaway. Give each recurring thing its colour before drawing anything (see Colour code).
3. Write the page with `<link rel="stylesheet" href="style.css">` and `<script src="style.js" defer></script>` in its head and the showcase's classes in its body. Use these plain names, though the examples link both files by their repo path: `build.py` finds either. The script drives tooltips, hover highlighting, reveal on scroll, tabs, sortable tables, steppers, quizzes, bound sliders, menus, toasts, dialogs, the contents rail, and stepping through a deck, its builds, and its popups. A page with a film also loads `film.js`, at the end of its body (see Films).
4. Run `python3 scripts/build.py page.html`. It inlines `assets/style.css`, `assets/style.js`, and `assets/film.js` where the page loads it, and embeds the fonts, so the page stands alone.
5. Run `python3 scripts/lint.py page.html`. It reads the page's own CSS, markup, and text, and names each breach of these rules by line. It counts words too: a long heading, caption, or sentence is a warning. Fix every error. A warning is a rule with exceptions: check each by eye.
6. Run `python3 scripts/shot.py page.html` and read the images it writes. A page comes as screens 1500px tall and a deck as one image per slide, every mark finished as on paper. `--select CSS` shoots one part. A film shows its last frame; `--at` holds it at another (see Films). Check them against the rules below: the linter reads the source, and only the picture shows spacing, overlap, and empty room.
7. Read it cold. Give the screenshots to a subagent that knows nothing of the work. Ask it what the page found, and which words or marks it could not decode. Each one it names is a term to define where it arrives, or a figure to simplify.

Page-specific CSS goes in a second `<style>` and uses the tokens (`var(--s4)`, `var(--panel)`), never raw values. Never silence the linter to pass. A `lint-ok: RULE` comment on a line exempts it, and is only for an exception this guide names: write the reason beside it. Where Expressway's files are absent, `build.py` sets the page in Fira Sans, the bundled fallback, and says so. That is the intended look on such a machine.

## Story

A page is read by someone who was not there when the work was done, and who holds little at once. Tell it as a story. Start from the simplest case, change one thing per section, and let each section stand on the one before. Each step then costs little to read, because the step before set it up.

This is the default for every page: a report, an explainer, a deck, a write-up of a project. `../../examples/story-report.html` is the reference: it uses every rule below. A dashboard is the one exception: it is scanned, not read, and keeps its summary at the top.

### Outline

| Part | Holds | Example |
| --- | --- | --- |
| Goal | The question the page answers, in the lead. | How well do models handle a large task, and what does it cost? |
| Subject | What is studied, shown: a picture of the real thing, a flow of boxes, what success means. | A screenshot of the cow; agent, game, cow, 43 checks. |
| Baseline | The simplest case: the obvious approach, the default, the first version. | Prompt: just ask for the cow. |
| Steps | One section per change, each adding one thing to the case before. | Detailed prompt, Plan, Tests, Harness. |
| Problem | What the steps leave open. Often the largest caveat. | Who builds the harness? |
| Current work | What is being tried now. Results not in yet stay in their figure as TBD. | Harness builder. |
| Appendix | Side stories: detail per item, methods, what did not work. | Anatomy of a session; navigation aids. |

- Order the sections by the story, from the simplest case to the most built up. Never sort them by result: the best result may come last.
- One change per step. A section that changes two things is two sections.
- Name a step for its change: "Prompt", "Detailed prompt", "Plan".
- Define a term in the section where it first matters. Never open with a glossary: the reader cannot hold terms before they mean anything.
- Show the subject before the first result: a screenshot, a model, icons, a flow of boxes. A paragraph that describes the subject is a figure not drawn yet.
- Put a caveat beside the number it qualifies. A caveat that changes the conclusion is not a footnote: it is the story's Problem.
- An appendix comes after the main line, headed "Appendix: " and its name. The main line reads whole without it.
- A deck tells the same story: one step per slide or per few slides (see Slides and decks).

### A step

Every step section has the same four parts, in this order:

1. **Question.** One or two sentences that name the change, usually "What if …?". Define any new term here.
2. **Schematic.** A `.diagram` of who does what in this step, each box led by a tile (see Explainers).
3. **Result.** The step's figure, in the same form as every other step's.
4. **Takeaway.** One bold sentence after the figure (`<p><strong>`): what the change did, against the step before.

A variation inside a step is an `h3` sub-step, such as "More iterations", with the same parts, smaller.

### One form, repeated

- Steps share one figure form: the same panels, the same measures, the same row order, the same scales. The reader learns it once and then only compares.
- Say the shared scale once, under the first figure: "Bars share one scale in every section: checks out of 43, cost up to $20."
- Keep each item in the same row everywhere, such as small model to large.
- A step with one result keeps the whole form, with one row. Do not switch it to a stat.
- A result not in yet keeps the form: a `.tag` "TBD" on each panel's border and an `.empty` frame that says what will fill it.

### Tried and dropped

- **A compressed dashboard.** Stats at the top, every dataset charted, one-word headings, three-word labels. Readers met coined terms ("spec plus verify", "solo") and a dozen chart forms, and could not follow it. Cutting words had moved the cost into decoding.
- **An answer-first briefing.** The conclusion in the lead, a glossary up front, winners before losers. Faster to scan, but the reader had to hold every term before any result meant something, and the largest caveat sat in a callout instead of driving the story.

## Words

Words carry the story between figures: a question before each figure, a takeaway after it. Every sentence costs the reader: a long one most of all.

### Show before you say

Before writing a sentence, look for the figure that holds it.

| The sentence would give | Show |
| --- | --- |
| A number that matters | A stat. |
| Several facts about one thing: a sample, a setup, a method | A key-value list. |
| A ranking or a comparison | A meter, columns, or a table. |
| A share of a whole | A stacked bar, a pie, or a waffle. |
| What happened, in order | A timeline. |
| What to do next | Steps or a status list. |
| A belief and whether it held | Claims. |
| A cause, a flow, a mechanism | A diagram. |
| A change in steps: before and after, a process | A stepper. |
| A change whose pace or path is the point: a lag, a race, a queue | A film (see Films). |
| A choice and its reason | A decision callout. |
| A caveat or a risk | A callout of one sentence. |
| Where a number came from, how it was checked | A tooltip, a margin note, or a disclosure. |

- A step's prose is its question and its takeaway (see Story). Other prose holds only what no figure can: why a finding matters, how two figures connect.
- Say a fact once. Prose never walks through the values of a figure beside it.
- Detail the reader may skip leaves the main line: a tooltip, a margin note, a `details.more`, an appendix. Never park it in a caption.
- Report what was found, not how the work went: no "I read", no "we then checked". A method is a key-value list.
- Use the reader's words. Never coin a short name to fit a length: "spec plus verify" means nothing until a section has shown it.
- A question that takes more than two sentences changes too much: split the step.

### Lengths

Names:

| Text | Most | Write | Not |
| --- | --- | --- | --- |
| Title | 4 words | What a cow costs | Week 12: eight kills, and Dimensius is next |
| Heading, panel title | 2 words, 3 at a push | Detailed prompt | Adding a spec to the prompt |
| Label, tag | 6 words, in plain words: never a coined short name | Opus low tests, Haiku medium builds | Spec+V, solo |

Sentences:

| Text | Most |
| --- | --- |
| Caption, panel foot, stat note | 1 sentence of 12 words |
| Lead | 30 words: the goal, and how the page gets there |
| Question, takeaway | 2 sentences |
| Sentence | 20 words |
| Paragraph | 40 words |
| Paragraphs in a row | 2 |

- A heading is a name: one or two words, a noun. A step's heading names its change. It has no verb, no question, and no comma, colon, or full stop. It never opens with "The", "How", "Where", "What", or "Why": "Where the damage goes" is "Damage".
- Two headings take a prefix and a colon, which say where the section sits in the story: "Problem: who builds the harness?" and "Appendix: navigation". The Problem's heading may be its question.
- The words a heading drops have their own places. A count or a unit goes in the tag on the border: "Top 6", "24 pulls". The scale goes in the caption. The question opens the section and the finding closes it.
- The title names the piece. The eyebrow holds its context: project, period, version. The lead states the goal: the question the page answers, and that it builds the answer step by step.
- A takeaway is not a caption. It is a bold sentence in the flow after the figure, and it says what changed against the step before.
- A caption says how to read the figure: its unit, its scale, what a mark stands for. It never adds a fact the figure does not show. A figure whose title and labels say it all takes no caption.
  - Write "Peak per hour, server time."
  - Not "Hour of day in server time. Most pulls come after 21:00, when the second tank logs in."
- A label names one thing. A second fact about it goes in its value, a tag, or a tooltip: "Healers" with 3 as its value, never "Healers in the raid, 3 of 20".
- A table cell is a name or a value. A column of sentences wants to be `ul.claims`.
- A sentence runs to about 12 words. One over 20 is rare and chosen: one a section at most, where splitting it would break the thought.
- A paragraph is one to three short sentences. Never run more than two paragraphs together: a third wants to be a figure.
- A callout or a list item holds one or two sentences.
- An explainer has more sentences than a report, never longer ones.
- A slide's title is the one heading that states a finding (see Slides and decks): a slide has no lead to hold it.

## Surfaces and ink

The style is dark only. Never add a light theme.

| Token | Value | Use |
| --- | --- | --- |
| `--ink` | `#000000` | Every border, every outline. The only black. |
| `--sunken` | `#212121` | Table heads (`--head`), bar tracks, code, wells. |
| `--page` | `#262626` | The page. |
| `--inset` | `#2b2b2b` | A box inside a box: nested panels, table rows. |
| `--panel` | `#333333` | Top-level boxes: panels, callouts, slides. |
| `--raised` | `#3f3f3f` | Neutral tags. |

- Every container edge is `1px solid #000`. The one other edge is dashed, for a part that is not there yet (see Lines).
- Nothing is rounded: no `border-radius`. Two shapes are round: the pie chart, and a chart's markers (see Charts). Every box, tag, swatch, and list marker stays square.
- A top-level box is light gray (`--panel`). A box inside it is dark (`--inset`): a stat, table, or chart panel on a slide, a panel in a panel. The stylesheet does this by nesting; never set it by hand, and never make a top-level panel dark.
- Depth comes from the gray steps. No soft shadows, no blur, no glow, no transparency.
- No box has a head bar. Panel titles and callout kinds sit on the top border (see On the border). Table rows are `--inset`; heads are flat `--head`, one step darker, never textured, never coloured. A hovered row turns `--panel`.
- Nothing has a gradient.

## Lines and hatching

A line's style has one meaning, and so does a hatched fill.

| Look | Meaning | Where |
| --- | --- | --- |
| Solid line | It exists, or it was measured. | Every edge and line not named below. |
| Dashed line | Not there yet: planned, projected, optional, or missing. | Borders and lines. |
| Hatched fill | Not there yet, for a mark whose fill carries a value. | Bars, columns, segments, swatches. |
| Dotted line | Hover for more. | Under a linked mark only (see Text). |

- Mark a part that is not there yet with `.ghost`. What it draws depends on the part:
  - A `.node` or `.layer`: a dashed box with no fill. A `.link`: a dashed arrow.
  - In an SVG, a `.box`, a `.wire`, or a chart `.line`: dashed. A `.dot`: hollow.
  - A `.bar-fill`, `.bar-seg`, `.col-fill`, or `.swatch`: its colour under ink hatching, with solid edges.
- A box is emptied and a fill is hatched because a fill is data: its size is the value and its colour the series. An empty column would read as a missing value.
- A hatched fill keeps solid ink edges. Never dash them: the hatch already says it, and dashes break up against the hatch lines.
- The empty state wears the dashed frame. A chart's target is dashed too (see Charts).
- A dash or a hatch never carries meaning alone. Put a word beside it: "Planned", "Forecast", "Goal 28M", or a legend entry with a `.swatch.ghost`.
- Never use a dash or a hatch to tell two series apart, to separate, to decorate, or to dim. Colour and a label tell series apart; the gray steps dim.
- Dashes are 4px with 4px gaps on a 1px edge, and 6px on a 2px line, which also carries the ink ring. Dots are 1px with 2px gaps. Hatch lines are 2px ink diagonals, 8px apart.
- Never write `border-style: dashed` or `dotted`, a dash pattern, or a hatch of your own. The stylesheet draws them all on whole pixels: the browser's dashes are 2px long, its dots read as a solid line, and a gradient hatch has lines of uneven weight.
- Charts from other tools follow the same meanings and lengths.

## Fills

Every fill is flat: one colour inside a 1px ink edge.

- This holds for data marks (bars, columns, stacked segments, pies, swatches), tags, and gray surfaces alike. Never add a gradient, a gloss, or a texture to a fill. The one texture is the hatch on a fill that is not there yet (see Lines and hatching).
- Melli, the WoW status-bar gradient, used to shade data fills. It was dropped: in a report it added a brightness change that carries no data, and a bar no longer matched its legend colour.
- A data fill is written `background: var(--texture), <colour>`. `--texture` is `none`; `.ghost` sets it to the hatch. Never set it on a page.

## Text

Expressway sets everything except code, in two cuts. Nothing is italic.

| Weight | Cut | Use |
| --- | --- | --- |
| 400 | Regular | Everything plain: prose, cells, captions, buttons and inputs, chart text. |
| 700 | Bold | Everything else. Headings, panel titles, hero numbers. Emphasis (`<strong>`) and table totals. Uppercase labels: eyebrows, tags, callout kinds, tabs, table heads. Small outlined text: stat labels, deltas, meter names and values. |

- Outlined text is never Regular: the stroke eats into thin stems.
- Nothing is Extra-bold. Headings and emphasis were once; Bold replaced it. Never set `font-weight: 800` on a page.
- Regular is licensed for desktop use only. Never convert it, embed it, or copy it into `assets/fonts/`: the stylesheet reads it from the machine's installed fonts.
- Where Regular is not installed, plain text falls back to Bold and the page looks heavier. A Bold word would vanish in Bold text, so `style.js` detects the fallback and sets `<strong>` in Extra-bold there. That is the cut's only use, and the script's alone. When a page is meant for other readers, say that they will see the Bold fallback.

- One face only. Roboto for text under Expressway headings was tried and dropped.
- Fira Sans is the fallback. It ships in `assets/fonts/` under the Open Font License and sets the whole page, in both weights, where Expressway's Bold file is absent. The two never mix: an installed Expressway Regular does not pair with Fira Sans Bold.
- Fira Sans takes Expressway's ascent and descent, so text on a border sits on the same pixel in either face. Never tune a size, a gap, or an offset for the fallback, and never name either family on a page: use `var(--font)`.
- Write for Expressway's limits even where the page shows in Fira Sans: no arrows, and the maths signs only inside maths.
- Prose is never tracked: no `letter-spacing` on body text, lists, or callouts. Extra tracking belongs only to uppercase labels and outlined text.

Each size has one meaning. Pick the size by meaning, never by looks, and never use a size off the scale. Line heights are even whole pixels, because text on a border is offset by half a line. A scale a tenth larger was tried while text was Bold and dropped once text became Regular.

| Token | Size / line | Meaning |
| --- | --- | --- |
| `--fs-title` | 40 / 48 | The name of the whole piece. Once per page or slide. |
| `--fs-heading` | 28 / 36 | Section heads and hero numbers. |
| `--fs-subheading` | 20 / 28 | Subsection heads and the lead sentence. |
| `--fs-prose` | 18 / 30 | Long prose: paragraphs and lists in the page's flow, outside any box. |
| `--fs-body` | 16 / 24 | Sentences inside a box or a column: panel text, quotes, slides. |
| `--fs-label` | 14 / 20 | Anything scanned: table cells, meter labels, legends, callouts, panel heads. |
| `--fs-note` | 12 / 16 | Captions, axis ticks, units, eyebrows, tags. |

- Headings and titles wear the black outline: title, heading, subheading, hero numbers (`.stat-value`), the titles of boxes (panel heads, stat labels), and text that sits on a border (stat deltas, meter names and values). Everything else stays plain: prose, table cells, legends, chart text.
- The outline scales with the text: 7% of the font size, between 1.25px and 2px. That gives 1.25px on small titles, 1.4px at 20px, and 2px from 28px. Nothing wears more than 2px, a slide's big number included: at 4px its outline looked heavy and filled the gaps between letters.
- Draw it as a stroke under the fill, twice the visible width (`-webkit-text-stroke: calc(2 * var(--outline)) #000` with `paint-order: stroke fill`). Never fake it with stacked `text-shadow`s: they look lumpy.
- Outlined letters must sit at least 2px apart, or the fills swallow the line between them and a letter looks half-outlined. The stylesheet's `--fit` adds that spacing to headings.
- Plain text keeps the browser's default rendering. Never set `-webkit-font-smoothing`, `text-rendering`, `paint-order`, or a text stroke (even `0px`) on it: together they made body text look soft in Chrome. Only headings and titles get the stroke.
- Never clip outlined text at the glyph edge. A box with `overflow: hidden` needs padding as wide as the outline around its text.
- Without an outline, text needs a surface it reads on. White text sits only on gray surfaces. Text on a colour fill (coloured tags, callout kinds, stacked-bar segments) is ink black. Plain text never sits on a bar: it would cross from fill to track. A meter's name and value are outlined and sit on the bar's top edge.
- Text has four colours: `--text` `#d9d9d9` for content, `--text-prose` `#bcbcbc` for long prose, `--text-dim` `#a3a3a3` for labels and captions, `--text-faint` `#888888` for markers and disabled items.
- Prose is a plain `<p>`, `<ul>`, or `<ol>` placed straight in `.page` or `.flow`. The stylesheet sets it a size above body text and a shade dimmer, so `<strong>` stands out in `--text`. Give it no class, and never set these by hand.
- Contrast is soft on purpose. Text is never pure white and no surface is darker than `--sunken`: near-white on near-black glared in the bold face. Never raise the contrast to make text stand out; use size or `<strong>`.
- Highlight the names of things inside running text with `<mark>`, as game text colours an item's name: an item, a player, a category ("Buy <mark>of Shadow Wrath</mark>"). A mark is accent-coloured, with no background and no underline. The one exception is a linked mark (`<mark data-key>`, see Explainers): it wears a dotted rule, so the reader knows the name can be hovered.
  - Mark names only. Never mark a number, a verdict, or a whole phrase, and never give a mark a state colour.
  - A name from a domain palette takes that colour: an item's name in its quality colour (see Domain palettes).
  - Mark running text only: body, leads, list items, takeaways. Titles and headings stay white.
  - A thing with a colour code (see Colour code) is marked in its code wherever its name appears: "<mark style="--fill:var(--sonnet)">Sonnet low</mark> did it for $3.49". The reader then finds it in every figure by colour.
  - Mark nothing else often: most sentences without a coded name have no mark. When highlighting starts to compete with the content, remove marks.
- Other coloured text: links and eyebrows (accent) and deltas (green up, red down). Text never wears a series colour. The exceptions are a mark in a domain colour or a colour code, a state word in terminal output (see Code), and a name in a film's sentence (see Films).
- A short form the reader may not know is `<abbr data-tip="DPS" data-tip-note="Damage per second">`. It wears the dotted rule, as a linked mark does: hover for more.
- Uppercase with extra tracking appears only at note size: eyebrows, tags, stat labels.
- Table heads are uppercase too, at 11px on a 16px line. That is the one size below the scale: a row of capitals at note size read larger than the cells under it. Nothing else uses it.
- Prose lines stop at 560px (`--measure`), about 65 characters. A list's indent sits inside that width.
- Bulleted lists use square markers at every level and nest three levels at most. Numbered lists switch to letters one level down. Numbers are `--text-dim`; bullets are `--text-faint`.
- A quote is its own box with a large outlined opening mark in the accent colour on its top border, and the source in a `<cite>` at note size. The mark is an ornament and the only glyph off the type scale. Never mark a quote with only a side rule or dim text: it does not read as a quote.
- Expressway has no arrows or triangles. Use `.delta` for up and down, and write "to".
- A value that was replaced is `<del>`: struck and faint. The value that replaced it follows in `<ins>`, set like emphasis: "<del>37</del> <ins>21</ins>". Strike nothing else: not a wrong claim, not a finished task.
- Numbers in a column use tabular digits, so they line up digit by digit. The stylesheet sets this on `.num` cells, legend values, and key-value values. Only Regular has tabular digits: Bold totals and stat values keep proportional ones.
- Only the Regular cut has `≈ ≤ ≥ ≠ √`. Use them inside maths only, never in a heading, `<strong>`, or outlined text; elsewhere write "about" or "at most".

## Numbers and dates

A number is written one way everywhere on a page.

| Kind | Write | Not | Rule |
| --- | --- | --- | --- |
| Small count | 1,284 | 1284 | Whole digits with a comma, up to 9,999. |
| Large amount | 41.8M | 41,800,000 | Three figures and K, M, or B from 10,000 up. |
| Column of amounts | 4.92M, 0.28M | 4.92M, 280K | One unit and one precision down a column. |
| Percent | 6.4% | 6.4 % | No space before the sign. One decimal at most. |
| Unit | 25.9B km | 25.9Bkm | A space before a unit that is a word. |
| Change | +6.4%, -3.1% | 6.4% | A change always shows its sign. The minus is a hyphen. |
| Change in a share | +4 pts | +4% | Points between two percentages. |
| Range | 12 to 31 | 12-31 | "to": a dash reads as a minus. |
| Ratio | 8 / 8 | 8/8 | A space each side of the slash. |
| Rough value | about 40 | ~40 | A word, outside maths. |
| Duration | 2h 14m, 4m 05s | 2:14:00 | Two units at most, the larger first. |
| Date | 15 Nov 2026 | 11/15/26 | Day, short month, year. No year inside the current one. |
| Time of day | 21:30 | 9:30 PM | The 24-hour clock. |
| Recent time | 3h ago | 180 minutes ago | For anything less than a day old. |
| Date in data | 2026-11-15 | 15.11.2026 | Year first, in code and file names only. |
| No value | a faint dash | 0, blank, N/A | `<span class="faint">–</span>`. Zero is a value: write 0. |

## On the border

Titles and key values sit across a box's top border, not inside it. They look laid on top of the frame.

- A panel's title is 20px bold, 12px in from the left, centred on the top border. There is no head bar.
- A tag may sit on the same border at the right.
- A callout names its kind in a coloured tag at the top left: the kind's glyph, then its name. The tag sets it apart from a panel.
- A stat wears its label at the top left and its delta or tag at the top right.
- A meter bar wears its name at the top left and its value at the top right.
- Only the top border carries text. Never hang text off the bottom or the sides.
- Text on a border is always outlined, so it reads over both surfaces. A tag is a solid chip and needs none.
- Centre it with an offset of half the line height, in whole pixels. Never use a transform: it lands on half pixels and blurs the text.
- A box with text on its border needs 24px of clear space above it. The stylesheet keeps that gap inside a panel or callout body too.

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
- A plain list sits 8px under the paragraph that introduces it, the same gap as between its items. A full block gap cut the list off from its lead-in.
- `.page` is 960px wide; `.page.wide` is 1200px for dashboards.
- Grid columns sit 16px apart and rows 24px apart: titles on a top border need the room.
- No panel shows empty space. Panels in a grid row share a height, and the content takes the spare room: table rows stretch, a sparkline grows, a chart row centres. Pick spans so the content also fills the width; a `.legend.list` takes what a pie leaves.
- When one panel is much taller than its neighbour, give it `.rows-2` and stack two short panels beside it.
- `.grid` has 12 columns. Children span 12 unless given `.span-3`, `-4`, `-6`, `-8`, or `-9`. Below 760px, spans collapse.
- Fixed heights: 28px for table heads; 16px for a bar or a slider; 20px for a meter bar, and for a slider in a meter row; 8px for a thin bar; 24px for a stacked bar; 20px for a tag.

## Colour

The accent is `--accent` `#bb966e`: the Warrior class colour (`#c69b6d`), softened like the data colours. It dresses text only: links and eyebrows.

- Charts never use the accent. No bar, column, line, swatch, or tag is filled with `--accent`, and no series colour is defined from it. Changing the accent must not recolour any data.
- The accent is not a replacement for other colours. States keep their usual colours: green for good, red for bad. A gain, a kill, or a tip is green, never the accent.

Data and state colours are three metals and six enamels:

| Token | Value | Use |
| --- | --- | --- |
| `--azure` | `#528ebf` | Series. Also neutral notes. A mid blue: the first, lighter azure read too bright on note tags. |
| `--gold` | `#c3ad48` | Series. |
| `--amethyst` | `#9466ba` | Series. |
| `--copper` | `#ce7b47` | Series. |
| `--silver` | `#bec1c6` | Series. |
| `--rose` | `#d28aac` | Series. |
| `--green` | `#7fb64d` | Positive state. Never a series. A warm green that leans yellow: never teal, mint, or blue-green. |
| `--yellow` | `#eddc59` | Warning, needs attention. Never a series. Never orange. |
| `--red` | `#d64c3b` | Negative state, danger. Never a series. A warm red that leans yellow: never crimson or pink. |

State tokens: `--good` green, `--warn` yellow, `--bad` red, `--info` azure.

Series colours, assigned in this order: `--c1` azure, `--c2` gold, `--c3` amethyst, `--c4` copper, `--c5` silver, `--c6` rose. `--c-other` `#7a7a7a` holds everything past six. A mark with no `--fill` takes `--c1`.

### Domain palettes

Where a subject has colours its readers already know, those stand in for the series colours.

- Two ship with the stylesheet. Class colours: `--class-death-knight`, `-demon-hunter`, `-druid`, `-evoker`, `-hunter`, `-mage`, `-monk`, `-paladin`, `-priest`, `-rogue`, `-shaman`, `-warlock`, `-warrior`. Item quality: `--quality-poor`, `-common`, `-uncommon`, `-rare`, `-epic`, `-legendary`, `-artifact`, `-heirloom`.
- A player's mark takes the class colour: `style="--fill: var(--class-mage)"`. An item's name takes its quality colour: `<mark style="--fill: var(--quality-epic)">`.
- Use a domain palette only for the thing it names. Bosses, nights, and schools keep the series colours.
- A domain colour is not a state. Hunter green is not "good" and Death Knight red is not "bad": state still needs its own tag or word.
- Name the class or quality in a label, a legend, or a tooltip. The colour alone is not enough.
- A new domain palette is softened like every colour here.

### Colour code

Colour is the page's highlighter. Before drawing, give each kind of thing the page keeps returning to a colour, and keep it wherever that thing appears.

| Coded thing | Colour | Where it shows |
| --- | --- | --- |
| Haiku | `--c1` azure | Its bars, its robot tile, its tab swatch, its name in a sentence. |
| Sonnet | `--c2` gold | The same. |
| Opus | `--c3` amethyst | The same. |
| Testing: tests, verify, the harness | `--c4` copper | Its tiles, its timeline spans, the word in a sentence. |
| A baseline to compare with | `--c-other` | The "no aid" row, the "alone" bar. |

- Name the codes as page tokens, so a change is one line: `:root { --haiku: var(--c1); --check: var(--c4); }`.
- One meaning per hue on a page. A hue that codes a model never also codes an activity.
- Show the key before the first coded figure: a panel named "Colours" holding a `.legend`. Say what each colour means, not only its name: "Opus: largest, priciest".
- A row made by two things takes the colour of the one that made the result, and the figure says so: "Two-model rows take the colour of the model that built the cow."
- Six series colours are the budget. Where a page needs more codes, merge kinds (three activities, not six), or leave the rarer ones gray. Never add a hue.
- State colours stay state. Green and red never code a thing.
- Decoration takes no code. A tile that only dresses a list item may wear any series colour, but where the page has codes, keep tiles neutral unless they carry one.

- Every colour here is a pure hue mixed 12% toward mid gray (`#707070`, in OKLab), so fills sit with the softened text. Soften a new colour by the same share; never paste in a pure hue.
- Never add an amber, lime, or second yellow. None separates from gold, least of all for colour-blind readers. `--yellow` separates only because it is much lighter: never darken it.
- Set a fill with `style="--fill: var(--c2)"`.
- A colour follows its entity across every chart on the page, whatever its rank.
- To keep the reader on one series, mute the others: set them to `--c-other`, draw them first, and leave their labels dim. The series the chart is about keeps its colour and a `.series` label. Mute all the others or none, and still label each.
- A chart with one series uses one colour: that series' code, where it has one. A chart whose rows are coded things colours each row by its code.
- Status colours mark state only, and always sit next to a word.
- Colour never carries identity alone: label the mark or add a `.legend`.

## Components

Markup for each is in `../../examples/showcase.html`.

- **Panel** (`.panel`): an optional `.panel-head` title on the top border, body padded 16px. A `.tag` inside the head lands on the border at the right. `.panel-foot` is a strip under the body for the figure's controls or its one-line takeaway. `.panel-body.flush` lets a table run edge to edge; under a title, the strip between the panel's top border and the table head is `--head` too, and the table head keeps a black line above and below it.
- **Callout** (`.callout.note|tip|warn|bad`): the kind's glyph and name in a tag of the kind's colour, on the top border at the left. Each kind has one glyph: note `information`, tip `lightbulb`, warn `alert`, bad `skull-2`. Put it first in the `.callout-head`, before the word. A callout with a name of its own ("Theorem") takes a glyph that fits the name, or none. Keep to one or two per screen.
- **Stat** (`.panel.stat`): note-size label on the top border at the left, `.stat-foot` with one `.delta` or `.tag` on the same border at the right, heading-size value inside, then an optional `.stat-note` caption at the bottom left saying what the delta compares against ("vs last week"), thin bar, or sparkline. A delta never appears without its comparison.
- **Bar** (`.bar`): the signature mark, a flat colour fill in a sunken track. It carries no plain text. `.bar.thin` is the small one. `.bar.stack` splits one bar into `.bar-seg` parts, which may hold an ink label.
- **Meter** (`.meter`): a ranked list of `.meter-row`s, each a label, a bar, and a value. The name sits on the bar's top edge at the left and the value on the same edge at the right, as a unit frame names a health bar. This is the horizontal bar chart.
- **Table** (`.table`): 11px bold uppercase heads, label-size cells, numbers right-aligned with `.num`, in tabular digits.
- **Pie** (`.pie`): an SVG of `.pie-slice` circles and `.pie-cut` lines. Each slice sets `--v`, its share in percent, and `--at`, the sum of the shares before it. No arc geometry is needed.
- **Tag** (`.tag`): a short state word, in bold.
- **State** (`.state.good|warn|bad|info`): a 12px square in the state's colour and a word. Use it in a table cell or a line where a tag would shout: a yes or no cell, a row's status. Without a kind it is gray.
- **Icon**: see Icons below.
- **Table extras**: `<tfoot>` holds totals, as dark as the head and bold. A `<th colspan>` row inside a `<tbody>` heads a group; give each group its own `<tbody>`. `class="sortable"` sorts on a click of a head; mark the starting column with `aria-sort`.
- **Key-value list** (`dl.kv`): label and value pairs, ruled, values at the right. For a handful of facts about one thing.
- **Empty state** (`.empty`): one dim centred line, with an optional glyph, inside a dashed frame, in a panel that has nothing to show. Say what would fill it.
- **Figure frame** (`figure.frame`): an image, SVG, or video in a 1px ink frame, caption below. A light picture, such as a screenshot of a light interface, takes `figure.frame.mat`: a sunken mat keeps its white off the page gray. Never dim or invert the picture.
- **Slide**: see Slides and decks below.

## Maths

Maths is not code: it takes the text face and no chip.

- Inline maths is `<code class="math">`. It never wraps.
- Exponents and indices are real `<sup>` and `<sub>`. Never type `^` or `_`.
- A formula on its own line is `<p class="formula" role="math" aria-label="…">`, at heading size in a `--sunken` box. Each term is a `<span>`. Say the formula in words in the `aria-label`.
- A fraction in an exponent is stacked: `<sup class="frac">` holding one `<span>` for the numerator and one for the denominator. Never write nested exponents on one line with a slash: three levels ran together.
- A sign the text face lacks falls back to the monospace face.

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

- Never add a colour outside this table: no green, azure, amethyst, or rose in code. A diff and a terminal are the exceptions below: there the colour marks a state.
- Code has one weight and no italics, comments included.
- Never write token colours into a page. The stylesheet owns them through the `--code-*` tokens.
- Keep lines under 60 characters where the block sits in half a page, so nothing scrolls sideways.
- A key is `<kbd>`: a raised gray chip, where code is sunken. "Press <kbd>Ctrl</kbd> <kbd>K</kbd>."
- A block may wear its file's name: wrap the `<pre>` in `.code` and lead with a `.code-head`, a neutral chip on the top border.
- Lines: `highlight.py --number` numbers a block and `--hl 5,7-9` lights lines. Both put each line in a `span.line` that ends in its own newline. Never write a newline between two such spans: it shows as an empty line.
- A diff is `pre.diff`, from `highlight.py diff FILE`. An added line is a flat dark tone of green and a removed line of red, and a sign in the gutter says which. A diff has no token colours.
- Terminal output is `pre.term`. A `span.prompt` and a `span.cmd` mark what was typed; what came back stays dim. A state word (PASS, FAIL, SKIP) may be `.good`, `.warn`, or `.bad`. Colour nothing else.
- A file tree is `ul.files`, nested, in the code face behind ink rules. A folder is `span.dir` and ends in a slash; a `<small>` beside a name holds a note.

## Icons

- **Glyph** (`.glyph`): a symbol, such as a sword for "flips" or a clock for "time". Glyphs come only from Remix Icon's fill set, which ships in `assets/icons/remix-fill.json`.
  - Get the markup with `python3 scripts/icon.py NAME`; look a name up with `python3 scripts/icon.py --find WORD`. Paste the output into the page. Never draw a glyph by hand or fetch one from another set.
  - A glyph has no background. This is the default for every icon.
  - A glyph takes the colour of the text it is attached to: accent beside an eyebrow, white beside a value, dim beside a caption. Never give a glyph a colour of its own.
  - A glyph is as tall as one line of that text: 16px beside a note, 24px beside body text, 36px beside a hero number. The stylesheet sizes it; never set a size by hand.
  - A glyph is outlined only where its text is. Beside a heading, a hero number, or a box title it wears the same black outline. Beside plain text it is plain: an eyebrow, body text, a caption, a list item. An outlined glyph beside a plain label looked heavier than the label. The stylesheet decides; never add or remove the outline by hand.
  - In a callout's tag the glyph is ink on a solid chip, 16px, 4px from the word.
  - Never use line icons, pixel icons, emoji, or a second icon set: thin strokes cannot carry the outline.
- Attach a glyph to its text with `<span class="with-icon">GLYPH<span>Label</span></span>`, 8px apart. `.with-icon` also works as a class on the text's own element, such as `<p class="eyebrow with-icon">`.
- An icon never carries meaning alone: pair it with a word.
- **Tile** (`.icon` holding a glyph): the glyph in a bordered 24px square, from `icon.py --tile NAME`, dark or with `--fill c1` on a colour. The exception: use it only where the icon must stand as a mark of its own, such as beside a meter bar. A tile on a colour follows the colour rules.
- **Picture icon** (`.icon` holding an image): real art, such as a game item: `<span class="icon"><img src="…" alt=""></span>`. 24px, with a black border; the image is zoomed 20% and cropped to trim the frame game icons carry.
- Beside a meter bar: put a tile or picture icon first in the `.meter-row`. It stands left of the bar, centred on it, 4px away, and the name stays over the bar.

## Charts

- Ranked values: a `.meter`.
- Values over a few categories: `.cols`. Label each column directly; there is no y-axis. `--max` sets the scale.
- Parts of each column: stack several `.col-fill` in one `.col`, top part first, one colour per series, with a legend.
- Two series per category: put the fills side by side in `.col-bars`. Two series at most; values go in tooltips.
- A marker is a circle: `<circle class="dot" r="4">`, 8px across with an ink edge. It marks the end of a line, each mark of a scatter, and a point the chart names. Never draw a square marker: squares were used first and dropped.
- Two numbers per mark: a scatter. An SVG `.chart` with one `.dot` per mark, ticks on both axes, and each axis named on the chart. One colour. Name only the marks the text is about, with a `.series` label, and give every dot a tooltip.
- How values spread: `.cols.hist`. The bins touch, because the scale under them is continuous, and each label marks where its bin starts. Say the bin's width in the caption.
- Lowest to highest: `.bar.range` in a `.meter`. The fill runs from `--from` to `--v`; a `.bar-mark` stands at the middle value. The value reads "2m to 4m". Say in the caption what the scale and the tick are.
- Gains and losses across categories: `.cols.signed`. `--v` on each `.col` is the size of the value and `.neg` hangs it under the zero line; `--max` and `--min` set the scale. Gains are green, losses red, and each column shows its signed value.
- More than six series over time: `.multiples`. Each series is a `figure.multiple` with its name, its last value, and a `.spark`. One colour and one scale: every spark shares a `viewBox`. Say the scale in the caption. `--cols` sets the columns.
- A gain or a loss in two dimensions: `.heat.diverge`. A cell with `.neg` is a loss, and `--v` is the size of either. Two hues around a sunken zero, with a `.heat-scale.diverge` key from the lowest value to the highest.
- A point the chart names, such as a peak: a `.dot` on it and a `.series` label beside it. Where the label cannot sit beside the point, join the two with a `<line class="leader">`.
- A gap in the data: stop the line, and bridge the gap with a `.line.ghost` in the same colour. Say "No data" beside the bridge. Never draw a solid line across a gap.
- A value against a goal: add `<span class="bar-mark" style="--at:80">` inside the `.bar`. It is a white tick with an ink ring. Say what it marks in a caption or legend.
- A goal or an average across an SVG chart: `<line class="target">`, a 1px gray dashed rule. It is not data: no series colour, no ink ring. Label it on the chart.
- A forecast: continue the line with a second `<path class="line ghost">` in the same colour, from the last measured point. Give it no `pathLength`: it fades in once the solid line has traced. Label it "Forecast" on the chart. End it in a hollow marker: `<circle class="dot ghost" r="3">`, 6px across, where a filled marker is 8px.
- A forecast column, or a segment not reached yet: add `.ghost` to the `.col-fill` or `.bar-seg`. A hatched segment holds no label: ink text does not read on the hatch.
- Where a bar is heading: put a `.bar-fill.ghost` with its own `--v` before the measured `.bar-fill`. The measured fill covers its start, so only the stretch still to come is hatched.
- A moment on a chart, such as a patch or a roster change: `<line class="event">`, a solid 1px gray rule down the plot. It happened, so it is not dashed.
- A period, such as a break or a weekend: `<rect class="band">`, the full height of the plot, in `--sunken`. Draw it first. Label events and bands at the top of the plot.
- A range, such as best to worst or a margin of error: a closed `<path class="range">` under the line, with the line's `--fill`. It is a flat dark tone of that colour, never transparent. One range per chart, and say on the chart what it spans.
- Gains and losses: `.bar.diverge`. The fill grows right from the middle for a gain and left (`.bar-fill.neg`) for a loss; `--v` is a share of one half. Gains are green, losses red, and the signed value sits beside each bar.
- Two dimensions, such as day by hour: `.heat`. Each `.heat-cell` takes `--v` from 0 to 100. One hue only, set with `--fill`; never a rainbow. Put a `.heat-scale` key under it, and give every cell a tooltip.
- Parts of a whole: `.bar.stack` with a legend, or a `.pie`.
- Spans in time, such as what an agent did minute by minute: `.bar.spans`. Each `.bar-fill` sets `--at`, its start, and `--v`, its length, both in percent of the bar; a gap is time with nothing in it. Put a `.bar-scale` under it, and draw every bar of a set on one scale, the longest. A `.bar.stack` cannot do this: its parts always fill the bar.
- A share the reader should count, such as "37 in 100": a `.waffle`. It is one element: ten squares to a row, the first `--v` filled. `--rows: 2` shows a share of 20. One colour, set with `--fill`; name the share in a `.legend.list` beside it.
- A pie holds five slices at most, starts at 12 o'clock, and runs clockwise from the largest slice, with "other" last. Every boundary gets a black cut line. Names and values go in a `.legend.list` beside it, never on the slices. No donuts, no exploded slices, no 3D.
- A single trend where the amount matters: add an `.area` under the line. One series only: areas hide each other.
- Change over time: an inline SVG `.chart`. Lines are 2px with mitered joins and a black ring; markers are 8px circles; gridlines are `--sunken`; the baseline is ink. Label each line at its end and keep the legend.
- The ring round a line or a hollow marker is a second copy of it in ink, 2px wider, which `style.js` lays under it: a real stroke, smooth at any slope. Never draw that ring with a filter or a shadow on a page: it steps along a diagonal. A page whose script has not run shows the stylesheet's filter ring, the look this replaced.
- A sloped line looks stepped on a screen of one device pixel per px. That is the screen, not the style. Heavier lines and rings were tried and looked no smoother; stepped lines, flat runs and risers only, were tried and dropped. Do not try to fix it again.
- A trend inside a stat: `.spark`.
- An SVG chart scales as a whole, text included. Draw its `viewBox` at the width it will render.
- For matplotlib, use the ready theme: `plt.style.use("assets/style.mplstyle")`, then `from mpl_style import finish` (in `scripts/`) and call `finish(fig)` before saving. It adds the ink ring on lines and the outlined title.
- For plotly and Mermaid, use the ready themes (see Outside the page).
- Charts from other tools follow the same tokens: `--panel` background, 1px black edges on every mark, round markers, mitered joins, flat fills, plain Expressway labels with the outline on the title only (font files are in `assets/fonts/`).

## Explainers

- **Diagram** (`.diagram`): a chain of `.node` boxes joined by `.link` arrows. `.diagram.down` runs top to bottom. A node holds a `<strong>` name and an optional `<span>` note. `.node.ghost` is a part not there yet, with `.link.ghost` as the arrow into it; say "Planned" or "Optional" in its note.
  - A step's schematic is a diagram of three to five nodes: who does what, in order. "Opus low, writes the harness", "Harness, spec + checks + verify", "Sonnet high, builds with it", "Cow, scored by 43 checks".
  - **Tiled node** (`.node.tiled`): a tile, then a `<div>` holding the `<strong>` and the `<span>`. The tile says what kind of thing the box is, in its colour code: a `robot-2` tile in the model's colour, a copper `checkbox-multiple` tile for a test, a neutral `file-text` tile for a document, a picture icon of the subject itself. Use tiles in every node of a diagram, or in none.
- A diagram that branches or loops is an inline SVG `.chart` with `.box` rectangles, `.wire` paths, and `.arrow` heads. Wires are 2px light gray with an ink ring and mitered corners, and run only horizontally and vertically. Label a branch beside its wire. Draw it at the width it renders. Make each box at least 12px wider than its label on both sides: measure the label, never guess.
- Four more diagram forms use the same SVG parts:
  - **Zones**: `<rect class="zone">` groups boxes. It is a sunken well, drawn first, with its name in a `text.zone-name` on its top border.
  - **Sequence**: a `.box` per actor, a `<line class="life">` under each, and a `.wire` per message, top to bottom in time. A reply is a solid wire back. Never dash it: a dash says it has not happened.
  - **States**: boxes joined by wires, each wire named for what causes it. `<rect class="start">`, a small filled square, marks where it begins. A state that ends it holds a second box, 4px inside the first.
  - **Lanes**: one zone per actor, stacked 16px apart, each named on its top border. A box sits in the lane of who does it.
- The font has no arrows. Never type an arrow character: use `.link`, or draw the head.
- **Timeline** (`ol.timeline`): one `<li>` per event with its date in `.timeline-when`. Set `--fill` on an `<li>` to colour its marker; state colours only for state.
- **Steps** (`ol.steps`): a numbered list with its numbers in coloured squares, in ink bold. Each step takes the next series colour, which marks the steps as distinct and lets text point back at one. Six steps at most; `--fill` on a step overrides its colour, and on the list gives every step one colour.
- **Step reference** (`<span class="step-ref" data-step="2">2</span>`): the step's square inline, in the same colour. Use it to cite a step, a stepper's state, or a pin in a sentence. Never cite one by colour name, and never use the chip for anything else. `.steps.across` sets three to five short steps side by side.
- **Icon list** (`ul.icon-list`): each item is a glyph and its text. Use it where each line is a different kind of thing; use plain bullets otherwise.
- **Before and after** (`.compare`): two panels with a `.link` between them. Tag each panel on its top border.
- **Tree** (`.tree`): a parent `.node` over its `.tree-kids`, joined by a bus. Use it for what belongs to what: a hierarchy, a family of problems.
  - The wires are 2px ink rules with no arrowheads, as in a timeline. A tree is not a flow; for a flow use `.diagram` or an SVG.
  - A child may be a `.tree` itself. `--span` on a child gives it more columns; give a subtree as many as it has leaves.
  - On a phone it becomes an indented outline.
- **Layers** (`.layers`): `.layer` blocks stacked so each row rests on the row below. Use it for what depends on what, or for a stack such as network layers.
  - `--cols` on the stack and `--span` on a block set the widths. Rows fill left to right, top to bottom.
  - `.base` is a slab others stand on. `.fallen` marks a block knocked out, and every block that stood on it. Say the state in a `.tag` inside the block too; the gray alone is not enough.
  - `.ghost` marks a block not built yet. A fallen block was there; a ghost never was.
- **Stepper** (`.stepper` on a panel or figure): a figure that moves through numbered states. Use it when the explanation is a change: before and after, a process, a value growing.
  - Tabs in the head go to a state: `<button class="tab" data-go="2">`. Buttons with `data-go="prev"` and `data-go="next"` step; put them in the `.panel-foot`. A `.tag.step-count` reads "2 / 4".
  - `data-on="2 3"` shows a part on those states. `data-vis` does the same but keeps the part's room, so the figure does not jump.
  - Give every part of a later state the `hidden` attribute, so the page is right before the script runs.
  - The pressed tab takes its state's step colour. Cite a state with `.step-ref`, as you would a step. Six states at most.
  - A `.slider` with `data-go` inside the stepper scrubs through the states.
  - A stepper swaps one fixed state for the next. Where the way one state becomes the next is the explanation, use a film (see Films).
- **Pins** (`.pins`): numbered squares on a picture, each tied to a note. Wrap the image, SVG, or code in `.pins` and add `<span class="step-ref pin" data-step="1" style="--x:12; --y:50">1</span>` for each; `--x` and `--y` place the pin's centre in percent of the picture. Write the notes as an `ol.steps` beside or below, so each pin matches its note by number and colour. Six pins at most.
- **Quiz** (`.callout.quiz`): a callout that asks. Its glyph is `question`; name it by what it asks for ("Check", "Predict", "Sort").
  - Put the question in a `<p>`, then `.options` holding `.button`s, one with `data-correct`, then a hidden `.feedback` holding an empty `<p class="verdict">` and the explanation.
  - A click turns the right option green and a wrong pick red, and the script writes the result into `.verdict` in words. Never drop the verdict line: colour must not carry the result alone.
  - For a question answered in the head, replace `.options` with one `<button class="button" data-reveal>`.
  - For several short questions, give each its own `.quiz-item` with its own options and feedback.
  - `data-check="id"` on the quiz opens gates once it is answered: `[data-gate="id"]` shows, `[data-gate-hide]` hides, `[data-gate-enable]` unlocks a control, `[data-gate-press]` is clicked. Use a gate to make the reader predict before a figure reveals the answer.
  - Ask before the reveal, not after. One quiz per section at most.
- **Disclosure** (`details.more`): optional depth, closed by default, with the question it answers in its `<summary>`. Use it for a formal statement, a derivation, or a side question, so the main line stays short. Never hide a step the argument needs. A table in it runs edge to edge. It prints open.
- **Claims** (`ul.claims`): one `<li>` per statement: the claim in `<strong>`, its verdict in a `.tag`, the reason in a `<p>`. Use it for myths and facts, or to recap what follows and what does not. The verdict is a word in a state colour: "True" green, "False" red, "Partly" yellow.
- **Transcript** (`.chat`): one `.callout` per message, with the speaker's name in its `.callout-head`. The reader's own messages take `.me`: they stand at the right under a neutral tag. Give each other speaker a series colour with `--fill`, and keep it across the page.
- **For and against** (`ul.pros`, `ul.cons`): each in a panel named on its border. The stylesheet draws the plus and the minus; never type them.
- **Options** (a `.table` with one column per option): give the chosen column's cells `.pick` and put a `.tag.good` in its head. A yes, no, or partly cell is a `.state`.
- **Status list** (`ul.claims` again): the task in `<strong>`, its state in the tag, a note in the `<p>`. "Done" green, "Doing" azure, "Blocked" red, "Planned" neutral.
- **Board**: one panel per column, named on its border with its count in a tag, and a `.node` per card. A card not started is `.node.ghost`.
- **Decision**: a `.callout.tip` named "Decision", glyph `checkbox-circle`. The decision in `<strong>`, then the reason.
- **Margin note** (`aside.margin`): a note, a source, or a small figure in the room the prose measure leaves at the right of the page. Write it as a child of `.page`, before the paragraph it belongs to. Prose flows past it; anything wider than the measure starts below it. It holds what a reader may skip: never a step of the argument. On a phone it sits above its paragraph.
- **Linked prose** (`data-link` on a section or box): inside it, a `<mark data-key="tank">` in a sentence and the part of the figure with `data-key="tank"` light up together, and the other keyed parts darken. Use it where the text names parts of a figure. Key any part: a `.node`, a `.layer`, a pin, an SVG shape, a bar.
- **Contents rail** (`nav.rail`): for a page of five or more sections. Write it as a child of `.page`, after the lead: a `.bar.thin` and an `<ol>` of links to section ids.
  - On a window 1400px wide or more it is fixed left of the page; the script lights the section being read and fills the bar with the share scrolled.
  - On a narrower window it is a plain contents list in the flow.
  - It does not fit `.page.wide`: there it always stays in the flow.

## Data states

A panel says what state its data is in, in a word.

- **Loading**: an `.empty` frame with a glyph (`hourglass`), a word, and a thin bar. The data is not there yet, so the frame is dashed.
  - Length known: a plain `.bar.thin` with `--v`, and the count in the words: "Loading 5 of 8 logs".
  - Length unknown: `.bar.thin.busy`. A short fill crosses the track at a steady pace, on a loop.
- **Failed**: a `.tag.bad` on the panel's top border, and an `.empty` that says what failed (glyph `error-warning`) and offers a `.button` to try again.
- **Stale**: the data shows as it is. A `.tag.warn` "Stale" sits on the border, and the `.panel-foot` gives its age and the next refresh. Never dim stale data.
- **Partial**: a neutral tag on the border and the reason in the `.panel-foot`. The part still to come is a `.ghost` fill stacked over the measured one.
- **Empty**: see Empty state.

## Controls

For pages that are used, not only read.

- **Tabs** (`.tabs` of `.tab` buttons): a row of joined tags; the pressed one is lit. A `disabled` tab is faint. A tab for a coded thing leads with a `.swatch` in its code. Use tabs for one view per item, such as one panel per model, when the items share a form and the reader compares them one at a time. `data-tab="name"` shows the element with `data-tab-panel="name"` in the same panel. In a `.panel-head` the tabs sit on the top border at the right. Mark the first tab `aria-pressed="true"` and give the other panels `hidden`.
- **Button** (`.button`): 28px tall, raised gray. One `.button.primary` per view: a colour fill with ink text.
- **Input** (`.input`, also on `<select>`): 28px tall, sunken. Label it with `<label class="field">`.
- **Slider** (`input.slider`, a range input): a status bar the reader drags, with a flat fill up to a square handle. Label it with `.field`, or put it in a `label.meter-row` with a `.meter-label` and an `<output class="meter-value">`, where it wears its name and value on its top edge.
  - `data-bind="--healers"` writes the value to that custom property on the slider's panel, and into every `[data-show="--healers"]`. Marks read it: `style="--v: calc(var(--healers) * 20)"`. This makes a figure the reader can explore, with no page script.
  - Set the starting value on the panel too (`style="--healers:3"`), so the figure is right before the script runs.
  - `data-bind-to="#id"` binds to another element instead of the panel.
- **Textarea** (`textarea.input`): long text. It fills its field's width and resizes downward.
- **Wrong value**: `aria-invalid="true"` on the `.input` draws a red bar inside its left edge; the edge stays black. Under it, a `.field-note` says what is wrong, led by a `.tag.bad`. A plain `.field-note` is a hint. A `disabled` input is faint.
- **Toggle** (`input.toggle`, a checkbox): a two-stop slider. The handle sits at the left for off and at the right for on, where the track fills. Label it with `.with-icon`.
- **Toolbar** (`.toolbar`): a strip of filters between a panel's title and its table, as dark as the table head. `.push` sends what follows it to the right.
- **Pages of rows**: `.tabs` in the `.panel-foot`, the current page marked `aria-current="page"`, beside "Rows 1 to 20 of 184".
- **Menu** (`details.menu`): a `.button` summary over a `.menu-list` of `.menu-item` buttons; an `<hr>` parts groups. The list is sunken, as a tooltip is. It shuts on a pick and on a click outside.
- **Dialog** (`<dialog class="panel" id="…">`): a panel with its title on the border and its buttons in the `.panel-foot`. A button with `data-open="#id"` opens it; `data-close` inside it shuts it, as does a click on the page behind. The page goes dark behind it, by the share a deck's other slides do. No shadow.
- **Toast**: a button with `data-toast="id"` shows the callout inside `<template id="id">` at the window's bottom right, for four seconds or until clicked. It reports what just happened; never put a choice in it.
- **Checkbox** (`input.check`): a sunken square that holds a smaller filled square when checked. There are no round radio buttons: use tabs to pick one of several.
- Controls show a 1px white outline on keyboard focus. Never remove it.
- Scrollbars and selected text are styled by the stylesheet: a sunken track with a raised square thumb, and ink on light gray. Never restyle them on a page.

## Slides and decks

A slide (`.slide`) is a 16:9 panel with 48px padding. It holds one title, one supporting line, and one figure.

A deck tells its story the way a page does (see Story): the goal, the subject, then the steps, from the simplest case up. A deck shows one thing at a time. The viewer never meets a full slide: each piece of information arrives on its own click, and it arrives by growing, the way a progress bar fills. `../../examples/voyager-deck.html` is the reference deck. Read it before writing one: it uses every rule below.

### Slides

- The figure sits in an inner `.panel`, so stats, tables, and charts all rest on the dark inset gray. No chart sits bare on a slide.
- A deck is `<main class="page deck anim">` holding only slides. `.deck` turns on stepping with the arrow keys, Page Up/Down, Space, and a click, and one slide per printed page.
- The slide nearest the middle of the window is the current one. The others go dark, as a hovered mark darkens its siblings. A click on a dark slide goes to it.
- Decks use the 960px page. The type scale is fixed, so a wider slide looks half empty.
- Number each slide with `<span class="tag slide-no">3 / 9</span>` as its first child. It sits on the top border at the right.
- Layouts:
  - **Plain**: eyebrow, title, lead, then a full-width figure. For tables, wide charts, and rows of stats.
  - **Split** (`.slide.split`): two children, a `.flow` of text and a figure panel. For a figure that would not fill the width: a pie, a short bar list, three columns.
  - **Divider** (`.slide.divider`): an eyebrow and a title alone, at the foot of the slide. Opens a section.
  - **Big number**: an eyebrow, one `.hero-number`, and a lead saying what it counts. The only text above title size; one per deck section at most.
  - **Quote** (`.slide.quote`): one `<blockquote>`.
- A slide's title states the finding, not the topic: "Flips arrived on day seven and took over", not "Income per day".

### Builds

Every slide in a deck builds: each piece of information arrives on its own click, so the viewer is never handed a full slide at once.

- Mark each piece with `data-build`. Pieces arrive in the order written. Forward builds the next piece, then moves to the next slide; back takes the last piece away.
- The eyebrow and title carry no `data-build`: they show when the slide does. Everything after them is a piece: the lead, then each stat, row, event, node, or series of the figure.
- One click, one idea. `data-build="with"` brings a part in with the piece before it: a value with its label, a node with the arrow into it.
- A box that holds pieces is a piece too. It arrives with its first one, so no box shows empty.
- A number sets the order where it differs from the order written: `data-build="2"`. Number every piece on a slide, or none. Use it to bring a lead in after its figure, or a line in before the rules drawn under it.
- In an SVG chart, wrap each piece in a `<g data-build>`: a line with its end marker and label, an event with its label.
- A piece keeps its room while hidden, so the slide never jumps.
- A divider does not build. On a big number, the number is the first piece. On a quote, the source is the only one.
- Without `style.js`, every piece shows.

### Growth

Nothing on a slide just appears. Every part of a piece grows in, the way a progress bar fills.

- A framed box widens from its left edge with its frame whole: a panel, a stat, a node. Its right border travels with it. In a piece with no frame, each framed part widens on its own: a bar's track, a swatch, a tag.
- What a box holds arrives over the same time: its text is written and its value counts while the frame widens, so all three land together.
- Text is written, a character at a time at a steady pace: a lead, a big number, a label, a caption. The text itself gains characters.
- A value counts up from zero, the way a meter ticks: a stat's value, a meter's, a column's. Only its first number counts. Its unit, sign, and any second number stand still: "25.9B km" climbs from "0.0B km".
- A rule grows from its start: the underline of a ruled row, the rule that joins two timeline events, an event rule in a chart. A timeline marker fills like a small bar once the rule reaches it.
- A data mark draws as it always does: a bar fills, a line traces. A dashed forecast line grows from the measured one.
- An arrow, a glyph, and any other shape grow from the left edge.
- A piece taken away and built again grows again: a line retraces, a bar refills.
- A growing part never moves, scales, or fades in, so its text stays on whole pixels.
- Rows that arrive one by one take no `.stagger`.
- `style.js` and the stylesheet pick the growth from the part. Never write an entrance animation on a page. When a new component has a part that pops in, give that part a growth there.

Three earlier versions were tried and dropped. Do not bring them back:

- A veil sliding off a finished piece, left to right. The piece looked uncovered, not grown.
- A frame widening over text that was already written. It passed the text at once, then grew over nothing.
- A typewriter faked with a clip stepping across finished text. It cut the outline of big letters.

### Popups

A popup (`aside.popup` with `data-build`) is a throwaway note laid over its slide. Use it to explain one piece of the slide without giving the explanation room there: what a figure means, where a number comes from.

- Write it right after the piece it explains, as a child of the slide or of a `.grid` in it. Never put it inside a panel: it is placed against the slide.
- It is small, and it sits in the slide's top left corner, reaching to the slide's middle. Its height is its content's.
- Three things tie it to its piece and put it on top. The slide goes dark behind it, as the slides around the current one do. The piece it explains stays lit, alone. A wire runs from that piece to the popup. It has the slide's own gray and an ink border, and no shadow.
- It pops. The wire is traced from the explained piece first; then the frame grows out of the wire's end in every direction at once, its border whole, in half of `--t-slow`. Its text is written once the frame shows.
- The pop has no overshoot and no scaling: nothing in the style bounces, and scaled text blurs.
- Build it like a small slide: an eyebrow, an `h3` that states the finding, then pieces of its own, each `data-build`. It opens with its eyebrow and title; its first piece waits for the next click.
- The click after its last piece shuts it. The frame draws back into the wire's end, the wire draws back to the piece, the slide lights up, and the slide's remaining pieces carry on. Back over that click opens it again, whole.
- Keep the piece it explains clear of the corner the popup takes: a popup laid over its own piece gets no wire.
- It never prints, and never shows without `style.js`. Put nothing in it that the slide needs.
- One popup per slide at most. A slide that needs two wants to be two slides.

Two earlier versions were tried and dropped:

- A centred popup over the slide's whole content area. Nothing showed which block it explained.
- A frame that widened from its left edge, as other boxes do. It read as one more box on the slide, not as something popping up over it.

### Motion to scale

To show a speed or a pace, show the motion itself, scaled. Bars standing in for it are not enough.

- First the fast thing crosses its lane. On the next click the slow thing sets off at its true share of that pace, and is left to crawl. In the reference deck, Voyager 1 crosses in about two seconds; the airliner moves at 1/68 of that for as long as the popup stays open.
- A mover is an icon tile riding the leading edge of its bar, so the bar behind it is the distance covered. Rotate the glyph to face the way it travels.
- It moves at one steady pace: linear, never eased. Set its time in page CSS as a multiple of `--t-slow`, so a speed control still scales it.
- Say the scale and both ends of the lane beside it.
- This is the one case where a mark runs longer than `--t-slow`.

### Reviewing motion

Motion is judged by eye, slowed down.

- Give a deck a speed slider while its motion is under review: a `.slider` that multiplies `--t-fast`, `--t-slow`, and `--t-step`, from real speed to ten times slower, and remembers its setting. The reference deck has one. It is a review tool, not part of the style; it stays off paper.
- When an animation is in question, do not guess twice. Build a lab page: the same blocks in each candidate, a Play button on each, and a speed slider. Let the user pick by eye, move the pick into `style.js`, and delete the lab.
- Check an animation by reading computed values part-way through it, at a slowed speed. One screenshot cannot tell growth from a late pop.
- Give a `clip-path` keyframe both its ends. A clip cannot blend from a shape to none: with only a start, the part stays hidden for half the time and then pops.

## Films

A film is a figure that plays: an animated explainer. Use one when the explanation is a change: a thing that moves, grows, spreads, or is taken away, and the way it does so is the point.

Three pages are the reference. Read `../../examples/gc-film.html` before writing a film.

| Page | Shows |
| --- | --- |
| `gc-film.html` | One subject at length: seven films with prose between them, two quizzes, a recap. Its script opens with a kit of stage parts to copy from. |
| `film-reel.html` | Three subjects and three kinds of motion. One stage is the style's own meter, in HTML. |
| `square-film.html` | Maths: an equation whose terms follow the picture, and sliders that replay a film on the reader's numbers. |

- A long subject is several short films, one idea each, with prose between them. Never make one long film.
- A film is not decoration. Where a still figure or a stepper says it, use that.

### Parts

```html
<figure class="panel film" id="swap" data-film data-link>
  <div class="panel-head">Title <span class="tag" data-film-count>1 / 5</span></div>
  <div class="panel-body">
    <svg class="chart stage" viewBox="0 0 926 300" role="img" aria-label="…"> … </svg>
    <p class="film-caption" aria-live="polite"></p>
    <ol class="film-script">
      <li data-beat="start" data-name="The pieces">The first sentence, shown before any press.</li>
      <li data-beat="cut" data-name="Cut">Cut the <mark data-key="strip">strip</mark> down the middle.</li>
    </ol>
  </div>
  <div class="panel-foot" data-film-transport></div>
</figure>
```

- The figure needs an id: its script is registered by it. `film.js` fills the empty `data-film-transport` foot with the transport and keeps the `data-film-count` tag.
- The stage is an SVG `.chart.stage` drawn 926px wide, the width of a panel's body on the 960px page. Its parts carry `data-part` names. A stage may instead be any box of the style's own components: the reel's threat table is a `.meter`.
- The beats are the `ol.film-script`. Each `<li>` has `data-beat`, the name its motion goes by, and `data-name`, a word or two the bar shows. The caption is filled from the current beat.
- The page ends with `<script src="film.js"></script>` and then its own script, which registers each film: `Film.add({ swap: { values, beats, draw } })`. The header of `assets/film.js` documents the script.
- A legend sits between the stage and the caption when the stage uses a state colour.

### Beats

A film is told in beats. A beat is one sentence and one change.

- Four to eight beats to a film. A film that needs more wants to be two.
- The sentence and its motion start together: the sentence is written while the picture moves. A pause to read the sentence first was tried and dropped: text and picture looked out of step.
- The reader sets the pace. The main button plays the next beat and stops; Replay plays the beat again; Back returns to the beat before; the bar scrubs both ways. A film that ran from start to end on one press was tried and dropped: it could not be followed.
- The first beat is the poster. It shows before any press, so its sentence needs no motion. Never leave the stage empty on the poster: draw the parts still to come as dashed boxes.
- A sentence says what happens, in the present tense, in at most two lines: about 130 characters. The caption keeps two lines of room so the stage never jumps.
- A beat may have no motion when it only points. `data-focus="draft line"` on its `<li>` keeps the parts with those keys lit and darkens the rest, for as long as the film rests on the beat.
- Films that share one scene open on the frame the film before ended on.

### A function of time

A film is a function of time. Its script names values and, beat by beat, the tweens that move them; its `draw` function turns the values into the picture.

- Every frame is drawn from the first values. `draw` keeps no state, and no part of a stage has a timer, a CSS animation, or a transition of its own. That is what lets the bar scrub backwards and a screenshot hold any moment.
- A tween moves one value: `{ v: "cut", to: 1, at: 0.5, dur: 2, ease: "linear" }`. `at` and `dur` are in units of `--t-slow`. A draw takes 1 to 2 units; a part that travels takes 3 to 4.
- Derive, do not tween, what follows from something else: a boat's height from the water under it, a wire's ends from the boxes it joins.
- Pick the easing by what the motion is:

| Easing | Motion |
| --- | --- |
| `ease` | A draw: a fill, a trace, a part being inked. The style's own curve. |
| `linear` | A steady pace: a cursor, a clock, a race, anything shown to scale. |
| `inout` | From rest to rest: a part that sets off and arrives. |
| `in` | Gathering speed: a fall. |
| `settle` | Losing speed evenly: a level nearing its goal. |

### Moves

Each move has one meaning. Use the move that fits what happens.

| Move | Means | Example |
| --- | --- | --- |
| Ink | A part comes to be. A dashed box fills from its left edge, as a bar does. | A term's shape; a new object. |
| Write, count | Text arrives a character at a time; a number runs from its old value to its new one. | A label; 39 becoming 64. |
| Slide, turn | A part moves as a rigid piece. | Half a strip swung under a square. |
| Trace, draw back | A line is drawn from its start; a line let go draws back to its holder. | A reference; a dropped local. |
| Ride | A part sits on another and moves with it. | A boat on rising water; a tick on a bar's value. |
| Pour | A stream of small squares, thinner as the flow slows. | Water through a sluice. |
| Spread | A mark travels along the wires, wave by wave. | A collector marking live objects. |
| Wipe | A cursor crosses a row and takes what it passes. | A sweep freeing memory. |
| Close ranks | What is left slides together, and its wires follow. | Compaction. |
| Race, swap | Bars grow at a steady pace; rows pass each other to change places. | A threat table. |
| To scale | A real duration or proportion, kept (see Motion to scale). | A 3-second taunt drained in 3 seconds. |

- Nothing fades, nothing bounces, and nothing blurs. A part that leaves is drawn back or wiped; it never just goes.
- Text on a stage never turns and never scales. A label rides its part upright, on whole pixels.
- A dashed part is not there yet, here as everywhere: a promise on the poster, an object not made, free space.

### Colour and names

- A part's series colour is which part it is. It follows the part across every film on the page.
- A state colour says what state a part is in, and comes with a word: green for marked, with "Marked" in a legend under the stage. A part with no colour is an inset gray box.
- Where an equation stands over a picture, each term is a chip in its shape's colour (`Film.equation`).
- A sentence names a part with `<mark data-key="strip">`, the key that part carries on the stage. The name takes the part's own colour: a gold strip is named in gold. This is the one place running text wears a series colour.
- A state colour never colours a name. A part with no colour of its own is named in the accent, as any mark is.
- Hovering a name dims everything on the stage but the part it names. The name keeps its colour.
- Name a part where a sentence first speaks of it. Most sentences name one part or none.

### Asking and handing over

- Ask before the reveal. `data-hold="id"` on a beat makes the film wait before it; a quiz with `data-check="id"` lets it go on through a hidden `<button data-gate-press="id" data-film-release="id">` inside the figure. Put the quiz right under the film. One hold to a film at most.
- Hand the numbers over. An `input.slider[data-film-param="b"]` in a second foot sets a number of the script's `params`, and `data-say` spans in the sentences follow it. The whole film then replays on the reader's numbers.

### Without motion

- Where the reader has turned motion down, a film rests on its last frame, and the buttons step from beat to beat with no motion between.
- On paper a film is its last frame over its beats as a numbered list.
- Without `film.js` a film shows only that list. Write each sentence so it stands without the picture.

### Checking a film

- `lint.py` checks the markup: an id, `data-beat` and `data-name` on every beat, `film.js` loaded, eight beats at most.
- `shot.py` shows each film on its last frame. Hold another with `--at`: `shot.py page.html --select "#swap" --at swap:cut+0.5` is half-way through the motion of the beat `cut`, and `swap:cut+2` is that beat at rest.
- Look at every beat at rest, and at one frame part-way through each motion that travels. Check that labels fit their boxes, that nothing overlaps, and that no part is left hanging.
- A still cannot judge pace. Give the page a speed slider (`input[data-speed]`, as the reference pages have) and say that the motion needs the user's eye.

## Page furniture

- **Crumbs** (`nav.crumbs`): where the page sits, as links above the eyebrow. The last item is the page itself, as plain text.
- **Byline** (`p.byline`): one note line under the lead: who, when, how long, which draft, parted by "·".
- **Sources**: one or two go in a margin note. More than that are footnotes: `<a class="fn" href="#fn-1">1</a>` in the text and an `ol.footnotes` at the foot, each ending in a link back.
- **Foot**: an `<hr>`, then the footnotes, then `footer.page-foot` with the data's source at the left and the date the page was made at the right. An `<hr>` has no other use: sections are parted by headings and space.

## Outside the page

Some places take no stylesheet. The look travels as an image, or as a mapping onto what the place offers.

- An image exported for a light place (a chat, a README, another tool's slides) keeps the page gray behind it, 24px of padding, and a 1px ink frame. Never export on a clear background. `python3 scripts/shot.py page.html --select "#id" -o figure.png` exports a part this way.
- A README or a chat message gets plain text and Markdown tables, and each figure as an exported image. Lead a chat message with the finding in a sentence.
- Slides for another tool are exported whole, each at 1920 by 1080: `python3 scripts/shot.py deck.html --scale 2 -o slide.png`.
- A terminal's colours map to tokens: background `--sunken`, text and white `--text`, bright black `--text-faint`, red `--red`, green `--green`, yellow `--yellow`, blue `--azure`, magenta `--amethyst`, cyan `--silver`, cursor `--accent`. The palette has no cyan. Put a state word beside every state colour.
- Mermaid: `assets/mermaid.json` is the theme. Pass it to `mermaid.initialize`, or to `mmdc` with `-c`. It gives inset boxes, sunken groups, ink edges, square corners, and solid replies. Edge labels sit on a panel-gray chip, which shows inside a group.
- plotly: `import plotly_style; plotly_style.use()` (in `scripts/`) registers the template. plotly cannot draw the ink ring or an outlined title; a figure that needs them is an inline SVG.

## Print

- Pages print with their dark surfaces. Disclosures print open; a stepper prints the state it is on. A deck prints one slide per page, edge to edge, every slide lit and every piece built: open the print dialog and save as PDF. Popups stay off paper.
- Animations do not run on paper; every mark prints finished.
- Dialogs and toasts stay off paper.
- A film prints its last frame, over its beats as a numbered list.

## Motion

| Token | Value | Meaning |
| --- | --- | --- |
| `--t-fast` | 120ms | A state changes: hover, press. |
| `--t-slow` | 480ms | Data draws: bars fill, columns rise, lines trace. |
| `--t-step` | 40ms | Delay between staggered siblings. |

- Motion is for data marks: bars fill, columns rise, lines trace, pies sweep. Add `.anim` to a container to turn it on.
- On a page, panels, text, and boxes never animate in. A fade and rise held text between pixels, so it looked blurred until it settled.
- One exception is a build piece in a deck (see Growth). It grows in over `--t-slow` with the same easing as a bar. The piece never fades, moves, or scales, so its text stays sharp. Never animate a piece any other way.
- The other is a film's stage (see Films). Its parts move under the film's script, and nothing outside the stage moves with them.
- In a deck, a mark waits for its slide to be the current one and for its piece to be built.
- `.stagger` on a parent delays each child's mark by one step.
- With `style.js` loaded, each panel plays when a fifth of it scrolls into view, not on page load. Its marks start together.
- A line needs `pathLength="1"` to trace. A pie slice needs `pathLength="100"`.
- On a page everything plays once: nothing replays on scrolling back. In a deck a piece grows again each time it is built. Nothing bounces, and one mark loops: the busy bar of a load of unknown length (see Data states).
- The stylesheet already honours reduced-motion settings.

## Hover

`style.js` adds a tooltip and linked highlighting to any mark.

- `data-tip="Name"` shows a tooltip while the pointer is over the element. `data-tip-value` puts a value at the right of the name; `data-tip-note` puts a dim line under it. The tooltip shows a swatch in the mark's `--fill`.
- `data-key="name"` links elements inside one panel. Hovering one lights up all of them, such as a pie slice and its legend row. Inside `[data-link]` the link spans that whole element (see Linked prose).
- The tooltip is a `--sunken` box with a black border: darker than any panel, no shadow, no rounding, no arrow. It follows the pointer.
- Hovering a mark darkens its siblings. Nothing fades to transparent.
- A tooltip adds detail. Names and values the reader needs stay visible in a label or legend.
- Give pie slices and unlabelled segments a tooltip. Use `data-tip`, not `title`: the browser's own tooltip is off-style.

## Recording preferences

When the user states a visual preference or corrects how something looks, offer to record it. Edit the plugin's source repo (a clone of `joshua-light/style`), not the installed copy: change `assets/style.css` (and `assets/style.js` for behaviour, or `assets/film.js` for films) and `../../examples/showcase.html`, then the matching rule here. Write each rule as a concrete instruction. Where a page's source can show a breach of the new rule, add the check to `scripts/lint.py`.
