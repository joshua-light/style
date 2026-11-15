/* style.js — hover tooltips, linked highlighting, reveal on scroll, tabs,
   sortable tables, steppers, quizzes, bound sliders, the contents rail, and
   stepping through a deck.

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
   a click of a head. Under .deck, arrow keys step from slide to slide.

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

   scripts/build.py inlines this file. */
(() => {
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

  document.addEventListener("click", (e) => {
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

  // A deck (.deck on the page): arrow keys, Page Up/Down and Space step from
  // slide to slide. Opt-in, so a report that shows one slide keeps its keys.
  const slides = [...document.querySelectorAll(".deck > .slide")];
  if (slides.length > 1) {
    const STEP = { ArrowRight: 1, ArrowDown: 1, PageDown: 1, " ": 1, ArrowLeft: -1, ArrowUp: -1, PageUp: -1 };
    addEventListener("keydown", (e) => {
      const step = STEP[e.key];
      if (!step || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target.closest("input, textarea, select, button, [contenteditable]")) return;
      e.preventDefault();
      // The slide nearest the middle of the window is the current one.
      const mid = innerHeight / 2;
      const off = (slide) => {
        const box = slide.getBoundingClientRect();
        return Math.abs((box.top + box.bottom) / 2 - mid);
      };
      const at = slides.reduce((best, slide, i) => (off(slide) < off(slides[best]) ? i : best), 0);
      const next = slides[Math.max(0, Math.min(slides.length - 1, at + step))];
      const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
      next.scrollIntoView({ block: "center", behavior: calm ? "auto" : "smooth" });
    });
  }
})();
