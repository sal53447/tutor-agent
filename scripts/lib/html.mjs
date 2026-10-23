// Tiny DOM-ish helpers over parse5 for the node scripts. Not a full DOM — just what the
// validator, snippet runner and migration need: find elements, read attributes/text, locations.
import { parse } from "parse5";

export function parseHTML(html) {
  return parse(html, { sourceCodeLocationInfo: true });
}

export function attr(node, name) {
  return node.attrs?.find(a => a.name === name)?.value ?? null;
}

export function classes(node) {
  return (attr(node, "class") || "").split(/\s+/).filter(Boolean);
}

export function* walk(node) {
  yield node;
  for (const c of node.childNodes || []) yield* walk(c);
  if (node.content) yield* walk(node.content); // <template>
}

export function find(root, pred) {
  for (const n of walk(root)) if (n.tagName && pred(n)) return n;
  return null;
}

export function findAll(root, pred) {
  const out = [];
  for (const n of walk(root)) if (n.tagName && pred(n)) out.push(n);
  return out;
}

export function byTag(root, tag) { return findAll(root, n => n.tagName === tag); }

export function children(node) { return (node.childNodes || []).filter(n => n.tagName); }

/** Text content, with HTML entities already decoded by parse5. */
export function text(node) {
  if (node.nodeName === "#text") return node.value;
  let s = "";
  for (const c of node.childNodes || []) s += text(c);
  return s;
}

export function line(node) { return node.sourceCodeLocation?.startLine ?? 0; }
