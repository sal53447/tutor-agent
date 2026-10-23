// Stepper block: an animated step-through of a mechanism, driven by declarative JSON so authors
// write states, not animation code.
//
// <section class="block" data-block="stepper" id="1f-04" data-kind="queue">
//   <p>intro (kept)</p>
//   <script type="application/json">{
//     "code": "console.log(1);\nsetTimeout(...)",          // optional; shown with the active line highlighted
//     "steps": [ { "label": "short title", "note": "what just happened (HTML ok)", "line": 1, "state": { … } } ]
//   }</script>
// </section>
//
// State shapes by kind:
//   queue    { "stack": ["main()"], "micro": [], "macro": [], "pending": [], "output": [] }   — the event loop
//   chain    { "nodes": [{ "id": "a", "label": "obj", "fields": ["x: 1"] }], "edges": [["a","b","[[Prototype]]"]], "active": ["a"] }
//   timeline { "lanes": [{ "name": "Server", "items": [{ "label": "render RSC", "state": "active|done|idle" }] }] }
//   array    { "cells": [1, 3, 5], "pointers": { "lo": 0, "hi": 2 }, "window": [0, 2], "mark": [1], "vars": { "target": 5 } }
//
// Pure render functions are exported for tests; mount() wires controls and keyboard.

import { h, blockJSON, esc } from "../ui.js";
import { recordBlock } from "../progress.js";

const SVG = "http://www.w3.org/2000/svg";
function s(tag, attrs = {}, ...children) {
  const el = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) el.setAttribute(k, v);
  for (const c of children.flat()) if (c != null) el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  return el;
}
function text(x, y, str, cls = "", anchor = "start") {
  return s("text", { x, y, class: "st-text " + cls, "text-anchor": anchor, "dominant-baseline": "middle" }, str);
}
function box(x, y, w, hh, label, cls = "") {
  return s("g", { class: "st-box " + cls },
    s("rect", { x, y, width: w, height: hh, rx: 6 }),
    text(x + w / 2, y + hh / 2, label, "", "middle"));
}

function sameSet(prev, cur) { return JSON.stringify(prev) === JSON.stringify(cur); }

// --- Renderers. Each returns an <svg>. `prev` is the previous step's state, used to flag new items.

export function renderQueue(state, prev = {}) {
  const W = 760, H = 300, colW = 150, gap = 24, top = 40;
  const svg = s("svg", { viewBox: `0 0 ${W} ${H}`, class: "st-svg st-queue" });
  const cols = [
    ["stack", "Call stack", "bottom"], ["pending", "Web APIs / timers", "top"],
    ["micro", "Microtasks", "top"], ["macro", "Macrotasks", "top"],
  ];
  cols.forEach(([key, title, dir], i) => {
    const x = 16 + i * (colW + gap);
    svg.appendChild(text(x + colW / 2, 18, title, "st-title", "middle"));
    svg.appendChild(s("rect", { x, y: top, width: colW, height: H - top - 70, class: "st-col" }));
    const items = state[key] || [];
    const wasThere = new Set(prev[key] || []);
    items.forEach((label, j) => {
      const y = dir === "bottom" ? H - 70 - 34 * (j + 1) - 6 : top + 8 + 34 * j;
      svg.appendChild(box(x + 8, y, colW - 16, 28, label, wasThere.has(label) ? "" : "new"));
    });
  });
  svg.appendChild(text(16, H - 46, "Output:", "st-title"));
  const out = (state.output || []).join("  ");
  const prevOut = (prev.output || []).join("  ");
  svg.appendChild(text(84, H - 46, out, prevOut === out ? "st-out" : "st-out new"));
  return svg;
}

export function renderChain(state, prev = {}) {
  const nodes = state.nodes || [], edges = state.edges || [];
  const active = new Set(state.active || []);
  const W = 760, nodeW = 220, lineH = 20;
  let y = 16;
  const pos = {};
  const svg = s("svg", { viewBox: `0 0 ${W} 10`, class: "st-svg st-chain" });
  const defs = s("defs", {}, s("marker", { id: "arrow", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 8, markerHeight: 8, orient: "auto-start-reverse" },
    s("path", { d: "M0,0 L10,5 L0,10 z", class: "st-arrow" })));
  svg.appendChild(defs);
  const prevIds = new Set((prev.nodes || []).map(n => n.id));
  // Lay nodes out in columns of at most 4, top-to-bottom then next column.
  const perCol = Math.max(1, Math.ceil(nodes.length / Math.ceil(nodes.length / 4 || 1)));
  const colX = (c) => 16 + c * (nodeW + 60);
  let maxY = 0;
  nodes.forEach((n, i) => {
    const col = Math.floor(i / perCol), row = i % perCol;
    const fields = n.fields || [];
    const hh = 30 + fields.length * lineH;
    if (row === 0) y = 16;
    const x = colX(col);
    pos[n.id] = { x, y, w: nodeW, h: hh };
    const g = s("g", { class: "st-node" + (active.has(n.id) ? " active" : "") + (prevIds.has(n.id) ? "" : " new") });
    g.appendChild(s("rect", { x, y, width: nodeW, height: hh, rx: 6 }));
    g.appendChild(text(x + 10, y + 15, n.label, "st-label"));
    fields.forEach((f, j) => g.appendChild(text(x + 14, y + 30 + j * lineH + 6, f, "st-field")));
    svg.appendChild(g);
    y += hh + 36;
    maxY = Math.max(maxY, y);
  });
  edges.forEach(([from, to, label]) => {
    const a = pos[from], b = pos[to];
    if (!a || !b) return;
    let d, lx, ly;
    if (a.x === b.x) { // vertical
      const down = b.y > a.y;
      const x = a.x + a.w / 2;
      const y1 = down ? a.y + a.h : a.y, y2 = down ? b.y : b.y + b.h;
      d = `M${x},${y1} L${x},${y2}`; lx = x + 8; ly = (y1 + y2) / 2;
    } else {
      const x1 = a.x + a.w, y1 = a.y + a.h / 2, x2 = b.x, y2 = b.y + b.h / 2;
      d = `M${x1},${y1} C${x1 + 30},${y1} ${x2 - 30},${y2} ${x2},${y2}`; lx = (x1 + x2) / 2; ly = (y1 + y2) / 2 - 8;
    }
    svg.appendChild(s("path", { d, class: "st-edge", "marker-end": "url(#arrow)" }));
    if (label) svg.appendChild(text(lx, ly, label, "st-edge-label", a.x === b.x ? "start" : "middle"));
  });
  svg.setAttribute("viewBox", `0 0 ${W} ${Math.max(maxY, 60)}`);
  return svg;
}

export function renderTimeline(state, prev = {}) {
  const lanes = state.lanes || [];
  const W = 760, laneH = 56, labelW = 110, itemW = 118, gap = 10;
  const H = 16 + lanes.length * laneH;
  const svg = s("svg", { viewBox: `0 0 ${W} ${H}`, class: "st-svg st-timeline" });
  lanes.forEach((lane, i) => {
    const y = 8 + i * laneH;
    svg.appendChild(s("rect", { x: 0, y, width: W, height: laneH - 6, class: "st-lane" }));
    svg.appendChild(text(10, y + (laneH - 6) / 2, lane.name, "st-title"));
    const prevItems = new Map(((prev.lanes || [])[i]?.items || []).map(it => [it.label, it.state]));
    (lane.items || []).forEach((it, j) => {
      const x = labelW + j * (itemW + gap);
      const cls = (it.state || "idle") + (prevItems.get(it.label) === it.state ? "" : " new");
      svg.appendChild(box(x, y + 10, itemW, laneH - 26, it.label, cls));
    });
  });
  return svg;
}

export function renderArray(state, prev = {}) {
  const cells = state.cells || [];
  // A pointer may sit one past the end (an exclusive `hi`, an insertion point): draw a ghost slot there.
  const pastEnd = Object.values(state.pointers || {}).some(i => i === cells.length);
  const n = Math.max(cells.length + (pastEnd ? 1 : 0), 1);
  const W = 760, cellW = Math.min(56, Math.floor((W - 32) / n)), cellH = 40;
  const x0 = Math.round((W - cellW * n) / 2);
  const ptrs = Object.entries(state.pointers || {}).filter(([, i]) => Number.isInteger(i));
  // Pointers on the same index stack upwards so "lo" and "mid" can share a cell.
  const stackAt = {};
  const ptrRows = ptrs.map(([name, i]) => [name, i, (stackAt[i] = (stackAt[i] ?? -1) + 1)]);
  const ptrH = 18 * Math.max(1, ...ptrRows.map(([, , k]) => k + 1)) + 14;
  const top = 8 + ptrH;
  const vars = Object.entries(state.vars || {});
  const H = top + cellH + 26 + (vars.length ? 30 : 0);
  const svg = s("svg", { viewBox: `0 0 ${W} ${H}`, class: "st-svg st-array" });
  const [wlo, whi] = Array.isArray(state.window) ? state.window : [0, cells.length - 1];
  const mark = new Set(state.mark || []);
  const prevPtr = prev.pointers || {};
  cells.forEach((v, i) => {
    const x = x0 + i * cellW;
    const changed = prev.cells && JSON.stringify(prev.cells[i]) !== JSON.stringify(v);
    const cls = "st-cell" + (i < wlo || i > whi ? " out" : "") + (mark.has(i) ? " mark" : "") + (changed ? " new" : "");
    svg.appendChild(s("g", { class: cls },
      s("rect", { x: x + 2, y: top, width: cellW - 4, height: cellH, rx: 5 }),
      text(x + cellW / 2, top + cellH / 2, String(v), "", "middle")));
    svg.appendChild(text(x + cellW / 2, top + cellH + 14, String(i), "st-index", "middle"));
  });
  if (pastEnd) {
    const x = x0 + cells.length * cellW;
    svg.appendChild(s("rect", { x: x + 2, y: top, width: cellW - 4, height: cellH, rx: 5, class: "st-ghost" }));
    svg.appendChild(text(x + cellW / 2, top + cellH + 14, String(cells.length), "st-index", "middle"));
  }
  ptrRows.forEach(([name, i, k]) => {
    const cx = x0 + i * cellW + cellW / 2, y = top - 8 - k * 18;
    const moved = prevPtr[name] !== i;
    svg.appendChild(s("g", { class: "st-ptr" + (moved ? " new" : "") },
      text(cx, y - 6, name, "st-ptr-label", "middle"),
      s("path", { d: `M${cx},${y} L${cx},${top - 2}`, class: "st-edge" })));
  });
  if (vars.length) {
    const line = vars.map(([k, v]) => `${k} = ${typeof v === "string" ? v : JSON.stringify(v)}`).join("    ");
    const prevLine = Object.entries(prev.vars || {}).map(([k, v]) => `${k} = ${typeof v === "string" ? v : JSON.stringify(v)}`).join("    ");
    svg.appendChild(text(16, H - 14, line, prevLine === line ? "st-out" : "st-out new"));
  }
  return svg;
}

export const RENDERERS = { queue: renderQueue, chain: renderChain, timeline: renderTimeline, array: renderArray };

export function mount(block) {
  const spec = blockJSON(block);
  const kind = block.dataset.kind || "queue";
  const render = RENDERERS[kind];
  if (!spec || !render || !Array.isArray(spec.steps) || !spec.steps.length) {
    block.appendChild(h("p", { class: "widget-error" }, `stepper: missing or invalid spec (kind=${kind})`));
    return;
  }
  block.querySelector(':scope > script[type="application/json"]')?.remove();

  const steps = spec.steps;
  let i = 0, timer = null;
  const stage = h("div", { class: "st-stage" });
  const note = h("div", { class: "st-note" });
  const counter = h("span", { class: "st-counter" });
  const codeEl = spec.code ? h("pre", { class: "st-code" }, h("code", { class: "language-javascript" })) : null;
  if (codeEl) {
    const lines = spec.code.split("\n");
    codeEl.firstChild.innerHTML = lines.map((l, n) => `<span class="st-line" data-line="${n + 1}">${esc(l) || " "}</span>`).join("");
    if (globalThis.Prism) {
      // Highlight each line separately so the per-line spans survive.
      codeEl.querySelectorAll(".st-line").forEach(sp => { sp.innerHTML = Prism.highlight(sp.textContent, Prism.languages.javascript, "javascript") || " "; });
    }
  }

  const prevBtn = h("button", { class: "btn", type: "button", onClick: () => go(i - 1) }, "◀ Back");
  const nextBtn = h("button", { class: "btn primary", type: "button", onClick: () => go(i + 1) }, "Next ▶");
  const playBtn = h("button", { class: "btn", type: "button", onClick: togglePlay }, "▶ Play");
  const restart = h("button", { class: "btn small", type: "button", onClick: () => go(0) }, "↺");
  const controls = h("div", { class: "st-controls" }, prevBtn, nextBtn, playBtn, restart, counter);
  const el = h("div", { class: "st", tabindex: "0" }, controls, codeEl, stage, note);
  el.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); go(i + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(i - 1); }
  });
  block.appendChild(el);

  function go(n) {
    if (n < 0 || n >= steps.length) { if (n >= steps.length) stopPlay(); return; }
    i = n;
    const step = steps[i];
    stage.replaceChildren(render(step.state || {}, steps[i - 1]?.state || {}));
    note.innerHTML = `<strong>${esc(step.label || `Step ${i + 1}`)}</strong>${step.note ? " — " + step.note : ""}`;
    counter.textContent = `${i + 1} / ${steps.length}`;
    prevBtn.disabled = i === 0;
    nextBtn.disabled = i === steps.length - 1;
    codeEl?.querySelectorAll(".st-line").forEach(sp => sp.classList.toggle("active", Number(sp.dataset.line) === step.line));
    if (i === steps.length - 1) { recordBlock(block.id, true); block.classList.add("done"); stopPlay(); }
  }
  function togglePlay() { timer ? stopPlay() : startPlay(); }
  function startPlay() { if (i >= steps.length - 1) i = -1; playBtn.textContent = "⏸ Pause"; timer = setInterval(() => go(i + 1), 1400); go(i + 1); }
  function stopPlay() { clearInterval(timer); timer = null; playBtn.textContent = "▶ Play"; }
  go(0);
}
