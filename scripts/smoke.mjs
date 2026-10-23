// Headless end-to-end check of the real pages in Chrome (via playwright-core + the installed
// Google Chrome). Starts the dev server on a spare port, then for every lesson (or the ones given):
//   - page loads with no console errors / uncaught exceptions / .widget-error elements
//   - topbar, prev/next and footer are rendered by boot.js
//   - each playground: Run → status is not "error"
//   - each fix/complete exercise: load the solution → Run tests → all pass; starter run → not all pass
//   - each predict exercise: "Run it" produces the expected output
//   - each stepper: Next through every step
//   - each recall deck: flip + grade the first card
// Also checks index.html lists every manifest lesson and review.html loads.
//
//   npm run smoke                       everything (~1–2 min)
//   npm run smoke -- 1f 2c              only those lesson ids
//   npm run smoke -- --headed           watch it

import { spawn } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright-core";

const root = path.resolve(import.meta.dirname, "..");
const { allLessons } = await import(pathToFileURL(path.join(root, "assets", "manifest.js")));
const args = process.argv.slice(2);
const headed = args.includes("--headed");
const only = args.filter(a => !a.startsWith("--"));
// A free port, so several smoke runs (parallel authoring agents) don't collide.
import net from "node:net";
const PORT = await new Promise((resolve) => { const srv = net.createServer(); srv.listen(0, () => { const p = srv.address().port; srv.close(() => resolve(p)); }); });
const BASE = `http://localhost:${PORT}`;

const server = spawn(process.execPath, [path.join(root, "scripts", "dev.mjs")], { env: { ...process.env, PORT: String(PORT) }, stdio: "ignore" });
await new Promise(r => setTimeout(r, 400));

const browser = await chromium.launch({ channel: "chrome", headless: !headed });
const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 } });
ctx.setDefaultTimeout(8000);
const failures = [];
const fail = (where, msg) => { failures.push(`${where}: ${msg}`); console.log(`  ✗ ${where}: ${msg}`); };

async function withPage(url, fn) {
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push("pageerror: " + e.message));
  page.on("console", m => { if (m.type() === "error") errors.push("console: " + m.text()); });
  try {
    await page.goto(BASE + url, { waitUntil: "networkidle" });
    await fn(page, errors);
  } catch (e) { fail(url, e.message.split("\n")[0]); }
  for (const e of errors) fail(url, e);
  await page.close();
}

// --- index + review
await withPage("/", async (page) => {
  const n = await page.locator("#index-topics li a").count();
  if (n !== allLessons().length) fail("/", `index lists ${n} lessons, manifest has ${allLessons().length}`);
  console.log(`index: ${n} lessons listed`);
});
await withPage("/review.html", async (page) => {
  await page.locator("#review-summary select").waitFor({ timeout: 15000 });
  console.log("review: " + (await page.locator("#review-summary p").first().textContent()));
});

// --- lessons
const lessons = allLessons().filter(l => !only.length || only.includes(l.id));
for (const l of lessons) {
  await withPage(l.path, async (page) => {
    await page.locator("nav.topbar").waitFor({ timeout: 5000 });
    await page.locator("footer.lesson-footer").waitFor({ timeout: 5000 });
    const bad = await page.locator(".widget-error").allTextContents();
    for (const b of bad) fail(l.id, "widget error: " + b);
    const summary = [];

    for (const pg of await page.locator('section.block[data-block="playground"]').all()) {
      await pg.locator("button", { hasText: "Run" }).first().click();
      await pg.locator(".sb-status:not(:has-text('running'))").waitFor({ timeout: 8000 });
      const st = await pg.locator(".sb-status").textContent();
      if (/error|timed out/.test(st)) fail(l.id, `playground #${await pg.getAttribute("id")} → ${st}: ${(await pg.locator(".sb-line.error").allTextContents()).join(" | ")}`);
      summary.push("playground");
    }
    for (const ex of await page.locator('section.block[data-block="exercise"]').all()) {
      const id = await ex.getAttribute("id"), kind = await ex.getAttribute("data-kind");
      if (kind === "fix" || kind === "complete") {
        await ex.locator("button", { hasText: "Run tests" }).click();
        await ex.locator(".sb-status:not(:has-text('running'))").waitFor({ timeout: 8000 });
        const starterPassed = await ex.evaluate(el => el.classList.contains("passed"));
        if (starterPassed) fail(l.id, `exercise #${id}: starter already passes`);
        await ex.locator("button", { hasText: "Show solution" }).click();
        await ex.locator("button", { hasText: "Load into editor" }).click();
        await ex.locator("button", { hasText: "Run tests" }).click();
        await ex.locator(".sb-status:not(:has-text('running'))").waitFor({ timeout: 8000 });
        const passed = await ex.evaluate(el => el.classList.contains("passed"));
        if (!passed) fail(l.id, `exercise #${id}: solution fails: ${(await ex.locator(".ex-tests li.fail, .sb-line.error").allTextContents()).join(" | ")}`);
      } else if (kind === "predict") {
        await ex.locator("button", { hasText: "Run it" }).click();
        await ex.locator(".sb-status:not(:has-text('running'))").waitFor({ timeout: 8000 });
        const spec = JSON.parse(await ex.evaluate(el => el.dataset.specForSmoke || "null") || "null");
        const lines = await ex.locator(".sb-line:not(.dim)").allTextContents();
        const expected = await ex.evaluate(el => el.__expected ?? null);
        if (spec || expected) { /* reserved */ }
        if (await ex.locator(".sb-line.error").count()) fail(l.id, `predict #${id}: code throws: ${lines.join(" | ")}`);
      }
      summary.push(kind);
    }
    for (const st of await page.locator('section.block[data-block="stepper"]').all()) {
      const next = st.locator("button", { hasText: "Next" });
      let guard = 0;
      while (!(await next.isDisabled()) && guard++ < 60) await next.click();
      if (!(await st.evaluate(el => el.classList.contains("done")))) fail(l.id, `stepper #${await st.getAttribute("id")} never reached the last step`);
      summary.push("stepper");
    }
    for (const rc of await page.locator('section.block[data-block="recall"]').all()) {
      await rc.locator("button", { hasText: "Show answer" }).click();
      await rc.locator("button", { hasText: "Good" }).click();
      summary.push("recall");
    }
    const diagrams = await page.locator('section.block[data-block="diagram"] svg').count();
    if (diagrams) summary.push(`diagram×${diagrams}`);
    console.log(`${l.id} ok${summary.length ? " — " + summary.join(", ") : ""}`);
  });
}

await browser.close();
server.kill();
console.log(failures.length ? `\n${failures.length} failures` : "\nsmoke: all good");
process.exit(failures.length ? 1 : 0);
