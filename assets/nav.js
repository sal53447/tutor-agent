// Shared navigation + progress script for the curriculum.
// Used by both the index and individual lesson pages.

(() => {
  const PROGRESS_KEY = "curriculum-progress-v2";

  // --- The full ordered lesson manifest. Edit here if you add lessons. ---
  const LESSONS = [
    { id: "1a", folder: "01-javascript", file: "1a-language-model.html",          part: 1, title: "Language model — history, runtime, values, equality" },
    { id: "1b", folder: "01-javascript", file: "1b-functions-scope.html",          part: 1, title: "Functions, closures, and this" },
    { id: "1c", folder: "01-javascript", file: "1c-objects-prototypes-classes.html", part: 1, title: "Objects, prototypes, classes" },
    { id: "1d", folder: "01-javascript", file: "1d-arrays-iteration.html",         part: 1, title: "Arrays, iteration, generators" },
    { id: "1e", folder: "01-javascript", file: "1e-modules.html",                  part: 1, title: "Modules — ESM vs CommonJS" },
    { id: "1f", folder: "01-javascript", file: "1f-async-event-loop.html",         part: 1, title: "Async & concurrency — the event loop" },
    { id: "1g", folder: "01-javascript", file: "1g-error-handling.html",           part: 1, title: "Error handling" },
    { id: "1h", folder: "01-javascript", file: "1h-runtimes.html",                 part: 1, title: "Runtimes — Node, browser, edge" },
    { id: "1i", folder: "01-javascript", file: "1i-tooling.html",                  part: 1, title: "Tooling ecosystem" },
    { id: "1j", folder: "01-javascript", file: "1j-code-quality.html",             part: 1, title: "Code quality — ESLint & Prettier" },
    { id: "1k", folder: "01-javascript", file: "1k-testing.html",                  part: 1, title: "Testing — philosophy and tools" },

    { id: "2a", folder: "02-typescript", file: "2a-what-ts-is.html",               part: 2, title: "What TypeScript actually is" },
    { id: "2b", folder: "02-typescript", file: "2b-type-system.html",              part: 2, title: "The type system" },
    { id: "2c", folder: "02-typescript", file: "2c-generics.html",                 part: 2, title: "Generics in practice" },
    { id: "2d", folder: "02-typescript", file: "2d-type-level-tools.html",         part: 2, title: "Type-level tools" },
    { id: "2e", folder: "02-typescript", file: "2e-tsconfig.html",                 part: 2, title: "tsconfig deep dive" },
    { id: "2f", folder: "02-typescript", file: "2f-ts-idioms.html",                part: 2, title: "TS idioms" },
    { id: "2g", folder: "02-typescript", file: "2g-ts-in-react.html",              part: 2, title: "TS in React" },
    { id: "2h", folder: "02-typescript", file: "2h-ts-on-backend.html",            part: 2, title: "TS on the backend" },

    { id: "3a", folder: "03-express",    file: "3a-http-fundamentals.html",        part: 3, title: "HTTP fundamentals" },
    { id: "3b", folder: "03-express",    file: "3b-routing-middleware.html",       part: 3, title: "Express core — routing & middleware" },
    { id: "3c", folder: "03-express",    file: "3c-project-architecture.html",     part: 3, title: "Project architecture" },
    { id: "3d", folder: "03-express",    file: "3d-validation.html",               part: 3, title: "Validation & serialization" },
    { id: "3e", folder: "03-express",    file: "3e-auth.html",                     part: 3, title: "Auth — sessions, JWT, OAuth" },
    { id: "3f", folder: "03-express",    file: "3f-databases.html",                part: 3, title: "Databases — ORMs, migrations, transactions" },
    { id: "3g", folder: "03-express",    file: "3g-observability.html",            part: 3, title: "Observability — logs, metrics, traces" },
    { id: "3h", folder: "03-express",    file: "3h-testing.html",                  part: 3, title: "Testing — unit, integration, supertest" },
    { id: "3i", folder: "03-express",    file: "3i-deployment.html",               part: 3, title: "Deployment & ops" },
    { id: "3j", folder: "03-express",    file: "3j-alternatives.html",             part: 3, title: "When Express isn't the answer" },

    { id: "4a", folder: "04-react",      file: "4a-mental-model.html",             part: 4, title: "React mental model" },
    { id: "4b", folder: "04-react",      file: "4b-components-jsx.html",           part: 4, title: "Components & JSX" },
    { id: "4c", folder: "04-react",      file: "4c-state-primitives.html",         part: 4, title: "State primitives — useState, useReducer" },
    { id: "4d", folder: "04-react",      file: "4d-use-effect.html",               part: 4, title: "useEffect properly" },
    { id: "4e", folder: "04-react",      file: "4e-other-hooks.html",              part: 4, title: "Other core hooks" },
    { id: "4f", folder: "04-react",      file: "4f-custom-hooks.html",             part: 4, title: "Custom hooks" },
    { id: "4g", folder: "04-react",      file: "4g-server-vs-client-state.html",   part: 4, title: "Server state vs client state" },
    { id: "4h", folder: "04-react",      file: "4h-client-state.html",             part: 4, title: "Client state management" },
    { id: "4i", folder: "04-react",      file: "4i-forms.html",                    part: 4, title: "Forms — react-hook-form + Zod" },
    { id: "4j", folder: "04-react",      file: "4j-styling.html",                  part: 4, title: "Styling — Tailwind, CSS Modules" },
    { id: "4k", folder: "04-react",      file: "4k-performance.html",              part: 4, title: "Performance — profiling, memoization" },
    { id: "4l", folder: "04-react",      file: "4l-component-design.html",         part: 4, title: "Component design patterns" },
    { id: "4m", folder: "04-react",      file: "4m-testing.html",                  part: 4, title: "Testing — React Testing Library" },

    { id: "5a", folder: "05-nextjs",     file: "5a-rendering-spectrum.html",       part: 5, title: "The rendering spectrum" },
    { id: "5b", folder: "05-nextjs",     file: "5b-app-router.html",               part: 5, title: "App Router architecture" },
    { id: "5c", folder: "05-nextjs",     file: "5c-server-components.html",        part: 5, title: "React Server Components" },
    { id: "5d", folder: "05-nextjs",     file: "5d-data-caching.html",             part: 5, title: "Data fetching & caching" },
    { id: "5e", folder: "05-nextjs",     file: "5e-server-actions.html",           part: 5, title: "Server Actions" },
    { id: "5f", folder: "05-nextjs",     file: "5f-middleware-edge.html",          part: 5, title: "Middleware & edge runtime" },
    { id: "5g", folder: "05-nextjs",     file: "5g-auth.html",                     part: 5, title: "Auth in Next.js" },
    { id: "5h", folder: "05-nextjs",     file: "5h-deployment.html",               part: 5, title: "Deployment — Vercel vs self-hosted" },
    { id: "5i", folder: "05-nextjs",     file: "5i-production-architecture.html",  part: 5, title: "Production architecture" },
    { id: "5j", folder: "05-nextjs",     file: "5j-performance.html",              part: 5, title: "Performance — Core Web Vitals" },
    { id: "5k", folder: "05-nextjs",     file: "5k-testing.html",                  part: 5, title: "Testing Next.js apps" },
  ];

  const PART_INFO = {
    1: { name: "Part 1 · JavaScript",  desc: "The language itself. Eleven lessons — the deepest part; everything else stands on this.",                                                              bridge: "Start here. No prerequisites beyond general programming experience.",                                              time: "~4–5 hours" },
    2: { name: "Part 2 · TypeScript",  desc: "Structural types bolted onto JS. Eight lessons covering the type system, generics, and real idioms.",                                                bridge: "Structural typing maps directly onto the object shapes you learned in Part 1.",                                    time: "~2–3 hours" },
    3: { name: "Part 3 · Express",     desc: "Backend design beyond Express itself. Ten lessons — architecture, auth, databases, observability, deployment.",                                      bridge: "You now write TypeScript on the server. Part 2 Lesson 2h bridges the gap.",                                       time: "~3–4 hours" },
    4: { name: "Part 4 · React",       desc: "The production patterns, not just hooks. Thirteen lessons — state, effects, forms, performance, component design.",                                  bridge: "Assumes fluency in JS and TS; backend context from Part 3 helps but isn't required.",                             time: "~4–5 hours" },
    5: { name: "Part 5 · Next.js",     desc: "The modern React framework. Eleven lessons — App Router, Server Components, caching, server actions, deployment.",                                   bridge: "Unifies Part 3's server-side patterns with Part 4's React patterns into one framework.",                          time: "~3–4 hours" },
  };

  // --- Progress storage ---
  function loadProgress() {
    try { return new Set(JSON.parse(localStorage.getItem(PROGRESS_KEY) || "[]")); }
    catch { return new Set(); }
  }
  function saveProgress(set) {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify([...set]));
  }

  // --- Lesson page bootstrap ---
  function bootLessonPage() {
    const bodyId = document.body.dataset.lesson;
    if (!bodyId) return;
    const idx = LESSONS.findIndex(l => l.id === bodyId);
    if (idx < 0) return;
    const prev = LESSONS[idx - 1];
    const next = LESSONS[idx + 1];

    // Prev/next in topbar
    const prevLink = document.getElementById("prev-link");
    const nextLink = document.getElementById("next-link");
    if (prevLink) {
      if (prev) prevLink.href = "../" + prev.folder + "/" + prev.file;
      else prevLink.classList.add("disabled");
    }
    if (nextLink) {
      if (next) nextLink.href = "../" + next.folder + "/" + next.file;
      else nextLink.classList.add("disabled");
    }

    // Prev/next cards in footer
    const footer = document.querySelector(".lesson-footer");
    if (footer) {
      const prevCard = footer.querySelector(".prev-card");
      const nextCard = footer.querySelector(".next-card");
      if (prevCard) {
        if (prev) {
          prevCard.href = "../" + prev.folder + "/" + prev.file;
          prevCard.querySelector(".title").textContent = prev.id + ". " + prev.title;
        } else { prevCard.classList.add("disabled"); prevCard.querySelector(".title").textContent = "(start of curriculum)"; }
      }
      if (nextCard) {
        if (next) {
          nextCard.href = "../" + next.folder + "/" + next.file;
          nextCard.querySelector(".title").textContent = next.id + ". " + next.title;
        } else { nextCard.classList.add("disabled"); nextCard.querySelector(".title").textContent = "(end of curriculum)"; }
      }
    }

    // Mark-done checkbox
    const progress = loadProgress();
    const cb = document.querySelector(".mark-done input");
    if (cb) {
      cb.checked = progress.has(bodyId);
      cb.addEventListener("change", () => {
        const p = loadProgress();
        if (cb.checked) p.add(bodyId); else p.delete(bodyId);
        saveProgress(p);
        toast(cb.checked ? "Marked as read" : "Unmarked");
      });
    }

    // Copy-code buttons
    document.querySelectorAll("pre").forEach(pre => {
      if (pre.querySelector(".copy-btn")) return;
      const btn = document.createElement("button");
      btn.className = "copy-btn";
      btn.textContent = "Copy";
      btn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(pre.querySelector("code").textContent);
          btn.textContent = "Copied!";
          setTimeout(() => (btn.textContent = "Copy"), 1200);
        } catch { btn.textContent = "Failed"; }
      });
      pre.appendChild(btn);
    });

    // Keyboard shortcuts: J / K or arrows for next / prev
    document.addEventListener("keydown", (e) => {
      if (e.target.matches("input, textarea, select")) return;
      if (e.key === "j" || e.key === "ArrowRight") { if (next) window.location.href = "../" + next.folder + "/" + next.file; }
      if (e.key === "k" || e.key === "ArrowLeft")  { if (prev) window.location.href = "../" + prev.folder + "/" + prev.file; }
    });
  }

  // Returns href for the first lesson not yet completed, falling back to lesson 1a.
  function firstUnreadHref() {
    const progress = loadProgress();
    const first = LESSONS.find(l => !progress.has(l.id)) || LESSONS[0];
    return first.folder + "/" + first.file;
  }

  // --- Index page bootstrap ---
  function bootIndexPage() {
    const root = document.getElementById("index-parts");
    if (!root) return;
    const progress = loadProgress();

    const grouped = {};
    for (const l of LESSONS) (grouped[l.part] = grouped[l.part] || []).push(l);

    for (const part of [1, 2, 3, 4, 5]) {
      const section = document.createElement("section");
      section.className = "index-part";
      section.dataset.part = part;

      const h2 = document.createElement("h2");
      h2.textContent = PART_INFO[part].name;
      section.appendChild(h2);

      const desc = document.createElement("p");
      desc.className = "desc";
      desc.textContent = PART_INFO[part].desc;
      section.appendChild(desc);

      const bridge = document.createElement("p");
      bridge.className = "bridge";
      bridge.textContent = PART_INFO[part].bridge + "  ·  " + PART_INFO[part].time;
      section.appendChild(bridge);

      const ol = document.createElement("ol");
      for (const l of grouped[part]) {
        const li = document.createElement("li");
        li.dataset.id = l.id;
        li.dataset.title = l.title.toLowerCase();
        const a = document.createElement("a");
        a.href = l.folder + "/" + l.file;
        if (progress.has(l.id)) a.classList.add("done");

        const check = document.createElement("span");
        check.className = "check";
        check.textContent = progress.has(l.id) ? "✓" : "○";
        a.appendChild(check);

        const meta = document.createElement("span");
        meta.className = "lesson-meta";
        const num = document.createElement("span");
        num.className = "num";
        num.textContent = l.id;
        const title = document.createElement("span");
        title.className = "title";
        title.textContent = l.title;
        meta.appendChild(num);
        meta.appendChild(title);
        a.appendChild(meta);

        li.appendChild(a);
        ol.appendChild(li);
      }
      section.appendChild(ol);
      root.appendChild(section);
    }

    updateIndexProgress();

    // "Start here" CTA — point to first unread lesson
    const startBtn = document.getElementById("start-cta");
    if (startBtn) startBtn.href = firstUnreadHref();

    // Search
    const search = document.getElementById("search");
    if (search) {
      search.addEventListener("input", () => {
        const q = search.value.trim().toLowerCase();
        document.querySelectorAll(".index-part").forEach(sec => {
          let anyVisible = false;
          sec.querySelectorAll("li").forEach(li => {
            const match = !q ||
              li.dataset.title.includes(q) ||
              li.dataset.id.includes(q);
            li.classList.toggle("hidden", !match);
            if (match) anyVisible = true;
          });
          sec.classList.toggle("hidden-all", !anyVisible);
        });
      });
    }

    // Reset
    const reset = document.getElementById("reset-progress");
    if (reset) {
      reset.addEventListener("click", () => {
        if (!confirm(`Reset progress for all ${LESSONS.length} lessons?`)) return;
        saveProgress(new Set());
        document.querySelectorAll(".index-part a").forEach(a => {
          a.classList.remove("done");
          const c = a.querySelector(".check");
          if (c) c.textContent = "○";
        });
        updateIndexProgress();
        toast("Progress reset");
      });
    }
  }

  function updateIndexProgress() {
    const total = LESSONS.length;
    const progress = loadProgress();
    const done = LESSONS.filter(l => progress.has(l.id)).length;
    const label = document.getElementById("progress-label");
    const fill = document.getElementById("progress-fill");
    if (label) label.textContent = `${done} / ${total} lessons read`;
    if (fill) fill.style.width = `${(done / total) * 100}%`;
  }

  function toast(msg) {
    let t = document.getElementById("toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "toast";
      t.className = "toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._hideTimer);
    t._hideTimer = setTimeout(() => t.classList.remove("show"), 1500);
  }

  // Run the right bootstrap on load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { bootLessonPage(); bootIndexPage(); });
  } else {
    bootLessonPage(); bootIndexPage();
  }
})();
