/* style.js — hover tooltips, linked highlighting, reveal on scroll, tabs,
   sortable tables, and stepping through a deck.

   data-tip="Title" on any element shows a tooltip while the pointer is over
   it. data-tip-value adds a value at the right of the title; data-tip-note
   adds a dim line under it. The tooltip shows a swatch in the mark's --fill.

   data-key="name" links elements inside one panel: hovering one gives every
   element with the same key the class is-hot, so a slice and its legend row
   light up together. style.css dims the siblings.

   Inside .anim, data animations wait until their panel scrolls into view:
   this script holds them paused (html.js-reveal) and adds in-view to each
   panel, slide, or figure the first time a fifth of it is visible. Without
   the script everything plays on load.

   .tab[data-tab] shows the matching [data-tab-panel]. table.sortable sorts on
   a click of a head. Under .deck, arrow keys step from slide to slide.

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
    const scope = el.closest(".panel, figure, .slide") || document;
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

  document.addEventListener("click", (e) => {
    const tab = e.target.closest(".tab[data-tab]");
    if (tab) return pickTab(tab);
    const th = e.target.closest("table.sortable thead th");
    if (th) sortBy(th);
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
