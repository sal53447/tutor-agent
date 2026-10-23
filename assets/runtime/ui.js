// Small shared UI helpers: element builder, toast, theme toggle, HTML escaping.

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "dataset") Object.assign(el.dataset, v);
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === "html") el.innerHTML = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return el;
}

export function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function toast(msg) {
  let t = document.getElementById("toast");
  if (!t) { t = h("div", { id: "toast", class: "toast" }); document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._hideTimer);
  t._hideTimer = setTimeout(() => t.classList.remove("show"), 1500);
}

const THEME_KEY = "curriculum-theme";

export function applyTheme(theme) {
  const t = theme || (() => { try { return localStorage.getItem(THEME_KEY); } catch { return null; } })() || "dark";
  document.documentElement.dataset.theme = t;
  return t;
}

export function toggleTheme() {
  const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  try { localStorage.setItem(THEME_KEY, next); } catch { /* private mode */ }
  return applyTheme(next);
}

export function themeButton() {
  const btn = h("button", { class: "theme-toggle", title: "Toggle light / dark", type: "button" }, "Theme");
  btn.addEventListener("click", () => { toggleTheme(); });
  return btn;
}

/** Read a block's `<script type="application/json">` payload. */
export function blockJSON(block) {
  const s = block.querySelector(':scope > script[type="application/json"]');
  if (!s) return null;
  try { return JSON.parse(s.textContent); }
  catch (e) { console.error("Bad JSON in block", block.id, e); return null; }
}

/** Text content of the block's starter `<pre><code>` (HTML-unescaped by the DOM). */
export function blockCode(block) {
  const code = block.querySelector(":scope > pre > code");
  return code ? code.textContent.replace(/\n$/, "") : "";
}

export function langFromClass(codeEl) {
  const m = /language-(\w+)/.exec(codeEl?.className || "");
  return m ? m[1] : "javascript";
}
