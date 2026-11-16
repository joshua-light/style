/* film.js — films: figures that play. The rules are in ../SKILL.md, under Films; the reference pages
   are ../../../examples/gc-film.html, film-reel.html and square-film.html.

   A film is a figure.panel.film[data-film] with an id. It holds a .stage (an SVG .chart, or any box),
   a p.film-caption, its beats as an ol.film-script, and an empty .panel-foot[data-film-transport] that
   this script fills with the transport. A tag[data-film-count] in the head reads "2 / 6".

   A page registers one script per film, by the figure's id:

     Film.add({ id: { values, beats, draw(v, { stage, part }), params, say(v) } })

     values  the film's numbers at its first frame: { cut: 0, swing: 0 }
     beats   for each li[data-beat], the tweens that beat plays: { cut: [{ v: "cut", to: 1, dur: 2 }] }
             A tween moves one value to `to`. `at` and `dur` are in units of --t-slow; `ease` is one of
             ease, linear, inout, in, settle. `to` may be a function of the values.
     draw    turns the values into the picture. part(name) is the stage's [data-part="name"].
     params  numbers the reader may set, each with an input[data-film-param]; say(v) returns the words
             for every [data-say] in the film's sentences.

   A film is a function of time. Every frame starts from the first values and applies each tween up to
   now, so the bar scrubs both ways and a frame never depends on the one before. A draw function keeps
   no state of its own.

   A film plays one beat at a time, at the reader's pace. The main button plays the next beat and stops
   when it is done; Replay plays the beat again; Back returns to the beat before. A beat's sentence and
   its motion start together: the sentence is written while the picture moves. li[data-hold="id"] makes
   the film wait before that beat until a button[data-film-release="id"] in the figure is clicked: a
   quiz's data-gate-press does that. li[data-focus="key key"] keeps those parts lit through its beat.

   A sentence names a part of the stage with <mark data-key="…">, the key that part carries. The name
   takes the part's own colour, so a gold strip is named in gold. A part with no colour of its own is
   named in the accent, as any mark is. Hovering a name dims everything on the stage but the part it names.

   With motion turned down, and on paper, a film rests on its last frame. Without this script a film
   shows its beats as a list.

   For review: PAGE.html#at=move:swing+0.5 holds the film "move" half-way through the motion of its
   beat "swing"; +2 holds it on that beat at rest. An input[data-speed] on the page slows every film.

   Load it at the end of the body, before the page's own film script and without defer.
   scripts/build.py inlines this file. */
const Film = (() => {
  const NS = "http://www.w3.org/2000/svg";
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const T = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--t-slow")) || 480;
  const WRITE = 12;  // ms a character takes to be written
  const LEAST = 400; // ms the shortest beat lasts
  let rate = 1;      // the speed control: times slower than real

  const clamp = (p) => Math.max(0, Math.min(1, p));
  const span = (p, from, to) => clamp((p - from) / (to - from));
  const lerp = (a, b, p) => a + (b - a) * p;
  const fmt = (n) => String(Math.round(n * 100) / 100);
  // --ease as a function, so a tween can be asked for any moment.
  const bezier = (x1, y1, x2, y2) => (p) => {
    if (p <= 0 || p >= 1) return clamp(p);
    const at = (a, b, s) => 3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3;
    let low = 0, high = 1;
    for (let i = 0; i < 24; i++) {
      const mid = (low + high) / 2;
      if (at(x1, x2, mid) < p) low = mid; else high = mid;
    }
    return at(y1, y2, (low + high) / 2);
  };
  // ease   the style's own curve: a quick start that settles, as a bar fills
  // linear a steady pace: travel, a clock, anything shown to scale
  // inout  from rest to rest: a thing that sets off and arrives
  // in     gathering speed: a fall
  // settle losing speed evenly: a level that nears its goal
  const EASE = {
    ease: bezier(0.2, 0.7, 0.2, 1),
    linear: (p) => p,
    inout: (p) => p * p * (3 - 2 * p),
    in: (p) => p * p,
    settle: (p) => 1 - (1 - p) ** 2,
  };

  const make = (name, cls, parent, attrs = {}) => {
    const node = document.createElementNS(NS, name);
    if (cls) node.setAttribute("class", cls);
    for (const key in attrs) node.setAttribute(key, attrs[key]);
    if (parent) parent.append(node);
    return node;
  };
  const show = (node, on) => {
    if (on) node.removeAttribute("display"); else node.setAttribute("display", "none");
    return on;
  };
  const set = (node, attrs) => { for (const key in attrs) node.setAttribute(key, attrs[key]); };

  // Stage text. "x^2" raises the 2. Text is written a character at a time: the characters still to come
  // wait in hidden tspans, so a centred label never shifts as it is written.
  const rise = (node) => (node.classList.contains("term") ? 9 : 5);
  const parse = (text) => String(text).split(/(\^.)/).filter(Boolean).map((part) => (part[0] === "^" ? { t: part[1], sup: true } : { t: part }));
  const len = (text) => String(text).replace(/\^/g, "").length;
  function setText(node, text, n = Infinity) {
    const count = Math.max(0, Math.round(n));
    const key = text + "|" + Math.min(count, len(text));
    if (node._key === key) return;
    node._key = key;
    node.replaceChildren();
    let left = count;
    let raised = false;
    for (const run of parse(text)) {
      const written = run.t.slice(0, Math.max(0, left));
      left -= run.t.length;
      for (const [part, hidden] of [[written, false], [run.t.slice(written.length), true]]) {
        if (!part) continue;
        const piece = make("tspan", [run.sup && "sup", hidden && "unwritten"].filter(Boolean).join(" "), node);
        piece.textContent = part;
        if (!!run.sup !== raised) {
          piece.setAttribute("dy", run.sup ? -rise(node) : rise(node));
          raised = !!run.sup;
        }
      }
    }
  }
  const widths = new Map();
  function widthOf(stage, cls, text) {
    const key = cls + "|" + text;
    if (!widths.has(key)) {
      const probe = stage._probe || (stage._probe = make("text", "", stage, { visibility: "hidden", "aria-hidden": "true" }));
      probe.setAttribute("class", cls);
      probe._key = null;
      setText(probe, text);
      widths.set(key, probe.getComputedTextLength());
    }
    return widths.get(key);
  }
  // A plain label, written up to the share p.
  function say(node, text, p, x, y) {
    if (!show(node, p > 0)) return;
    if (x !== undefined) set(node, { x: Math.round(x), y: Math.round(y) });
    setText(node, text, len(text) * p);
  }
  // One text giving way to another: the first is unwritten, then the second is written.
  const swap = (a, b, p) => (p <= 0 ? { text: a } : p < 0.5 ? { text: a, n: len(a) * (1 - span(p, 0, 0.4)) } : { text: b, n: len(b) * span(p, 0.6, 1) });

  // A slot: a box that starts as a dashed promise and is inked from its left edge, as a bar fills.
  //   frame  the share of the dashed frame drawn      fill  the share inked
  //   base   the empty box is a solid inset box, not a dashed one; frame then grows it, and may be left out
  //   from   the share of the empty box wiped away, from its left edge
  // Its label is white on the empty box and ink on the fill: the ink copy is clipped to the fill, so the
  // colour changes exactly at the fill's edge. Rects sit on whole pixels; text never turns or scales.
  let clips = 0;
  function slot(stage, g, o) {
    let s = g._slot;
    if (!s) {
      s = g._slot = {};
      s.ghost = make("rect", "box ghost", g);
      s.under = make("text", o.cls + " mid", g);
      s.solid = make("rect", "box piece", g);
      s.id = "film-clip-" + (++clips);
      s.clip = make("rect", "", make("clipPath", "", g, { id: s.id }));
      s.over = make("text", o.cls + " mid on-fill", g);
    }
    const frame = o.frame || 0;
    const fill = o.fill || 0;
    const turning = !!o.turn;
    const x0 = turning ? o.x : Math.round(o.x), y0 = turning ? o.y : Math.round(o.y);
    const x1 = turning ? o.x + o.w : Math.round(o.x + o.w), y1 = turning ? o.y + o.h : Math.round(o.y + o.h);
    const [W, H] = [x1 - x0, y1 - y0];
    const [cx, cy] = [(x0 + x1) / 2, (y0 + y1) / 2];
    const from = o.from || 0;
    if (show(s.ghost, (frame > 0 || o.base) && fill < 1 && from < 1)) {
      const left = x0 + Math.round(W * from);
      set(s.ghost, { class: o.base ? "box" : "box ghost", x: left + 0.5, y: y0 + 0.5, width: Math.max(1, Math.round((o.base ? x1 - left : W) * (o.base && !frame ? 1 : frame))), height: H });
    }
    if (show(s.solid, fill > 0)) {
      const width = turning ? W : Math.max(1, Math.round(W * fill));
      set(s.solid, { x: x0 + 0.5, y: y0 + 0.5, width, height: H });
      set(s.clip, { x: x0, y: y0, width: width + 1, height: H + 1 });
      if (turning) s.solid.setAttribute("transform", `rotate(${o.turn} ${cx} ${cy})`); else s.solid.removeAttribute("transform");
      s.solid.style.shapeRendering = turning ? "auto" : "";
    }
    // A label shows only where its box has room for it.
    const side = turning && o.turn > 45 ? [H, W] : [W, H];
    const text = o.text || "";
    const fits = text && (o.bare || (widthOf(stage, o.cls, text) + 8 <= side[0] && side[1] >= 20));
    const [tx, ty] = [Math.round(cx), Math.round(cy) + o.rise];
    if (show(s.under, fits && (o.bare || o.base || frame > 0) && fill < 1)) {
      set(s.under, { x: tx, y: ty });
      setText(s.under, text, o.n);
    }
    const over = o.over || text;
    if (show(s.over, fits && fill > 0)) {
      set(s.over, { x: tx, y: ty });
      setText(s.over, over, o.over ? Infinity : o.n);
      if (fill < 1) s.over.setAttribute("clip-path", `url(#${s.id})`); else s.over.removeAttribute("clip-path");
    }
  }

  // A measure: a rule with end ticks beside an edge, grown from its start, and its label written with it.
  // off is the distance from the edge, negative for above or left.
  function measure(g, o) {
    const m = g._measure || (g._measure = { rule: make("path", "measure", g), label: make("text", "series", g) });
    if (!show(g, o.p > 0)) return;
    const p = clamp(o.p);
    const flat = o.y1 === o.y2;
    if (flat) {
      const y = Math.round(o.y1 + o.off) + 0.5;
      const [a, b] = [Math.round(o.x1) + 0.5, Math.round(o.x2) + 0.5];
      m.rule.setAttribute("d", `M${a} ${y - 3}v6M${a} ${y}H${lerp(a, b, p)}` + (p >= 1 ? `M${b} ${y - 3}v6` : ""));
      set(m.label, { class: "series mid", x: Math.round((a + b) / 2), y: Math.round(o.off < 0 ? y - 7 : y + 18) });
    } else {
      const x = Math.round(o.x1 + o.off) + 0.5;
      const [a, b] = [Math.round(o.y1) + 0.5, Math.round(o.y2) + 0.5];
      m.rule.setAttribute("d", `M${x - 3} ${a}h6M${x} ${a}V${lerp(a, b, p)}` + (p >= 1 ? `M${x - 3} ${b}h6` : ""));
      set(m.label, { class: o.off < 0 ? "series end" : "series", x: Math.round(o.off < 0 ? x - 8 : x + 8), y: Math.round((a + b) / 2 + 5) });
    }
    setText(m.label, o.text, o.n === undefined ? len(o.text) * p : o.n);
  }

  // An equation: a row of terms, centred on cx. A term is { id, text, kind, fill, key, count }.
  //   kind  "op" plain sign · "ghost" dashed box · "chip" box in its shape's colour · "neutral" gray box
  // Between two rows A and B at the share p: a term only in A is drawn back, a term in both slides to
  // its new place, and a term only in B is written. A term whose text changes is rewritten, or counts
  // from the old number to the new where it says count. A ghost that turns solid is inked by p.
  const PAD = 10;
  const GAP = 10;
  function equation(stage, group, cx, cy, A, B, p) {
    const lay = (row) => {
      const placed = new Map();
      let total = -GAP;
      for (const term of row) {
        term.w = Math.round(widthOf(stage, "term", term.text)) + (term.kind === "op" ? 0 : 2 * PAD);
        total += term.w + GAP;
      }
      let x = Math.round(cx - total / 2);
      for (const term of row) {
        placed.set(term.id, { ...term, x });
        x += term.w + GAP;
      }
      return placed;
    };
    const a = lay(A);
    const b = p > 0 ? lay(B) : a;
    const terms = group._terms || (group._terms = new Map());
    for (const [id, g] of terms) show(g, a.has(id) || b.has(id));
    for (const id of new Set([...a.keys(), ...b.keys()])) {
      if (!terms.has(id)) terms.set(id, make("g", "", group));
      const g = terms.get(id);
      const [from, to] = [a.get(id), b.get(id)];
      const term = to || from;
      const o = { x: term.x, y: cy - 18, w: term.w, h: 36, rise: 10, text: term.text, cls: term.kind === "op" ? "term op" : "term", bare: term.kind === "op" };
      let share = 1;   // how much of the term is there
      let inked = 1;   // how much of its box is solid
      if (from && to) {
        const m = EASE.ease(span(p, 0.15, 0.75));
        o.x = lerp(from.x, to.x, m);
        o.w = lerp(from.w, to.w, m);
        if (from.text !== to.text && p < 1) {
          if (to.count) {
            const [low, high] = [parseFloat(from.text), parseFloat(to.text)];
            o.text = lerp(low, high, m).toFixed(Number.isInteger(low) && Number.isInteger(high) ? 0 : 2);
          } else Object.assign(o, swap(from.text, to.text, p));
        }
        if (from.kind === "ghost" && to.kind !== "ghost") inked = p;
      } else if (from) share = 1 - span(p, 0, 0.3);
      else share = span(p, 0.4, 1);
      if (share < 1) o.n = len(o.text) * share;
      if (term.kind === "ghost") o.frame = share;
      else if (term.kind !== "op") {
        o.frame = inked < 1 ? 1 : 0;
        o.fill = inked < 1 ? inked : share;
      }
      g.classList.toggle("neutral", term.kind === "neutral");
      if (term.fill) g.style.setProperty("--fill", term.fill); else g.style.removeProperty("--fill");
      if (term.key) g.dataset.key = term.key; else delete g.dataset.key;
      slot(stage, g, o);
    }
  }

  // A line in a chart has an ink copy just before it, laid there by style.js: the two are set together.
  const both = (node) => [node.previousElementSibling, node].filter((n) => n && (n === node || n.classList.contains("ink")));

  // ── The player ──
  const glyph = (d) => `<span class="glyph"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="${d}"/></svg></span>`;
  const TRANSPORT = `
    <button type="button" class="button primary" data-film-play>${glyph("M19.376 12.416L8.777 19.482A.5.5 0 0 1 8 19.066V4.934a.5.5 0 0 1 .777-.416l10.599 7.066a.5.5 0 0 1 0 .832").replace("<span", '<span data-film-icon="play"')}${glyph("M6 5h2v14H6zm10 0h2v14h-2z").replace("<span", '<span data-film-icon="pause" hidden')}<span data-film-word>Play</span></button>
    <button type="button" class="button" data-film-step="-1">${glyph("m8 11.333l10.223-6.815a.5.5 0 0 1 .777.416v14.132a.5.5 0 0 1-.777.416L8 12.667V19a1 1 0 1 1-2 0V5a1 1 0 0 1 2 0z")}<span>Back</span></button>
    <button type="button" class="button" data-film-again>${glyph("M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10m4.82-4.924a7 7 0 1 0-1.853 1.266l-.974-1.755A5 5 0 1 1 17 12h-3z")}<span>Replay</span></button>
    <label class="meter-row film-bar"><span class="meter-label" data-film-name></span><input class="slider" type="range" min="0" max="1000" step="1" value="0" style="--fill:var(--c5)" data-film-seek aria-label="Position in the film"><output class="meter-value" data-film-time></output></label>`;
  const films = [];
  function film(fig, spec) {
    // An empty [data-film-transport] foot is given the usual controls.
    const foot = fig.querySelector("[data-film-transport]");
    if (foot && !foot.children.length) foot.innerHTML = TRANSPORT;
    const stage = fig.querySelector(".stage");
    const caption = fig.querySelector(".film-caption");
    const ui = (name) => fig.querySelector(`[data-film-${name}]`);
    const parts = {};
    const part = (name) => parts[name] || (parts[name] = stage.querySelector(`[data-part="${name}"]`));
    const params = { ...spec.params };
    const tidy = (li) => li.textContent.trim().replace(/\s+/g, " ");

    // The schedule. A beat lasts as long as its sentence takes to write or its picture to move,
    // whichever is longer: the reader, not the clock, decides when the next one starts.
    // The first sentence is on the poster, so it is not written again.
    let clock = 0;
    const beats = [...fig.querySelectorAll(".film-script > li")].map((li, i) => {
      const tweens = spec.beats[li.dataset.beat] || [];
      const motion = Math.max(0, ...tweens.map((tween) => (tween.at || 0) + (tween.dur || 1))) * T;
      const chars = tidy(li).length;
      const beat = { li, tweens, motion, id: li.dataset.beat, name: li.dataset.name, hold: li.dataset.hold, focus: (li.dataset.focus || "").split(" ").filter(Boolean), start: clock };
      beat.write = i ? chars * WRITE : 0;
      beat.go = beat.start;
      beat.end = beat.start + Math.max(LEAST, beat.write, motion);
      clock = beat.end;
      return beat;
    });
    const total = clock;
    const held = new Set(beats.map((beat) => beat.hold).filter(Boolean));
    // The film cannot pass a beat that waits for an answer.
    const limit = () => {
      const wall = beats.find((beat) => beat.hold && held.has(beat.hold));
      return wall ? wall.start - 1 : total;
    };

    const bar = ui("seek").parentNode;
    for (const beat of beats.slice(1)) {
      const tick = document.createElement("span");
      tick.className = "film-tick";
      tick.style.setProperty("--at", (beat.start / total).toFixed(4));
      bar.append(tick);
    }

    // The beat that holds a moment, and the moment a beat comes to rest: its last frame.
    const beatAt = (time) => Math.max(0, beats.findLastIndex((beat) => beat.start <= time));
    const rest = (i) => (i >= beats.length - 1 ? total : beats[i].end - 1);

    let t = rest(0);    // the poster: the first beat, played out
    let playing = false;
    let stopAt = total; // where the beat being played comes to rest
    let last = 0;
    let lit = [];

    function render() {
      const v = { ...spec.values, ...params };
      for (const beat of beats) {
        for (const tween of beat.tweens) {
          const p = (t - beat.go - (tween.at || 0) * T) / ((tween.dur || 1) * T);
          if (p <= 0) continue;
          const to = typeof tween.to === "function" ? tween.to(v) : tween.to;
          v[tween.v] = lerp(v[tween.v], to, EASE[tween.ease || "ease"](Math.min(1, p)));
        }
      }
      spec.draw(v, { stage, part });

      const i = beatAt(t);
      const beat = beats[i];
      // The caption keeps the sentence's own markup. What is not written yet waits, hidden, so the
      // lines break where they will in the end.
      const chars = tidy(beat.li).length;
      const written = beat.write ? Math.round(chars * clamp((t - beat.start) / beat.write)) : chars;
      const key = i + "|" + written + "|" + beat.li.textContent;
      if (caption._key !== key) {
        caption._key = key;
        caption.replaceChildren(...beat.li.cloneNode(true).childNodes);
        const walker = document.createTreeWalker(caption, NodeFilter.SHOW_TEXT);
        const nodes = [];
        for (let node = walker.nextNode(); node; node = walker.nextNode()) nodes.push(node);
        let room = written;
        for (const node of nodes) {
          const keep = Math.max(0, Math.min(node.data.length, room));
          room -= node.data.length;
          if (keep === node.data.length) continue;
          // A name not written yet shows no rule under it either.
          const name = node.parentElement.closest("mark");
          if (name && !keep) name.style.visibility = "hidden";
          const rest = document.createElement("span");
          rest.className = "unwritten";
          rest.textContent = node.data.slice(keep);
          node.data = node.data.slice(0, keep);
          node.after(rest);
        }
      }
      // The parts a beat is about stay lit while the rest darken, as under a hover, for as long as
      // the film rests on that beat.
      const keys = beat.focus;
      for (const node of lit) node.classList.remove("is-hot");
      // A name in the sentence keeps its own colour: only parts of the stage are lit.
      lit = keys.length ? [...fig.querySelectorAll("[data-key]:not(mark)")].filter((node) => keys.includes(node.dataset.key)) : [];
      for (const node of lit) node.classList.add("is-hot");

      ui("count").textContent = i + 1 + " / " + beats.length;
      ui("name").textContent = beat.name;
      ui("time").textContent = Math.round(t / 1000) + "s / " + Math.round(total / 1000) + "s";
      ui("seek").value = Math.round((t / total) * 1000);
      // The main button names what it will do. Held before a beat that waits for an answer, it says
      // where the answer goes.
      const settled = t >= rest(i);
      ui("word").textContent = playing ? "Pause" : waiting() ? "Answer below" : !settled || !i ? "Play" : i === beats.length - 1 ? "Start over" : "Next";
      fig.querySelector('[data-film-icon="play"]').hidden = playing;
      fig.querySelector('[data-film-icon="pause"]').hidden = !playing;
      ui("play").disabled = waiting();
      if (ui("again")) ui("again").disabled = !beat.motion && !beat.write;
    }
    // The film rests before a beat that waits for an answer.
    function waiting() {
      const next = beats[beatAt(t) + 1];
      return !playing && t >= rest(beatAt(t)) && !!next && !!next.hold && held.has(next.hold);
    }

    function frame(now) {
      if (!playing) return;
      t += (now - last) / rate;
      last = now;
      if (t >= stopAt) {
        t = stopAt;
        pause();
      } else requestAnimationFrame(frame);
      render();
    }
    function pause() {
      playing = false;
      render();
    }
    // Plays from where the film stands to the rest of beat i, and stops there.
    function play(i) {
      stopAt = Math.min(rest(i), limit());
      if (t >= stopAt) return render();
      for (const other of films) if (other !== api) other.pause();
      // With motion turned down, a film jumps beat to beat and never runs.
      if (calm) {
        t = stopAt;
        return pause();
      }
      playing = true;
      last = performance.now();
      requestAnimationFrame(frame);
      render();
    }
    // A reader cannot scrub past a beat that waits for an answer; review and print can.
    function seek(to, past = false) {
      t = Math.max(0, Math.min(past ? total : limit(), to));
      render();
    }
    // The main button: pause; or finish a beat left half-way; or play the next beat; or, at the end,
    // go back to the start.
    function advance() {
      if (playing) return pause();
      const i = beatAt(t);
      if (t < rest(i)) return play(i);
      if (i === beats.length - 1) return seek(rest(0));
      if (waiting()) return;
      t = beats[i + 1].start;
      play(i + 1);
    }
    // Replay plays the current beat again from its start. Back returns to the beat before, played out.
    function again() {
      const i = beatAt(t);
      playing = false;
      t = beats[i].start;
      play(i);
    }
    function back() {
      playing = false;
      seek(rest(Math.max(0, beatAt(t) - 1)));
    }

    // Names. A <mark data-key> in a sentence names the part of the stage with that key, and takes that
    // part's own colour: its --fill. A state colour says what state a part is in, not which part it is,
    // so a part that wears only one is named in the accent.
    function tint() {
      for (const name of fig.querySelectorAll(".film-script mark[data-key]")) {
        const own = [...stage.querySelectorAll(`[data-key="${CSS.escape(name.dataset.key)}"]`)]
          .map((node) => node.style.getPropertyValue("--fill").trim())
          .find((fill) => fill && !/--(good|warn|bad|info)\b/.test(fill));
        if (own) name.style.setProperty("--fill", own); else name.style.removeProperty("--fill");
      }
      caption._key = null;  // the caption is a copy of its sentence: copy it again
    }

    // Hovering a name dims everything on the stage but the part it names, by the share a deck's other
    // slides go dark. A box that holds the named part, or parts with keys of their own, is dimmed piece
    // by piece: a part inside a dimmed box that the stylesheet also dims, as an unlit keyed part, would
    // go dark twice.
    let dimmed = [];
    let pointed = null;
    function point(key) {
      if (key === pointed) return;
      pointed = key;
      for (const node of dimmed) node.classList.remove("is-dim");
      dimmed = [];
      const named = key ? [...stage.querySelectorAll(`[data-key="${CSS.escape(key)}"]`)] : [];
      if (!named.length) return;
      const walk = (box) => {
        for (const node of box.children) {
          if (named.includes(node)) continue;
          if (node.querySelector("[data-key]")) {
            walk(node);
            continue;
          }
          node.classList.add("is-dim");
          dimmed.push(node);
        }
      };
      walk(stage);
    }
    fig.addEventListener("pointerover", (e) => {
      const name = e.target.closest && e.target.closest(".film-caption mark[data-key]");
      point(name ? name.dataset.key : null);
    });
    fig.addEventListener("pointerleave", () => point(null));

    // The film's own numbers: a slider sets one, and every frame is redrawn from it.
    function tell() {
      const words = spec.say ? spec.say({ ...spec.values, ...params }) : {};
      for (const node of fig.querySelectorAll("[data-say]")) node.textContent = words[node.dataset.say];
      for (const input of fig.querySelectorAll("[data-film-param]")) {
        input.value = params[input.dataset.filmParam];
        input.parentNode.querySelector("output").textContent = input.value;
      }
    }

    fig.addEventListener("click", (e) => {
      if (e.target.closest("[data-film-play]") || e.target.closest(".stage")) return advance();
      if (e.target.closest("[data-film-again]")) return again();
      const stepper = e.target.closest("[data-film-step]");
      if (stepper) return Number(stepper.dataset.filmStep) < 0 ? back() : advance();
      // An answer lets the film go on: it plays the beat that was waiting.
      const release = e.target.closest("[data-film-release]");
      if (release) {
        const was = waiting();
        held.delete(release.dataset.filmRelease);
        return was ? advance() : render();
      }
      if (e.target.closest("[data-film-reset]")) {
        Object.assign(params, spec.params);
        tell();
        render();
      }
    });
    fig.addEventListener("input", (e) => {
      if (e.target.matches("[data-film-seek]")) {
        playing = false;
        return seek((e.target.value / 1000) * total);
      }
      if (e.target.matches("[data-film-param]")) {
        params[e.target.dataset.filmParam] = Number(e.target.value);
        tell();
        render();
      }
    });
    // A film out of sight stops: its sentences would pass unread.
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => { if (!entry.isIntersecting && playing) pause(); }, { threshold: 0.1 }).observe(fig);
    }

    // For review: the moment a share of the way through a beat's motion. A share above 1 is the
    // beat at rest: its sentence written and its motion done.
    const moment = (id, share) => {
      const i = beats.findIndex((one) => one.id === id);
      return i < 0 ? 0 : share > 1 ? rest(i) : beats[i].go + beats[i].motion * share;
    };
    const api = { fig, pause, render, seek, moment, total, get t() { return t; } };
    films.push(api);
    fig.classList.add("is-live");
    // With motion turned down the film rests on its last frame, as it prints.
    if (calm) t = total;
    tell();
    render();
    // The first frame makes the parts; the names can then take their colours.
    tint();
    render();
    return api;
  }

  // The speed control, where a page has one: remembered across reloads, as on the reference deck.
  const speed = document.querySelector("[data-speed]");
  if (speed) {
    const shown = document.querySelector("[data-speed-show]");
    const pace = () => {
      rate = Number(speed.value);
      if (shown) shown.textContent = rate === 1 ? "Real speed" : rate + " times";
      try { localStorage.setItem("film-speed", rate); } catch {}
    };
    try {
      const saved = Number(localStorage.getItem("film-speed"));
      if (saved >= 1 && saved <= 10) speed.value = saved;
    } catch {}
    speed.addEventListener("input", pace);
    pace();
  }

  // Text is measured to lay a stage out, so the films wait for the fonts; and for style.js, which
  // lays the ink copies under chart lines.
  const scripts = {};
  addEventListener("DOMContentLoaded", () => document.fonts.ready.then(() => {
    for (const fig of document.querySelectorAll("[data-film]")) if (scripts[fig.id]) film(fig, scripts[fig.id]);
    // For review: #at=move:swing+0.5 holds the film "move" half-way through the motion of its beat
    // "swing"; #at=move:swing+2 holds it on that beat at rest; #at=move:12400 at that many milliseconds.
    for (const [, id, at, share] of location.hash.matchAll(/([\w-]+):([\w-]+)(?:\+([\d.]+))?/g)) {
      const held = films.find((one) => one.fig.id === id);
      if (held) held.seek(/^\d+$/.test(at) ? Number(at) : held.moment(at, share === undefined ? 1 : Number(share)), true);
    }
    // A face that arrives late changes every width.
    document.fonts.addEventListener("loadingdone", () => {
      widths.clear();
      for (const one of films) one.render();
    });
  }));
  // Paper shows each film's last frame.
  let before = [];
  addEventListener("beforeprint", () => {
    before = films.map((one) => one.t);
    for (const one of films) one.seek(one.total, true);
  });
  addEventListener("afterprint", () => films.forEach((one, i) => one.seek(before[i], true)));

  return {
    add: (more) => Object.assign(scripts, more),
    T, EASE, clamp, span, lerp, fmt, len, make, show, set, setText, widthOf, say, swap, slot, measure, equation, both,
  };
})();
