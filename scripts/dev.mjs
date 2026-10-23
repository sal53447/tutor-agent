// Zero-dependency static server. ES modules won't load over file://, so this is the way to open the site.
//   npm run dev            → http://localhost:8080
//   PORT=3000 npm run dev
// With --watch (npm run dev) it also runs `build.mjs --watch` as a child, killed with the server.
import http from "node:http";
import { spawn } from "node:child_process";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const port = Number(process.env.PORT) || 8080;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".md": "text/markdown; charset=utf-8",
  ".woff2": "font/woff2",
};

http.createServer(async (req, res) => {
  let urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (urlPath.endsWith("/")) urlPath += "index.html";
  if (urlPath === "/favicon.ico") urlPath = "/assets/favicon.svg";
  const file = path.join(root, urlPath);
  if (!file.startsWith(root) || urlPath.startsWith("/node_modules") || urlPath.startsWith("/.")) {
    res.writeHead(403); return res.end("forbidden");
  }
  try {
    const s = await stat(file);
    if (s.isDirectory()) { res.writeHead(302, { Location: urlPath + "/" }); return res.end(); }
    // ACAO * lets the sandboxed (opaque-origin) playground iframe import /assets/vendor modules.
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(file)] || "application/octet-stream",
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*",
    });
    createReadStream(file).pipe(res);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" }); res.end("not found: " + urlPath);
  }
}).listen(port, () => console.log(`curriculum → http://localhost:${port}`));

if (process.argv.includes("--watch")) {
  const watcher = spawn(process.execPath, [path.join(root, "scripts", "build.mjs"), "--watch"], { stdio: "inherit" });
  for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => { watcher.kill(); process.exit(0); });
  process.on("exit", () => watcher.kill());
}
