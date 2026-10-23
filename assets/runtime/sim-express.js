// In-page Express shim. Express can't run in a browser, so snippets in the Express topic run in
// the worker sandbox with this prelude: `express()` builds an app with the real middleware
// semantics (ordering, `next()`, `next(err)`, 4-arity error handlers, `:param` routes, routers),
// and `request(app, { method, path, body, headers })` drives one request through it.
//
// Exported as a source string so the sandbox can prepend it to user code.

export const EXPRESS_PRELUDE = String.raw`
function __compilePath(p) {
  if (p instanceof RegExp) return { re: p, keys: [] };
  const keys = [];
  const re = new RegExp("^" + p.replace(/\/+$/, "").replace(/:(\w+)/g, (_, k) => { keys.push(k); return "([^/]+)"; }).replace(/\*/g, ".*") + "/?$");
  return { re, keys };
}
function __layer(path, fns, method) {
  const { re, keys } = __compilePath(path || "/");
  return { path, re, keys, fns, method, prefix: method == null };
}
function __createRouter() {
  const stack = [];
  const router = (req, res, next) => router.handle(req, res, next);
  const add = (method) => (path, ...fns) => {
    if (typeof path === "function") { fns.unshift(path); path = "/"; }
    stack.push(__layer(path, fns.flat(), method));
    return router;
  };
  router.use = add(null);
  for (const m of ["get", "post", "put", "patch", "delete", "all"]) router[m] = add(m.toUpperCase());
  router.stack = stack;
  router.handle = async (req, res, done) => {
    let i = 0;
    const basePath = req.path;
    const next = async (err) => {
      if (res.headersSent && err == null) return;
      while (i < stack.length) {
        const layer = stack[i++];
        const target = layer.prefix ? basePath : basePath;
        let m;
        if (layer.prefix) {
          const p = layer.path.replace(/\/+$/, "");
          if (!(target === p || target.startsWith(p + "/") || p === "")) continue;
          m = layer.re.exec(target.slice(0, p.length)) || [];
          req.params = Object.assign({}, req.params);
        } else {
          if (layer.method !== "ALL" && layer.method !== req.method) continue;
          m = layer.re.exec(target);
          if (!m) continue;
          req.params = Object.fromEntries(layer.keys.map((k, j) => [k, decodeURIComponent(m[j + 1])]));
        }
        for (const fn of layer.fns) {
          const isErrorHandler = fn.length === 4;
          if (err != null && !isErrorHandler) continue;
          if (err == null && isErrorHandler) continue;
          let called = false;
          const localNext = (e) => { called = true; return next(e); };
          try {
            if (isErrorHandler) await fn(err, req, res, localNext);
            else if (typeof fn.handle === "function") {
              const saved = req.path;
              req.path = target.slice(layer.path.replace(/\/+$/, "").length) || "/";
              await fn.handle(req, res, (e) => { req.path = saved; return localNext(e); });
            } else await fn(req, res, localNext);
          } catch (e) { return next(e); }
          if (res.headersSent) return;
          if (!called) return; // handler neither responded nor called next() — request hangs, like real Express
          return;
        }
      }
      if (done) return done(err);
      if (err != null) { res.status(err.status || err.statusCode || 500).json({ error: String(err.message || err) }); return; }
      res.status(404).json({ error: "Cannot " + req.method + " " + req.path });
    };
    await next();
  };
  return router;
}
function express() {
  const app = __createRouter();
  app.listen = (port, cb) => { console.log("(listening on " + port + " — simulated)"); cb && cb(); return { close() {} }; };
  app.set = () => app;
  return app;
}
express.Router = __createRouter;
express.json = () => (req, res, next) => { if (typeof req.body === "string") { try { req.body = JSON.parse(req.body); } catch (e) { e.status = 400; return next(e); } } next(); };
express.urlencoded = () => (req, res, next) => next();
express.static = () => (req, res, next) => next();

function __makeRes(resolve) {
  const res = {
    statusCode: 200, headers: {}, headersSent: false, locals: {}, body: undefined,
    status(c) { res.statusCode = c; return res; },
    set(k, v) { if (typeof k === "object") Object.assign(res.headers, k); else res.headers[k.toLowerCase()] = v; return res; },
    get(k) { return res.headers[k.toLowerCase()]; },
    type(t) { return res.set("content-type", t); },
    json(b) { res.set("content-type", "application/json"); return res.send(JSON.stringify(b)); },
    send(b) {
      if (res.headersSent) throw new Error("Cannot set headers after they are sent to the client");
      res.headersSent = true;
      res.body = b;
      resolve({ status: res.statusCode, headers: res.headers, body: typeof b === "string" && res.headers["content-type"] === "application/json" ? JSON.parse(b) : b });
      return res;
    },
    end(b) { return res.send(b ?? ""); },
    sendStatus(c) { return res.status(c).send(String(c)); },
    redirect(url) { return res.status(302).set("location", url).send(""); },
    cookie(k, v) { res.set("set-cookie", k + "=" + v); return res; },
  };
  return res;
}

async function request(app, opts = {}) {
  const method = (opts.method || "GET").toUpperCase();
  const url = new URL(opts.path || "/", "http://localhost");
  const req = {
    method, url: url.pathname + url.search, path: url.pathname, originalUrl: url.pathname + url.search,
    query: Object.fromEntries(url.searchParams), params: {}, body: opts.body,
    headers: Object.fromEntries(Object.entries(opts.headers || {}).map(([k, v]) => [k.toLowerCase(), v])),
    get(k) { return req.headers[k.toLowerCase()]; },
    ip: "127.0.0.1",
  };
  return new Promise((resolve, reject) => {
    const res = __makeRes(resolve);
    const timer = setTimeout(() => reject(new Error(method + " " + req.path + " never responded (no res.send / next()?)")), 1000);
    // Reached when the stack is exhausted: unhandled error → 500, nothing matched → 404 (as Express does).
    app.handle(req, res, (err) => {
      if (res.headersSent) return;
      if (err != null) res.status(err.status || err.statusCode || 500).json({ error: String(err.message || err) });
      else res.status(404).json({ error: "Cannot " + method + " " + req.path });
    });
    const origSend = res.send; res.send = (b) => { clearTimeout(timer); return origSend(b); };
  });
}
globalThis.express = express; globalThis.request = request;
`;
