// Code assembly shared by the browser sandbox (sandbox.js) and the node snippet runner
// (scripts/run-snippets.mjs). No browser globals here — it must import cleanly in node.
//
// assemble(js, { settleMs, mode, postFn }) wraps already-transpiled JS as:
//   <hoisted imports>  const __post = <postFn>;  <PRELUDE>  [<express prelude>]
//   (async () => { try { <body> } catch (e) { __post(error) } await settle; __post(done) })();

import { EXPRESS_PRELUDE } from "./sim-express.js";

// Shared by both backends: console capture + value formatting + test harness.
const PRELUDE = String.raw`
const __fmt = (v, depth = 0) => {
  if (v === null) return "null";
  if (v === undefined) return "undefined";
  // Node's console.log style, on one line: [ 1, 'a' ]  { a: 1 }  Map(1) { 'k' => 1 }
  if (typeof v === "string") return !depth ? v : v.includes("'") ? JSON.stringify(v) : "'" + JSON.stringify(v).slice(1, -1).replace(/\\"/g, '"') + "'";
  if (typeof v === "function") return "[Function" + (v.name ? ": " + v.name : "") + "]";
  if (typeof v === "symbol" || typeof v === "bigint") return v.toString() + (typeof v === "bigint" ? "n" : "");
  if (v instanceof Error) return (v.name || "Error") + ": " + v.message;
  if (v instanceof Promise) return "Promise { <pending> }";
  if (v instanceof Map) return "Map(" + v.size + ") {" + (v.size ? [...v].map(([k, x]) => " " + __fmt(k, 1) + " => " + __fmt(x, 1)).join(",") + " " : "") + "}";
  if (v instanceof Set) return "Set(" + v.size + ") {" + (v.size ? [...v].map(x => " " + __fmt(x, 1)).join(",") + " " : "") + "}";
  if (typeof v === "object") {
    if (depth > 3) return Array.isArray(v) ? "[Array]" : "[Object]";
    if (Array.isArray(v)) return v.length ? "[ " + v.map(x => __fmt(x, depth + 1)).join(", ") + " ]" : "[]";
    const name = v.constructor && v.constructor !== Object && v.constructor.name ? v.constructor.name + " " : "";
    const keys = Object.keys(v);
    if (!keys.length) return name + "{}";
    return name + "{ " + keys.map(k => k + ": " + __fmt(v[k], depth + 1)).join(", ") + " }";
  }
  return String(v);
};
for (const level of ["log", "info", "warn", "error", "debug", "table"]) {
  console[level] = (...a) => __post({ type: "log", level, text: a.map(x => __fmt(x)).join(" ") });
}
// Unhandled rejections are the bug the async lessons warn about — surface them like Node does.
if (typeof addEventListener === "function") {
  addEventListener("unhandledrejection", (e) => { e.preventDefault(); __post({ type: "log", level: "error", text: "Unhandled promise rejection: " + __fmt(e.reason) }); });
} else if (typeof process !== "undefined" && process.on) {
  process.on("unhandledRejection", (r) => __post({ type: "log", level: "error", text: "Unhandled promise rejection: " + __fmt(r) }));
}
const __tests = [];
function test(name, fn) { __tests.push([name, fn]); }
const it = test;
function __deepEq(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || typeof b !== "object" || !a || !b) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  return ka.length === kb.length && ka.every(k => __deepEq(a[k], b[k]));
}
function assert(c, m) { if (!c) throw new Error(m || "assertion failed"); }
assert.ok = assert;
assert.equal = (a, b, m) => { if (!__deepEq(a, b)) throw new Error((m ? m + ": " : "") + "expected " + __fmt(b, 1) + ", got " + __fmt(a, 1)); };
assert.notEqual = (a, b, m) => { if (__deepEq(a, b)) throw new Error((m ? m + ": " : "") + "expected values to differ, both " + __fmt(a, 1)); };
assert.throws = (fn, m) => { try { fn(); } catch { return; } throw new Error(m || "expected function to throw"); };
assert.rejects = async (p, m) => { try { await (typeof p === "function" ? p() : p); } catch { return; } throw new Error(m || "expected promise to reject"); };
const assertEqual = assert.equal;
async function __runTests() {
  const results = [];
  for (const [name, fn] of __tests) {
    try { await fn(); results.push({ name, ok: true }); }
    catch (e) { results.push({ name, ok: false, error: e && e.message ? e.message : String(e) }); }
  }
  __post({ type: "tests", results });
}
`;

// Top-level imports can't live inside the IIFE; lift them out. In express mode the shim is a
// global, so `import express from "express"` (as the lessons write it) is dropped rather than failing.
function hoistImports(code, { dropExpress = false } = {}) {
  const imports = [];
  const body = code.replace(/^[ \t]*import\s[^;\n]*(?:;|$)/gm, (m) => {
    if (dropExpress && /["']express["']/.test(m)) return "";
    imports.push(m); return "";
  });
  return { imports: imports.join("\n"), body };
}

export function assemble(code, { settleMs = 80, mode = "worker", postFn }) {
  const prelude = mode === "express" ? EXPRESS_PRELUDE : "";
  const { imports, body } = hoistImports(code, { dropExpress: mode === "express" });
  return `${imports}\nconst __post = ${postFn};\n${PRELUDE}\n${prelude}\n(async () => {\n` +
    `try {\n${body}\n} catch (e) { __post({ type: "error", text: e instanceof Error ? (e.name + ": " + e.message) : String(e) }); }\n` +
    `await new Promise(r => setTimeout(r, ${settleMs}));\n__post({ type: "done" });\n})();\n`;
}

