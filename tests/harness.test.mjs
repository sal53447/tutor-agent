import { describe, expect, it } from "vitest";
import { assemble } from "../assets/runtime/harness.js";

// Runs assembled code in this process by importing it as a data: URL module; __post collects.
async function exec(code, mode = "worker") {
  const msgs = [];
  globalThis.__collect = (m) => msgs.push(m);
  const src = assemble(code, { mode, settleMs: 20, postFn: "(m) => globalThis.__collect(m)" });
  await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  for (let i = 0; i < 100 && !msgs.some(m => m.type === "done"); i++) await new Promise(r => setTimeout(r, 25));
  return { msgs, logs: msgs.filter(m => m.type === "log").map(m => m.text), error: msgs.find(m => m.type === "error")?.text, tests: msgs.find(m => m.type === "tests")?.results };
}

describe("harness.assemble", () => {
  it("captures console output in event-loop order", async () => {
    const r = await exec(`console.log("1"); setTimeout(() => console.log("2"), 0); Promise.resolve().then(() => console.log("3")); console.log("4");`);
    expect(r.logs).toEqual(["1", "4", "3", "2"]);
    expect(r.msgs.at(-1).type).toBe("done");
  });

  it("formats values like a console", async () => {
    const r = await exec(`console.log([1, "a", { b: null }], new Map([["k", 1]]), undefined, () => {}, 10n);`);
    expect(r.logs[0]).toBe("[ 1, 'a', { b: null } ] Map(1) { 'k' => 1 } undefined [Function] 10n");
  });

  it("reports thrown errors and still finishes", async () => {
    const r = await exec(`console.log("before"); null.x;`);
    expect(r.logs).toEqual(["before"]);
    expect(r.error).toMatch(/^TypeError/);
    expect(r.msgs.at(-1).type).toBe("done");
  });

  it("supports top-level await", async () => {
    const r = await exec(`const v = await Promise.resolve(42); console.log(v);`);
    expect(r.logs).toEqual(["42"]);
  });

  it("runs test() blocks and reports per-test results", async () => {
    const r = await exec(`
      const add = (a, b) => a + b;
      test("adds", () => assert.equal(add(1, 2), 3));
      test("deep", () => assert.equal({ a: [1] }, { a: [1] }));
      test("fails", () => assert.equal(add(1, 2), 4));
      test("throws", () => assert.throws(() => { throw new Error("x"); }));
      test("rejects", async () => assert.rejects(Promise.reject(new Error("y"))));
      await __runTests();`);
    expect(r.tests.map(t => t.ok)).toEqual([true, true, false, true, true]);
    expect(r.tests[2].error).toBe("expected 4, got 3");
  });

  it("hoists imports and drops `import express` in express mode", () => {
    const src = assemble(`import express from "express";\nimport { x } from "y";\nconsole.log(1);`, { mode: "express", postFn: "() => {}" });
    expect(src.trimStart().startsWith('import { x } from "y";')).toBe(true);
    expect(src).not.toContain('from "express"');
    expect(src).toContain("globalThis.express = express");
  });
});

describe("sim-express", () => {
  it("runs middleware, params, error handlers and 404s", async () => {
    const r = await exec(`
      const app = express();
      app.use((req, res, next) => { req.user = "u1"; next(); });
      app.get("/items/:id", (req, res) => res.json({ id: req.params.id, user: req.user, q: req.query.v }));
      app.post("/boom", () => { throw new Error("kaboom"); });
      app.use((err, req, res, next) => res.status(500).json({ error: err.message }));
      const a = await request(app, { path: "/items/7?v=1" });
      const b = await request(app, { method: "POST", path: "/boom" });
      const c = await request(app, { path: "/nope" });
      console.log(a.status, JSON.stringify(a.body));
      console.log(b.status, JSON.stringify(b.body));
      console.log(c.status, JSON.stringify(c.body));`, "express");
    expect(r.error).toBeUndefined();
    expect(r.logs).toEqual([
      '200 {"id":"7","user":"u1","q":"1"}',
      '500 {"error":"kaboom"}',
      '404 {"error":"Cannot GET /nope"}',
    ]);
  });

  it("mounts routers under a prefix and parses JSON bodies", async () => {
    const r = await exec(`
      const app = express();
      app.use(express.json());
      const users = express.Router();
      users.get("/", (req, res) => res.json(["a"]));
      users.post("/", (req, res) => res.status(201).json(req.body));
      app.use("/users", users);
      console.log((await request(app, { path: "/users" })).body);
      const p = await request(app, { method: "POST", path: "/users", body: '{"name":"n"}' });
      console.log(p.status, p.body.name);`, "express");
    expect(r.error).toBeUndefined();
    expect(r.logs).toEqual(["[ 'a' ]", "201 n"]);
  });

  it("reports a handler that never responds", async () => {
    const r = await exec(`
      const app = express();
      app.get("/hang", (req, res) => { /* forgot res.send */ });
      try { await request(app, { path: "/hang" }); } catch (e) { console.log(e.message); }`, "express");
    expect(r.logs[0]).toMatch(/never responded/);
  });
});
