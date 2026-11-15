/* style.js — hover tooltips, linked highlighting, reveal on scroll, tabs,
   sortable tables, steppers, quizzes, bound sliders, the contents rail, and
   stepping through a deck and its builds.

   data-tip="Title" on any element shows a tooltip while the pointer is over
   it. data-tip-value adds a value at the right of the title; data-tip-note
   adds a dim line under it. The tooltip shows a swatch in the mark's --fill.

   data-key="name" links elements inside one panel: hovering one gives every
   element with the same key the class is-hot, so a slice and its legend row
   light up together. style.css dims the siblings. Inside [data-link] the
   link spans that whole element, so a <mark data-key> in a sentence lights a
   part of the figure beside it.

   Inside .anim, data animations wait until their panel scrolls into view:
   this script holds them paused (html.js-reveal) and adds in-view to each
   panel, slide, or figure the first time a fifth of it is visible. Without
   the script everything plays on load.

   .tab[data-tab] shows the matching [data-tab-panel]. table.sortable sorts on
   a click of a head.

   Under .deck the slide nearest the middle of the window gets is-current and
   style.css darkens the rest. Arrow keys, Page Up/Down, Space and a click
   step forward: first through the current slide's [data-build] pieces, each
   getting is-built, then on to the next slide. data-build="with" joins the
   step before it; data-build="3" names the step. Nothing just appears: every
   part of a piece grows in as a bar fills. A framed box widens with its
   frame whole, text is written a character at a time, a value counts up, and
   rules, underlines and shapes grow from their start.

   .popup[data-build] in a slide is a throwaway note in its top left corner,
   about the piece written just before it: it opens on its own step with a
   wire to that piece, builds its own pieces, and one step after the last it
   is shut (is-shut) and the slide carries on.

   .stepper holds a figure with numbered states. [data-go="2"] goes to state 2,
   "prev" and "next" step; [data-on="2 3"] shows on those states, [data-vis]
   does the same but keeps its room; .step-count reads "2 / 4".

   .quiz: a click on an option in .options marks it against the one with
   data-correct, fills .verdict and shows .feedback. [data-reveal] shows the
   feedback with no options. data-check="id" on the quiz opens its gates once
   it is answered: [data-gate="id"] shows, [data-gate-hide] hides,
   [data-gate-enable] unlocks and [data-gate-press] is clicked.

   input[data-bind="--name"] writes its value to that custom property on its
   panel (or on data-bind-to="selector") and into every [data-show="--name"].

   .rail: the link to the chapter being read gets aria-current, and the bar
   inside it fills with the share of the page scrolled.

   html gets the class no-expressway where Expressway's Bold file is absent;
   style.css then sets the page in Fira Sans. It gets no-regular where the
   Bold file loads but Expressway Regular is not installed; style.css then
   sets emphasis in Extra-bold.

   scripts/build.py inlines this file. */
(() => {
  // Pick the face. Expressway needs its Bold file: without it Fira Sans takes
  // every weight, so an installed Expressway Regular never pairs with Fira
  // Sans Bold. A page with no Expressway rule was built without the file, and
  // build.py has already pinned the fallback.
  // With the Bold file, text falls back to Bold where Expressway Regular is
  // not installed, and Bold emphasis would vanish in it. Probe with the names
  // style.css tries, so both agree; on a miss emphasis steps up to Extra-bold.
  if ("FontFace" in window && document.fonts) {
    const root = document.documentElement;
    const bold = [...document.fonts].find(
      (face) => face.family.replace(/["']/g, "") === "Expressway" && face.weight === "700");
    const names = ["ExpresswayRg-Regular", "Expressway Regular", "Expressway-Regular"];
    if (bold) bold.load().then(
      () => new FontFace("Expressway probe", names.map((name) => `local("${name}")`).join(", "))
        .load()
        .catch(() => root.classList.add("no-regular")),
      () => root.classList.add("no-expressway"));
  }

  // The ink ring round a chart line is a second copy of the line, in ink and
  // 2px wider, laid under it: a real stroke, so it is smooth at any slope.
  // style.css draws the ring with a filter where this has not run, and a
  // filter's ring is cut from pixels: it steps along a diagonal. A hollow
  // marker gets the same copy. The copy keeps the line's classes, so it traces
  // and fades with it.
  for (const mark of document.querySelectorAll(".chart .line, .chart .wire, .spark .line, .chart .dot.ghost")) {
    const ink = mark.cloneNode(false);
    for (const { name } of [...ink.attributes]) {
      if (name === "id" || name.startsWith("data-") || name.startsWith("aria-")) ink.removeAttribute(name);
    }
    ink.classList.add("ink");
    ink.setAttribute("aria-hidden", "true");
    mark.before(ink);
    mark.classList.add("inked");
    const spark = mark.closest(".spark");
    if (spark) spark.classList.add("inked");
  }

  const ANIMATED = ".bar-fill, .col-fill, .line, .dot, .pie-slice";
  if ("IntersectionObserver" in window) {
    document.documentElement.classList.add("js-reveal");
    const seen = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("in-view");
        seen.unobserve(entry.target);
      }
    }, { threshold: 0.2 });
    // One reveal per box: its marks start together when the box shows.
    const roots = new Set();
    for (const el of document.querySelectorAll(".anim :is(" + ANIMATED + ")")) {
      roots.add(el.closest(".panel, .slide, figure") || el);
    }
    for (const root of roots) seen.observe(root);
  }

  const tip = document.createElement("div");
  tip.className = "tooltip";
  tip.setAttribute("role", "tooltip");
  tip.hidden = true;
  document.body.append(tip);

  let hot = [];

  function clear() {
    for (const el of hot) el.classList.remove("is-hot");
    hot = [];
    tip.hidden = true;
  }

  function add(parent, cls, text) {
    const el = document.createElement("span");
    el.className = cls;
    if (text) el.textContent = text;
    parent.append(el);
    return el;
  }

  function show(el) {
    clear();
    const key = el.dataset.key;
    const scope = el.closest("[data-link]") || el.closest(".panel, figure, .slide") || document;
    hot = key ? [...scope.querySelectorAll(`[data-key="${CSS.escape(key)}"]`)] : [el];
    for (const n of hot) n.classList.add("is-hot");

    // A legend row carries only a key; it borrows the tooltip of its mark.
    const src = el.dataset.tip ? el : hot.find((n) => n.dataset.tip);
    if (!src) return;

    tip.replaceChildren();
    const head = add(tip, "tooltip-head");
    const fill = getComputedStyle(src).getPropertyValue("--fill").trim();
    if (fill) add(head, "swatch").style.setProperty("--fill", fill);
    add(head, "tooltip-title", src.dataset.tip);
    if (src.dataset.tipValue) add(head, "tooltip-value", src.dataset.tipValue);
    if (src.dataset.tipNote) add(tip, "tooltip-note", src.dataset.tipNote);
    tip.hidden = false;
  }

  // Whole pixels only: text at a fractional offset renders soft.
  function move(e) {
    const { width, height } = tip.getBoundingClientRect();
    let x = e.clientX + 12;
    let y = e.clientY + 16;
    if (x + width > innerWidth - 8) x = e.clientX - 12 - width;
    if (y + height > innerHeight - 8) y = e.clientY - 12 - height;
    tip.style.left = Math.round(Math.max(8, x)) + "px";
    tip.style.top = Math.round(Math.max(8, y)) + "px";
  }

  document.addEventListener("pointerover", (e) => {
    const el = e.target.closest("[data-tip], [data-key]");
    if (!el) return clear();
    if (!hot.includes(el)) show(el);
    if (!tip.hidden) move(e);
  });
  document.addEventListener("pointermove", (e) => {
    if (!tip.hidden) move(e);
  });
  document.documentElement.addEventListener("pointerleave", clear);
  addEventListener("scroll", clear, { passive: true });

  // Tabs: a .tab with data-tab="name" shows the element with
  // data-tab-panel="name" in the same panel, figure or slide and hides the rest.
  function pickTab(tab) {
    const scope = tab.closest(".panel, figure, .slide") || document;
    for (const other of tab.closest(".tabs").querySelectorAll(".tab")) {
      other.setAttribute("aria-pressed", other === tab ? "true" : "false");
    }
    for (const panel of scope.querySelectorAll("[data-tab-panel]")) {
      panel.hidden = panel.dataset.tabPanel !== tab.dataset.tab;
    }
  }
  for (const tabs of document.querySelectorAll(".tabs")) {
    const first = tabs.querySelector('.tab[aria-pressed="true"]') || tabs.querySelector(".tab");
    if (first && first.dataset.tab) pickTab(first);
  }

  // Sorting: a click on a head of table.sortable orders the body by that
  // column; a second click reverses it. Cells that read as numbers sort as numbers.
  function sortBy(th) {
    const table = th.closest("table");
    const index = [...th.parentNode.children].indexOf(th);
    const down = th.getAttribute("aria-sort") !== "descending";
    for (const other of th.parentNode.children) other.removeAttribute("aria-sort");
    th.setAttribute("aria-sort", down ? "descending" : "ascending");
    const key = (row) => {
      const text = row.children[index].textContent.trim();
      const number = parseFloat(text.replace(/[^0-9.+-]/g, ""));
      return /^[^a-z]*$/i.test(text.replace(/[a-z%]+$/i, "")) && !Number.isNaN(number) ? number : text.toLowerCase();
    };
    // Each body sorts on its own, and a group heading row stays on top of its group.
    for (const body of table.tBodies) {
      const heads = [...body.rows].filter((row) => row.querySelector("th"));
      const rows = [...body.rows].filter((row) => !row.querySelector("th")).sort((a, b) => {
        const [x, y] = [key(a), key(b)];
        const order = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
        return down ? -order : order;
      });
      body.append(...heads, ...rows);
    }
  }

  // Steppers. A part belongs to the nearest .stepper around it, so one may nest.
  const inStepper = (stepper, sel) => [...stepper.querySelectorAll(sel)].filter((el) => el.closest(".stepper") === stepper);
  const listed = (el, name) => (el.getAttribute(name) || "").split(/\s+/).filter(Boolean);
  function stepCount(stepper) {
    const numbers = inStepper(stepper, "[data-go], [data-on], [data-vis]")
      .flatMap((el) => [...listed(el, "data-go"), ...listed(el, "data-on"), ...listed(el, "data-vis")])
      .map(Number).filter((n) => n > 0);
    return Math.max(1, ...numbers);
  }
  function setStep(stepper, to) {
    const count = stepCount(stepper);
    const at = Number(stepper.dataset.step) || 1;
    const step = Math.max(1, Math.min(count, to === "next" ? at + 1 : to === "prev" ? at - 1 : Number(to) || 1));
    stepper.dataset.step = step;
    for (const go of inStepper(stepper, "[data-go]")) {
      const target = go.dataset.go;
      if (go.matches("input")) go.value = step;
      else if (target === "prev") go.disabled = step === 1;
      else if (target === "next") go.disabled = step === count;
      else go.setAttribute("aria-pressed", Number(target) === step ? "true" : "false");
    }
    for (const el of inStepper(stepper, "[data-on]")) el.hidden = !listed(el, "data-on").includes(String(step));
    for (const el of inStepper(stepper, "[data-vis]")) el.style.visibility = listed(el, "data-vis").includes(String(step)) ? "" : "hidden";
    for (const el of inStepper(stepper, ".step-count")) el.textContent = step + " / " + count;
  }
  for (const stepper of document.querySelectorAll(".stepper")) setStep(stepper, stepper.dataset.step);

  // Quizzes. Each .quiz-item is answered on its own; a quiz without items is one question.
  function finish(box) {
    const feedback = box.querySelector(".feedback");
    if (feedback) feedback.hidden = false;
    const quiz = box.closest(".quiz");
    const open = [...quiz.querySelectorAll(".options > .button, [data-reveal]")].some((button) => !button.disabled);
    if (open || !quiz.dataset.check) return;
    // Gates: once the quiz is answered, other parts of the page show, hide, unlock or press.
    const gated = (attr) => document.querySelectorAll(`[${attr}="${CSS.escape(quiz.dataset.check)}"]`);
    for (const el of gated("data-gate")) el.hidden = false;
    for (const el of gated("data-gate-hide")) el.hidden = true;
    for (const el of gated("data-gate-enable")) el.disabled = false;
    for (const el of gated("data-gate-press")) el.click();
  }
  function answer(option) {
    const box = option.closest(".quiz-item, .quiz");
    const right = option.hasAttribute("data-correct");
    for (const button of option.parentNode.children) {
      button.disabled = true;
      if (button.hasAttribute("data-correct")) button.classList.add("is-right");
      else if (button === option) button.classList.add("is-wrong");
    }
    // Colour never carries the result alone: the verdict says it in words.
    const verdict = box.querySelector(".verdict");
    if (verdict) verdict.textContent = "Your answer: " + option.textContent.trim() + ". " + (right ? "Correct." : "Not quite.");
    finish(box);
  }

  // Bound inputs: the value becomes a custom property the figure's marks read.
  function bind(input) {
    const name = input.dataset.bind;
    const scope = (input.dataset.bindTo && document.querySelector(input.dataset.bindTo))
      || input.closest(".panel, figure, .slide, .callout") || document.documentElement;
    scope.style.setProperty(name, input.value);
    for (const out of scope.querySelectorAll(`[data-show="${CSS.escape(name)}"]`)) {
      out.textContent = Number(input.value).toLocaleString("en-US");
    }
  }
  for (const input of document.querySelectorAll("input[data-bind]")) bind(input);
  document.addEventListener("input", (e) => {
    const input = e.target.closest("input");
    if (!input) return;
    if (input.dataset.bind) bind(input);
    if (input.hasAttribute("data-go") && input.closest(".stepper")) setStep(input.closest(".stepper"), input.value);
  });

  // A toast: the callout inside <template id="…"> shows at the window's bottom
  // right, and leaves after four seconds or on a click.
  function toast(button) {
    const template = document.getElementById(button.dataset.toast);
    const note = template && template.content.firstElementChild;
    if (!note) return;
    let stack = document.querySelector(".toasts");
    if (!stack) {
      stack = document.createElement("div");
      stack.className = "toasts";
      stack.setAttribute("role", "status");
      document.body.append(stack);
    }
    const shown = stack.appendChild(note.cloneNode(true));
    setTimeout(() => shown.remove(), Number(button.dataset.toastMs) || 4000);
  }

  document.addEventListener("click", (e) => {
    // A menu shuts on a pick and on a click anywhere outside it.
    for (const menu of document.querySelectorAll("details.menu[open]")) {
      if (!menu.contains(e.target) || e.target.closest(".menu-item")) menu.open = false;
    }
    const opener = e.target.closest("[data-open]");
    if (opener) {
      const dialog = document.querySelector(opener.dataset.open);
      if (dialog && dialog.showModal) dialog.showModal();
      return;
    }
    // A dialog shuts on its own buttons and on a click on the page behind it.
    const closer = e.target.closest("dialog [data-close]") || (e.target.matches("dialog.panel") && e.target);
    if (closer) return closer.closest("dialog").close();
    const toaster = e.target.closest("[data-toast]");
    if (toaster) return toast(toaster);
    const shown = e.target.closest(".toasts > *");
    if (shown) return shown.remove();
    const tab = e.target.closest(".tab[data-tab]");
    if (tab) return pickTab(tab);
    const th = e.target.closest("table.sortable thead th");
    if (th) return sortBy(th);
    const go = e.target.closest("button[data-go]");
    if (go && go.closest(".stepper")) return setStep(go.closest(".stepper"), go.dataset.go);
    const option = e.target.closest(".quiz .options > .button");
    if (option) return answer(option);
    const reveal = e.target.closest(".quiz [data-reveal]");
    if (reveal) {
      reveal.disabled = true;
      finish(reveal.closest(".quiz-item, .quiz"));
    }
  });

  // Contents rail: light the chapter being read, and fill the bar as the page scrolls.
  const rail = document.querySelector(".rail");
  if (rail) {
    const chapters = [...rail.querySelectorAll('a[href^="#"]')]
      .map((link) => [link, document.getElementById(decodeURIComponent(link.hash.slice(1)))])
      .filter(([, target]) => target);
    const bar = rail.querySelector(".bar");
    let queued = false;
    const update = () => {
      queued = false;
      // The chapter being read is the last one whose heading has passed the top third.
      let current = null;
      for (const [link, target] of chapters) {
        if (target.getBoundingClientRect().top <= innerHeight / 3) current = link;
      }
      for (const [link] of chapters) {
        if (link === current) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      }
      const room = document.documentElement.scrollHeight - innerHeight;
      if (bar) bar.style.setProperty("--v", room > 0 ? Math.round((scrollY / room) * 100) : 0);
    };
    const queue = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    };
    addEventListener("scroll", queue, { passive: true });
    addEventListener("resize", queue);
    update();
  }

  // Paper cannot open a disclosure: print every one open, then close them again.
  let opened = [];
  addEventListener("beforeprint", () => {
    opened = [...document.querySelectorAll("details.more:not([open])")];
    for (const more of opened) more.open = true;
  });
  addEventListener("afterprint", () => {
    for (const more of opened) more.open = false;
  });

  // A deck (.deck on the page). The slide nearest the middle of the window is
  // the current one; style.css darkens the rest. Arrow keys, Page Up/Down,
  // Space and a click step through it. Opt-in, so a report that shows one
  // slide keeps its keys.
  const deck = document.querySelector(".deck");
  const slides = deck ? [...deck.querySelectorAll(":scope > .slide")] : [];
  if (slides.length) {
    // Builds: a slide's [data-build] pieces arrive one step at a time, in the
    // order written. data-build="with" joins the step before it, and a number
    // names the step outright. A piece that holds pieces arrives with its
    // first one, so a box never shows empty.
    // A popup (.popup) is a piece that opens over the slide and holds pieces
    // of its own. It has a title, so its first piece waits for its own step;
    // and after its last piece comes one more step, which shuts it.
    const stepsOf = (slide) => {
      const found = new Map();
      let n = 0;
      for (const el of slide.querySelectorAll("[data-build]")) {
        const box = el.parentElement.closest("[data-build]");
        const leads = box && slide.contains(box) && !box.matches(".popup") && box.querySelector("[data-build]") === el;
        const given = el.dataset.build;
        if (/^\d+$/.test(given)) n = Number(given);
        else if (!(given === "with" || leads) || n === 0) n += 1;
        if (!found.has(n)) found.set(n, []);
        found.get(n).push(el);
      }
      const steps = [...found.keys()].sort((a, b) => a - b).map((key) => ({ show: found.get(key), shut: null }));
      for (const popup of slide.querySelectorAll(".popup[data-build]")) {
        const last = steps.findLastIndex((step) => step.show.some((el) => popup.contains(el)));
        steps.splice(last + 1, 0, { show: [], shut: popup });
      }
      return steps;
    };
    const builds = new Map(slides.map((slide) => [slide, { steps: stepsOf(slide), done: 0 }]));
    deck.classList.add("is-live");

    let at = -1;
    function setCurrent(i) {
      if (i === at) return;
      at = i;
      slides.forEach((slide, n) => slide.classList.toggle("is-current", n === i));
      // Marks wait for their slide to be current; once seen they stay drawn.
      slides[i].classList.add("is-seen");
    }
    const nearest = () => {
      const mid = innerHeight / 2;
      const off = (slide) => {
        const box = slide.getBoundingClientRect();
        return Math.abs((box.top + box.bottom) / 2 - mid);
      };
      return slides.reduce((best, slide, i) => (off(slide) < off(slides[best]) ? i : best), 0);
    };

    // While the page glides to a slide the target stays current: the slides it
    // passes would light up one after another otherwise.
    let gliding = 0;
    function go(i) {
      setCurrent(i);
      const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
      clearTimeout(gliding);
      gliding = setTimeout(() => { gliding = 0; }, 1000);
      slides[i].scrollIntoView({ block: "center", behavior: calm ? "auto" : "smooth" });
    }
    addEventListener("scrollend", () => {
      clearTimeout(gliding);
      gliding = 0;
    });
    let queued = false;
    const follow = () => {
      if (queued || gliding) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        if (!gliding) setCurrent(nearest());
      });
    };
    addEventListener("scroll", follow, { passive: true });
    addEventListener("resize", follow);
    setCurrent(nearest());

    // Nothing on a slide just appears: every part of a piece grows in, the way
    // a bar fills. What grows depends on the part.
    //   A framed box widens from its left edge with its frame whole: a clip
    //   holds the box to its width so far, and a rule drawn at the clip's edge
    //   stands in for the right border until the real one is reached. What the
    //   box holds arrives with it. A frame that widened over text already
    //   written passed it at once and then grew over nothing.
    //   In a piece with no frame, each framed part widens on its own: a bar's
    //   track, a swatch, a tag. An underline grows from its left end, a glyph
    //   and any other shape from its left edge, and a straight rule in a chart
    //   is traced from its start.
    //   Text is written a character at a time, and a value counts up.
    // Data marks, and the marker and rule of a timeline, are grown by
    // style.css. No part moves, scales or fades in, so text stays on whole
    // pixels.
    const MARKS = ".bar-fill, .col-fill, .line:not(.ghost), .dot, .pie-slice";
    const VALUES = ".stat-value, .meter-value, .col-value";
    const PAD = 24; // The clip's reach past the box: room for a title on the top border, and for outlines.
    // Growth takes --t-slow with the bars' easing. The tokens are read as each
    // piece arrives, so a page may change the speed while the deck runs.
    const tokens = getComputedStyle(document.documentElement);
    let timing = null;
    const pace = () => {
      const slow = tokens.getPropertyValue("--t-slow").trim();
      return {
        duration: (parseFloat(slow) || 480) * (/[^m]s$/.test(slow) ? 1000 : 1),
        easing: tokens.getPropertyValue("--ease").trim() || "ease-out",
      };
    };
    const growing = new Map();

    // Each growth below starts at once and returns a function that stops it
    // and leaves the part as it will be in the end.
    function play(node, frames, after, time = timing) {
      const run = node.animate(frames, time);
      let over = false;
      const end = () => {
        if (over) return;
        over = true;
        if (after) after();
      };
      run.finished.then(end, end);
      return () => {
        run.cancel();
        end();
      };
    }
    const veil = (right) => `inset(${-PAD}px ${right} ${-PAD}px ${-PAD}px)`;
    const unveil = (node) => play(node, { clipPath: [veil(`calc(100% + ${PAD}px)`), veil(`${-PAD}px`)] });
    // A rule that stands in for a border while its part grows. It is laid in
    // the box the part is placed against, not over the slide: when that box is
    // growing too, its clip holds the rule, so nothing pokes past its edge.
    function standIn(node, slide, box, flat) {
      const frame = node.offsetParent || slide;
      const home = frame.getBoundingClientRect();
      const rule = document.createElement("span");
      rule.className = "build-edge";
      rule.style.left = box.left - home.left - frame.clientLeft + "px";
      rule.style.top = (flat ? box.bottom - 1 : box.top) - home.top - frame.clientTop + "px";
      rule.style.height = (flat ? 1 : box.height) + "px";
      frame.append(rule);
      return rule;
    }
    function widen(node, slide) {
      // The rule sits on the last column the clip shows, so the box always
      // has a right border. A box that is not there yet has a dashed one.
      const box = node.getBoundingClientRect();
      const edge = standIn(node, slide, box, false);
      if (node.matches(".ghost")) edge.classList.add("ghost");
      const left = parseFloat(edge.style.left);
      edge.animate({ left: [left - 1 + "px", left + box.width - 1 + "px"] }, timing);
      return play(node, { clipPath: [veil(box.width + "px"), veil("0px")] }, () => edge.remove());
    }
    // A ruled edge, above or below a part with no frame, grows from its left end.
    function underline(node, slide, side) {
      const box = node.getBoundingClientRect();
      const rule = standIn(node, slide, box, true);
      if (side === "Top") rule.style.top = parseFloat(rule.style.top) - box.height + 1 + "px";
      node.style[`border${side}Color`] = "transparent";
      return play(rule, { width: ["0px", box.width + "px"] }, () => {
        rule.remove();
        node.style[`border${side}Color`] = "";
      });
    }
    function trace(line) {
      const length = line.getTotalLength();
      return play(line, { strokeDasharray: [`${length} ${length}`, `${length} ${length}`], strokeDashoffset: [length, 0] });
    }

    // Text is written for real. Each text node holds the characters so far and
    // the rest wait behind it in a hidden span, so every line breaks where it
    // will in the end and no character is ever cut. A clip stepping from one
    // character's edge to the next was tried first: it cut the outline of big
    // text. Writing runs at a steady pace, as typing does.
    function write(el, duration, counted, wait = 0) {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const parts = [];
      let total = 0;
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        // A piece inside this one is written on its own click; a number that
        // counts up is not written.
        if (node.parentElement.closest("[data-build]") !== el || !node.data.trim()) continue;
        if (counted.some((value) => value.contains(node))) continue;
        parts.push({ node, text: node.data, from: total });
        total += node.data.length;
      }
      if (!total) return null;
      for (const part of parts) {
        // In a chart the text still to come waits in a tspan, so a label
        // anchored at its middle or end stays where it is.
        const svg = part.node.parentNode instanceof SVGElement;
        part.rest = svg ? document.createElementNS("http://www.w3.org/2000/svg", "tspan") : document.createElement("span");
        part.rest.setAttribute("class", "unwritten");
        part.rest.textContent = part.text;
        part.node.data = "";
        part.node.after(part.rest);
      }
      let frame = 0;
      const began = performance.now() + wait;
      const stop = () => {
        cancelAnimationFrame(frame);
        for (const part of parts) {
          part.node.data = part.text;
          part.rest.remove();
        }
      };
      const tick = (now) => {
        const count = Math.ceil(((now - began) / duration) * total);
        if (count >= total) return stop();
        for (const part of parts) {
          const n = Math.max(0, Math.min(part.text.length, count - part.from));
          if (part.node.data.length === n) continue;
          part.node.data = part.text.slice(0, n);
          part.rest.textContent = part.text.slice(n);
        }
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
      return stop;
    }

    // A value climbs from zero to its figure and settles as a bar does, the
    // way a meter ticks up. Only the first number moves: the unit, a second
    // number and any sign stay put. Returns null for a value with no number,
    // or one that holds more than text; that one is written instead.
    function count(el, duration, wait = 0) {
      const text = el.textContent;
      const found = el.children.length ? null : text.match(/^(\D*?)(\d[\d,]*(?:\.\d+)?)([\s\S]*)$/);
      if (!found) return null;
      const [, before, number, after] = found;
      const goal = Number(number.replace(/,/g, ""));
      const places = (number.split(".")[1] || "").length;
      const show = (value) => (number.includes(",")
        ? value.toLocaleString("en-US", { minimumFractionDigits: places, maximumFractionDigits: places })
        : value.toFixed(places));
      let frame = 0;
      const began = performance.now() + wait;
      const stop = () => {
        cancelAnimationFrame(frame);
        el.textContent = text;
      };
      const tick = (now) => {
        const p = Math.max(0, (now - began) / duration);
        if (p >= 1) return stop();
        el.textContent = before + show(goal * (1 - Math.pow(1 - p, 3))) + after;
        frame = requestAnimationFrame(tick);
      };
      tick(began - wait);
      return stop;
    }

    // A data mark draws through style.css, and a CSS animation plays once: a
    // piece taken away and built again showed its line or bar already drawn.
    // Dropping the animation for one style pass and giving it back starts a
    // new one, so a mark draws every time its piece arrives.
    const DRAWN = ".bar-fill, .col, .col-fill, .line, .dot, .pie-slice";
    function redraw(els) {
      const marks = [];
      for (const el of els) {
        for (const node of [el, ...el.querySelectorAll(DRAWN)]) {
          if (node.matches(DRAWN) && node.closest("[data-build]") === el) marks.push(node);
        }
        // A line that is a piece itself: its ink copy sits just before it.
        const ink = el.previousElementSibling;
        if (ink && ink.matches(".ink")) marks.push(ink);
      }
      if (!marks.length) return;
      for (const mark of marks) mark.style.animation = "none";
      marks[0].getBoundingClientRect();
      for (const mark of marks) mark.style.animation = "";
    }

    const framed = (node) => {
      if (!(node instanceof HTMLElement)) return false;
      const style = getComputedStyle(node);
      return parseFloat(style.borderLeftWidth) > 0 && parseFloat(style.borderRightWidth) > 0;
    };
    function grow(el) {
      if (!el.animate || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (el.matches(MARKS)) return;
      timing = pace();
      const slide = el.closest(".slide");
      // A piece inside this one grows on its own click; a data mark draws itself.
      const parts = [el, ...el.querySelectorAll("*")].filter((node) => node.closest("[data-build]") === el && !node.matches(MARKS));
      const stops = [];
      // A popup's frame pops once its wire has arrived; what it holds waits
      // for the frame.
      let wait = 0;
      if (el.matches(".popup")) {
        const [stopPopping, lead] = pop(el, slide);
        stops.push(stopPopping);
        wait = lead;
      } else if (framed(el)) {
        stops.push(widen(el, slide));
      } else {
        // What a growing part holds arrives with it.
        const grown = [];
        for (const node of parts) {
          if (grown.some((part) => part.contains(node))) continue;
          if (node instanceof SVGElement) {
            if (!(node instanceof SVGGeometryElement)) continue;
            const size = node.getBBox();
            // A clip cannot grow a rule with no width or height; a dash can.
            // A dashed rule keeps its dashes and takes the clip.
            const bare = node.localName === "line" && !(size.width && size.height) && !node.matches(".target, .ghost");
            stops.push(bare ? trace(node) : unveil(node));
          } else if (framed(node)) {
            grown.push(node);
            stops.push(widen(node, slide));
          } else if (node.matches(".glyph")) {
            grown.push(node);
            stops.push(unveil(node));
          } else {
            const style = getComputedStyle(node);
            for (const side of ["Top", "Bottom"]) {
              if (parseFloat(style[`border${side}Width`]) > 0) stops.push(underline(node, slide, side));
            }
          }
        }
      }
      const counted = [];
      for (const value of parts) {
        const stopCounting = value.matches(VALUES) && count(value, timing.duration, wait);
        if (!stopCounting) continue;
        counted.push(value);
        stops.push(stopCounting);
      }
      const stopWriting = write(el, timing.duration, counted, wait);
      if (stopWriting) stops.push(stopWriting);
      // A piece with no text and no part of its own, such as an arrow, grows
      // from its left end.
      if (!stops.length) stops.push(unveil(el));
      growing.set(el, () => {
        for (const stop of stops) stop();
      });
    }

    // A popup explains the piece written just before it, and a wire ties the
    // two: from that piece to the popup's nearest side, in horizontal and
    // vertical runs only. A popup laid over its piece gets no wire.
    // The popup opens in two beats. First the wire is traced from the piece.
    // Then the frame pops out of the wire's end: it grows from that point in
    // every direction at once, its border whole, in half of --t-slow. A frame
    // widening from its left edge, as other boxes do, was tried first: it
    // read as one more box on the slide, not as something popping up over it.
    // The wire's beat grows with its length, up to the other half of
    // --t-slow at 400px: a short wire given a full beat left a dead pause
    // before the pop. Shutting runs the two beats backwards.
    const wires = new Map();
    const calm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dash = (length, from, to) => ({ strokeDasharray: [`${length} ${length}`, `${length} ${length}`], strokeDashoffset: [from, to] });
    const beat = (length) => timing.duration * Math.min(0.5, length / 400);
    function untie(popup, traced) {
      const wire = wires.get(popup);
      if (!wire) return;
      wires.delete(popup);
      const path = wire.svg.firstChild;
      if (!traced || !path.animate || calm()) return wire.svg.remove();
      const gone = () => wire.svg.remove();
      const length = path.getTotalLength();
      path.animate(dash(length, 0, length), { duration: beat(length), delay: timing.duration / 2, easing: timing.easing }).finished.then(gone, gone);
    }
    // Returns the point where the wire meets the popup, in the popup's own
    // box, and how long the wire takes to get there; with no wire, the
    // popup's middle and no wait.
    function tie(popup, traced) {
      untie(popup, false);
      const slide = popup.closest(".slide");
      const home = slide.getBoundingClientRect();
      const placed = (node) => {
        const box = node.getBoundingClientRect();
        const [x, y] = [home.left + slide.clientLeft, home.top + slide.clientTop];
        return { left: Math.round(box.left - x), right: Math.round(box.right - x), top: Math.round(box.top - y), bottom: Math.round(box.bottom - y) };
      };
      const p = placed(popup);
      const middle = { x: (p.right - p.left) / 2, y: (p.bottom - p.top) / 2 };
      const subject = popup.previousElementSibling;
      if (!subject) return { meets: middle, wait: 0 };
      const s = placed(subject);
      const [sx, sy] = [Math.round((s.left + s.right) / 2), Math.round((s.top + s.bottom) / 2)];
      const within = (value, low, high) => Math.max(low, Math.min(high, value));
      let d = "";
      let end = null;
      if (s.left >= p.right && sy >= p.top && sy <= p.bottom) {
        d = `M${s.left} ${sy} H${p.right}`;
        end = { x: p.right, y: sy };
      } else if (sx > p.right) {
        const y = within(sy, p.top + 12, p.bottom - 12);
        d = `M${sx} ${sy < y ? s.bottom : s.top} V${y} H${p.right}`;
        end = { x: p.right, y };
      } else if (s.top >= p.bottom) {
        const x = within(sx, p.left + 12, p.right - 12);
        d = `M${x} ${s.top} V${p.bottom}`;
        end = { x, y: p.bottom };
      }
      if (!d) return { meets: middle, wait: 0 };
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      svg.setAttribute("class", "popup-wire");
      svg.setAttribute("aria-hidden", "true");
      path.setAttribute("d", d);
      svg.append(path);
      slide.append(svg);
      const meets = { x: end.x - p.left, y: end.y - p.top };
      wires.set(popup, { svg, meets });
      const length = path.getTotalLength();
      const wait = traced && path.animate && !calm() ? beat(length) : 0;
      if (wait) path.animate(dash(length, length, 0), { duration: wait, easing: timing.easing });
      return { meets, wait };
    }
    // The frame between a point in the popup and the popup's whole box: a
    // clip holds the popup to the box so far, and a hollow frame laid over
    // the slide is its border meanwhile.
    function burst(popup, slide, from, wait, after) {
      const opening = !after;
      const box = popup.getBoundingClientRect();
      const home = slide.getBoundingClientRect();
      const [left, top] = [box.left - home.left - slide.clientLeft, box.top - home.top - slide.clientTop];
      const half = timing.duration / 2;
      // Shutting holds its last frame, so the popup does not flash whole before it is marked shut.
      const time = { duration: half, delay: wait, easing: timing.easing, fill: opening ? "backwards" : "both" };
      const point = { left: left + from.x + "px", top: top + from.y + "px", width: "0px", height: "0px", visibility: "visible" };
      const whole = { left: left + "px", top: top + "px", width: box.width + "px", height: box.height + "px", visibility: "visible" };
      const shut = `inset(${from.y}px ${box.width - from.x}px ${box.height - from.y}px ${from.x}px)`;
      const frame = document.createElement("span");
      frame.className = "build-frame";
      slide.append(frame);
      frame.animate(opening ? [point, whole] : [whole, point], { ...time, fill: "none" });
      return play(popup, { clipPath: opening ? [shut, "inset(0px)"] : ["inset(0px)", shut] }, () => {
        frame.remove();
        if (after) after();
      }, time);
    }
    // Returns the function that stops the pop, and the wait before the frame shows.
    function pop(popup, slide) {
      const { meets, wait } = tie(popup, true);
      return [burst(popup, slide, meets, wait), wait];
    }
    function shut(popup) {
      if (!popup.animate || calm()) return popup.classList.add("is-shut");
      timing = pace();
      const wire = wires.get(popup);
      const box = popup.getBoundingClientRect();
      const from = wire ? wire.meets : { x: box.width / 2, y: box.height / 2 };
      growing.set(popup, burst(popup, popup.closest(".slide"), from, 0, () => popup.classList.add("is-shut")));
    }

    // Forward builds the current slide's next step, then moves on. Back takes
    // the last step away, then returns to the slide before, left as it was.
    function step(by) {
      const { steps, done } = builds.get(slides[at]);
      if (by > 0 && done < steps.length) {
        const { show, shut: popup } = steps[done];
        if (popup) {
          shut(popup);
          untie(popup, true);
        }
        for (const el of show) el.classList.add("is-built");
        redraw(show);
        for (const el of show) grow(el);
        builds.get(slides[at]).done = done + 1;
      } else if (by < 0 && done > 0) {
        const { show, shut: popup } = steps[done - 1];
        // Back over the step that shut a popup opens it again, whole.
        if (popup) {
          if (growing.has(popup)) growing.get(popup)();
          popup.classList.remove("is-shut");
          tie(popup, false);
        }
        for (const el of show) {
          if (growing.has(el)) growing.get(el)();
          if (el.matches(".popup")) untie(el, false);
          el.classList.remove("is-built", "is-shut");
        }
        builds.get(slides[at]).done = done - 1;
      } else {
        const next = Math.max(0, Math.min(slides.length - 1, at + by));
        if (next !== at) go(next);
      }
    }

    const KEYS = { ArrowRight: 1, ArrowDown: 1, PageDown: 1, " ": 1, ArrowLeft: -1, ArrowUp: -1, PageUp: -1 };
    addEventListener("keydown", (e) => {
      const by = KEYS[e.key];
      if (!by || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target.closest("input, textarea, select, button, [contenteditable]")) return;
      e.preventDefault();
      step(by);
    });
    // A click on the current slide steps forward; a click on another goes to
    // it. Controls keep their clicks, and so does a text selection.
    deck.addEventListener("click", (e) => {
      const slide = e.target.closest(".deck > .slide");
      if (!slide || e.target.closest("a, button, input, select, textarea, label, summary")) return;
      if (String(getSelection())) return;
      const i = slides.indexOf(slide);
      if (i === at) step(1);
      else go(i);
    });
  }
})();
