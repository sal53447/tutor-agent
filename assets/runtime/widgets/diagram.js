// Diagram block: boxes-and-arrows from a JSON spec, auto-laid-out into rows, rendered as themed
// inline SVG. Authors describe the mechanism; the widget keeps every diagram visually uniform.
//
// <section class="block" data-block="diagram" id="1f-03">
//   <script type="application/json">{
//     "direction": "down",                      // "down" (rows top→bottom) or "right" (columns left→right)
//     "nodes": [ { "id": "p", "label": "pending", "kind": "box|pill|cyl|note", "row": 0 } ],
//     "edges": [ { "from": "p", "to": "f", "label": "resolve()", "dashed": false } ]
//   }</script>
//   <p class="caption">Promise states. A settled promise never changes again.</p>
// </section>
//
// A block may instead contain a hand-written <svg> (for the rare diagram the spec can't express);
// mount() leaves that alone. Row is optional: without it, rows come from edge depth.

import { h, blockJSON } from "../ui.js";

const SVG = "http://www.w3.org/2000/svg";
function s(tag, attrs = {}, ...children) {
  const el = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) el.setAttribute(k, v);
  for (const c of children.flat()) if (c != null) el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  return el;
}

/** Assign a row to every node: explicit `row`, else longest-path depth from the sources. */
export function layoutRows(nodes, edges) {
  const depth = new Map(nodes.map(n => [n.id, n.row ?? null]));
  const incoming = new Map(nodes.map(n => [n.id, []]));
  for (const e of edges) incoming.get(e.to)?.push(e.from);
  const seen = new Set();
  function d(id) {
    if (depth.get(id) != null) return depth.get(id);
    if (seen.has(id)) return 0; // cycle guard
    seen.add(id);
    const parents = incoming.get(id) || [];
    const v = parents.length ? Math.max(...parents.map(p => d(p) + 1)) : 0;
    depth.set(id, v);
    return v;
  }
  for (const n of nodes) d(n.id);
  const rows = [];
  for (const n of nodes) (rows[depth.get(n.id)] ||= []).push(n);
  return rows.filter(Boolean);
}

export function renderDiagram(spec) {
  const nodes = spec.nodes || [], edges = spec.edges || [];
  const right = spec.direction === "right";
  const rows = layoutRows(nodes, edges);
  const W = 760, nodeH = 44;
  const pos = {};
  let H;
  if (!right) {
    const rowGap = 96, nodeW = Math.min(200, Math.max(120, Math.floor(W / Math.max(...rows.map(r => r.length), 1)) - 24));
    rows.forEach((row, r) => {
      const span = row.length * nodeW + (row.length - 1) * 24;
      row.forEach((n, i) => { pos[n.id] = { x: (W - span) / 2 + i * (nodeW + 24), y: 16 + r * rowGap, w: nodeW, h: nodeH }; });
    });
    H = 16 + (rows.length - 1) * rowGap + nodeH + 16;
  } else {
    // Each depth level becomes a column; nodes in a level stack vertically.
    const colW = Math.min(180, Math.floor((W - 32) / rows.length) - 40), colGap = (W - 32 - rows.length * colW) / Math.max(rows.length - 1, 1);
    const tallest = Math.max(...rows.map(r => r.length));
    H = 16 + tallest * (nodeH + 20);
    rows.forEach((col, c) => {
      const span = col.length * (nodeH + 20) - 20;
      col.forEach((n, i) => { pos[n.id] = { x: 16 + c * (colW + colGap), y: (H - span) / 2 + i * (nodeH + 20), w: colW, h: nodeH }; });
    });
  }
  const svg = s("svg", { viewBox: `0 0 ${W} ${H}`, class: "dg-svg" });
  svg.appendChild(s("defs", {}, s("marker", { id: "dg-arrow", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto" },
    s("path", { d: "M0,0 L10,5 L0,10 z", class: "dg-arrow" }))));

  for (const e of edges) {
    const a = pos[e.from], b = pos[e.to];
    if (!a || !b) continue;
    const ax = a.x + a.w / 2, bx = b.x + b.w / 2;
    let d, lx, ly;
    if (b.y > a.y) { d = `M${ax},${a.y + a.h} C${ax},${a.y + a.h + 40} ${bx},${b.y - 40} ${bx},${b.y}`; lx = (ax + bx) / 2; ly = (a.y + a.h + b.y) / 2; }
    else if (b.y < a.y) { d = `M${ax},${a.y} C${ax},${a.y - 40} ${bx},${b.y + b.h + 40} ${bx},${b.y + b.h}`; lx = (ax + bx) / 2 + 14; ly = (a.y + b.y + b.h) / 2; }
    else if (b.x > a.x) { d = `M${a.x + a.w},${a.y + a.h / 2} L${b.x},${b.y + b.h / 2}`; lx = (a.x + a.w + b.x) / 2; ly = a.y + a.h / 2 - 12; }
    else { d = `M${a.x},${a.y + a.h / 2} L${b.x + b.w},${b.y + b.h / 2}`; lx = (a.x + b.x + b.w) / 2; ly = a.y + a.h / 2 + 16; }
    svg.appendChild(s("path", { d, class: "dg-edge" + (e.dashed ? " dashed" : ""), "marker-end": "url(#dg-arrow)" }));
    if (e.label) {
      const t = s("text", { x: lx, y: ly, class: "dg-edge-label", "text-anchor": "middle", "dominant-baseline": "middle" }, e.label);
      svg.appendChild(s("rect", { x: lx - e.label.length * 3.4 - 4, y: ly - 9, width: e.label.length * 6.8 + 8, height: 18, rx: 4, class: "dg-label-bg" }));
      svg.appendChild(t);
    }
  }
  for (const n of nodes) {
    const p = pos[n.id];
    const kind = n.kind || "box";
    const g = s("g", { class: "dg-node " + kind });
    if (kind === "cyl") {
      g.appendChild(s("rect", { x: p.x, y: p.y + 6, width: p.w, height: p.h - 12, rx: 0 }));
      g.appendChild(s("ellipse", { cx: p.x + p.w / 2, cy: p.y + 6, rx: p.w / 2, ry: 6 }));
      g.appendChild(s("ellipse", { cx: p.x + p.w / 2, cy: p.y + p.h - 6, rx: p.w / 2, ry: 6 }));
    } else {
      g.appendChild(s("rect", { x: p.x, y: p.y, width: p.w, height: p.h, rx: kind === "pill" ? p.h / 2 : 6 }));
    }
    const lines = String(n.label).split("\n");
    const t = s("text", { x: p.x + p.w / 2, y: p.y + p.h / 2 - (lines.length - 1) * 7, "text-anchor": "middle", "dominant-baseline": "middle" });
    lines.forEach((l, i) => t.appendChild(s("tspan", { x: p.x + p.w / 2, dy: i ? 14 : 0 }, l)));
    g.appendChild(t);
    svg.appendChild(g);
  }
  return svg;
}

export function mount(block) {
  if (block.querySelector(":scope > svg")) return; // hand-written SVG passthrough
  const spec = blockJSON(block);
  if (!spec) { block.appendChild(h("p", { class: "widget-error" }, "diagram: missing spec")); return; }
  const script = block.querySelector(':scope > script[type="application/json"]');
  const svg = renderDiagram(spec);
  const caption = block.querySelector(":scope > .caption");
  if (caption) caption.before(svg); else block.appendChild(svg);
  script?.remove();
}
