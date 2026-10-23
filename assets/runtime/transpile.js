// TS / JSX → JS in the browser via vendored sucrase, loaded on first use.
// Languages: js | ts | jsx | tsx. Output uses the automatic JSX runtime (import map maps
// "react/jsx-runtime" in the DOM sandbox).

let sucrase = null;

export function normalizeLang(lang) {
  const l = (lang || "js").toLowerCase();
  if (l === "javascript") return "js";
  if (l === "typescript") return "ts";
  return ["js", "ts", "jsx", "tsx"].includes(l) ? l : "js";
}

export function needsTranspile(lang) {
  return normalizeLang(lang) !== "js";
}

export async function toJS(code, lang) {
  const l = normalizeLang(lang);
  if (l === "js") return code;
  if (!sucrase) sucrase = await import("/assets/vendor/sucrase.js");
  const transforms = [];
  if (l === "ts" || l === "tsx") transforms.push("typescript");
  if (l === "jsx" || l === "tsx") transforms.push("jsx");
  return sucrase.transform(code, { transforms, jsxRuntime: "automatic", production: true, filePath: `snippet.${l}` }).code;
}
