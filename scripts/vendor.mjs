// Bundles the pinned browser libraries from node_modules into assets/vendor/.
// Output is committed, so the site runs with nothing but a static server.
// Re-run after bumping a devDependency version in package.json.
import { build } from "esbuild";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "assets", "vendor");
await mkdir(out, { recursive: true });

const common = { bundle: true, minify: true, format: "esm", target: "es2022", logLevel: "warning", absWorkingDir: root };

// --- Prism: core + the languages the lessons use. Manual mode; boot.js calls highlightAllUnder.
// `Prism.manual` must be set before prism-core runs, and ESM imports are hoisted above any
// statement in the entry, so the flag lives in its own module imported first.
const prismDir = path.join(root, "node_modules", ".cache", "vendor-entries");
await mkdir(prismDir, { recursive: true });
await writeFile(path.join(prismDir, "prism-manual.js"), "globalThis.Prism = { manual: true };\n");
await build({
  ...common,
  stdin: {
    resolveDir: root,
    contents: `
      import "./node_modules/.cache/vendor-entries/prism-manual.js";
      import "prismjs/components/prism-core.js";
      import "prismjs/components/prism-markup.js";
      import "prismjs/components/prism-clike.js";
      import "prismjs/components/prism-javascript.js";
      import "prismjs/components/prism-typescript.js";
      import "prismjs/components/prism-jsx.js";
      import "prismjs/components/prism-tsx.js";
      import "prismjs/components/prism-bash.js";
      import "prismjs/components/prism-json.js";
      import "prismjs/components/prism-css.js";
      import "prismjs/components/prism-sql.js";
      import "prismjs/components/prism-yaml.js";
      import "prismjs/components/prism-http.js";
      import "prismjs/components/prism-docker.js";
      import "prismjs/components/prism-nginx.js";
      import "prismjs/components/prism-markdown.js";
      import "prismjs/components/prism-diff.js";
      import "prismjs/components/prism-toml.js";
      import "prismjs/components/prism-ini.js";
      import "prismjs/components/prism-python.js";
      export default globalThis.Prism;
    `,
  },
  outfile: path.join(out, "prism.js"),
});
await copyFile(require.resolve("prismjs/themes/prism-tomorrow.css"), path.join(out, "prism.css"));

// --- Sucrase: TS / JSX → JS in the browser, used by the playground + exercise sandbox.
await build({
  ...common,
  stdin: { resolveDir: root, contents: `export { transform } from "sucrase";` },
  outfile: path.join(out, "sucrase.js"),
});

// --- React 19 for in-page React playgrounds. Three entry modules sharing one chunk, so an
// import map `{ "react": ".../react/react.js", ... }` in the sandbox resolves bare specifiers
// without ever loading two React copies (which would break hooks).
// The packages are CommonJS, so `export *` can't enumerate their names; generate facades that list them.
const facadeDir = path.join(root, "node_modules", ".cache", "vendor-entries");
await mkdir(facadeDir, { recursive: true });
const facades = { react: "react", "react-dom-client": "react-dom/client", "jsx-runtime": "react/jsx-runtime" };
const entryPoints = {};
for (const [name, pkg] of Object.entries(facades)) {
  const names = Object.keys(require(pkg)).filter(k => /^[A-Za-z_$][\w$]*$/.test(k) && k !== "default");
  const file = path.join(facadeDir, name + ".js");
  await writeFile(file, `import m from ${JSON.stringify(pkg)};\nexport default m;\nexport const { ${names.join(", ")} } = m;\n`);
  entryPoints[name] = file;
}
await build({
  ...common,
  entryPoints,
  splitting: true,
  chunkNames: "chunk-[name]",
  define: { "process.env.NODE_ENV": '"development"' },
  outdir: path.join(out, "react"),
});

const versions = {};
for (const dep of ["prismjs", "sucrase", "react", "react-dom"]) versions[dep] = require(`${dep}/package.json`).version;
await writeFile(path.join(out, "VERSIONS.json"), JSON.stringify(versions, null, 2) + "\n");
console.log("vendored:", versions);
