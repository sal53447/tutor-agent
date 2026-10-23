// The curriculum manifest — the single source of truth for what exists and in what order.
// topic → section → lesson. Sections are grouping only: moving a lesson between sections
// means editing this file (and moving the file to match, so disk mirrors the tree).
//
// Lesson files live at content/<topic.slug>/<section.slug>/<lesson.file>.
// Lesson ids are stable and used for progress keys and block ids (`1f-03`) — never reuse one.

export const CURRICULUM = {
  title: "JS / TS / Express / React / Next.js — for Python engineers",
  topics: [
    {
      id: "js", slug: "javascript", title: "JavaScript",
      desc: "The language itself. Eleven lessons — the deepest topic; everything else stands on this.",
      bridge: "Start here. No prerequisites beyond general programming experience.",
      time: "~4–5 hours",
      runs: "browser",
      sections: [
        { slug: "language-core", title: "Language core", lessons: [
          { id: "1a", file: "1a-language-model.html",            title: "Language model — history, runtime, values, equality" },
          { id: "1b", file: "1b-functions-scope.html",           title: "Functions, closures, and this" },
          { id: "1c", file: "1c-objects-prototypes-classes.html", title: "Objects, prototypes, classes" },
          { id: "1d", file: "1d-arrays-iteration.html",          title: "Arrays, iteration, generators" },
          { id: "1e", file: "1e-modules.html",                   title: "Modules — ESM vs CommonJS" },
        ]},
        { slug: "async-and-errors", title: "Async & errors", lessons: [
          { id: "1f", file: "1f-async-event-loop.html",          title: "Async & concurrency — the event loop" },
          { id: "1g", file: "1g-error-handling.html",            title: "Error handling" },
        ]},
        { slug: "platform-and-tooling", title: "Platform & tooling", lessons: [
          { id: "1h", file: "1h-runtimes.html",                  title: "Runtimes — Node, browser, edge" },
          { id: "1i", file: "1i-tooling.html",                   title: "Tooling ecosystem" },
          { id: "1j", file: "1j-code-quality.html",              title: "Code quality — ESLint & Prettier" },
          { id: "1k", file: "1k-testing.html",                   title: "Testing — philosophy and tools" },
        ]},
      ],
    },
    {
      id: "ts", slug: "typescript", title: "TypeScript",
      desc: "Structural types bolted onto JS. Eight lessons covering the type system, generics, and real idioms.",
      bridge: "Structural typing maps directly onto the object shapes you learned in JavaScript.",
      time: "~2–3 hours",
      runs: "browser",
      sections: [
        { slug: "type-system", title: "The type system", lessons: [
          { id: "2a", file: "2a-what-ts-is.html",                title: "What TypeScript actually is" },
          { id: "2b", file: "2b-type-system.html",               title: "The type system" },
          { id: "2c", file: "2c-generics.html",                  title: "Generics in practice" },
          { id: "2d", file: "2d-type-level-tools.html",          title: "Type-level tools" },
        ]},
        { slug: "practice", title: "TS in practice", lessons: [
          { id: "2e", file: "2e-tsconfig.html",                  title: "tsconfig deep dive" },
          { id: "2f", file: "2f-ts-idioms.html",                 title: "TS idioms" },
          { id: "2g", file: "2g-ts-in-react.html",               title: "TS in React" },
          { id: "2h", file: "2h-ts-on-backend.html",             title: "TS on the backend" },
        ]},
      ],
    },
    {
      id: "express", slug: "express", title: "Express",
      desc: "Backend design beyond Express itself. Ten lessons — architecture, auth, databases, observability, deployment.",
      bridge: "You now write TypeScript on the server. Lesson 2h bridges the gap.",
      time: "~3–4 hours",
      runs: "simulated",
      sections: [
        { slug: "http-and-routing", title: "HTTP & routing", lessons: [
          { id: "3a", file: "3a-http-fundamentals.html",         title: "HTTP fundamentals" },
          { id: "3b", file: "3b-routing-middleware.html",        title: "Express core — routing & middleware" },
          { id: "3c", file: "3c-project-architecture.html",      title: "Project architecture" },
        ]},
        { slug: "data-and-auth", title: "Data & auth", lessons: [
          { id: "3d", file: "3d-validation.html",                title: "Validation & serialization" },
          { id: "3e", file: "3e-auth.html",                      title: "Auth — sessions, JWT, OAuth" },
          { id: "3f", file: "3f-databases.html",                 title: "Databases — ORMs, migrations, transactions" },
        ]},
        { slug: "operating", title: "Operating a service", lessons: [
          { id: "3g", file: "3g-observability.html",             title: "Observability — logs, metrics, traces" },
          { id: "3h", file: "3h-testing.html",                   title: "Testing — unit, integration, supertest" },
          { id: "3i", file: "3i-deployment.html",                title: "Deployment & ops" },
          { id: "3j", file: "3j-alternatives.html",              title: "When Express isn't the answer" },
        ]},
      ],
    },
    {
      id: "react", slug: "react", title: "React",
      desc: "The production patterns, not just hooks. Thirteen lessons — state, effects, forms, performance, component design.",
      bridge: "Assumes fluency in JS and TS; backend context from Express helps but isn't required.",
      time: "~4–5 hours",
      runs: "browser",
      sections: [
        { slug: "model", title: "Mental model", lessons: [
          { id: "4a", file: "4a-mental-model.html",              title: "React mental model" },
          { id: "4b", file: "4b-components-jsx.html",            title: "Components & JSX" },
        ]},
        { slug: "hooks", title: "Hooks", lessons: [
          { id: "4c", file: "4c-state-primitives.html",          title: "State primitives — useState, useReducer" },
          { id: "4d", file: "4d-use-effect.html",                title: "useEffect properly" },
          { id: "4e", file: "4e-other-hooks.html",               title: "Other core hooks" },
          { id: "4f", file: "4f-custom-hooks.html",              title: "Custom hooks" },
        ]},
        { slug: "state-and-forms", title: "State & forms", lessons: [
          { id: "4g", file: "4g-server-vs-client-state.html",    title: "Server state vs client state" },
          { id: "4h", file: "4h-client-state.html",              title: "Client state management" },
          { id: "4i", file: "4i-forms.html",                     title: "Forms — react-hook-form + Zod" },
        ]},
        { slug: "production", title: "Production React", lessons: [
          { id: "4j", file: "4j-styling.html",                   title: "Styling — Tailwind, CSS Modules" },
          { id: "4k", file: "4k-performance.html",               title: "Performance — profiling, memoization" },
          { id: "4l", file: "4l-component-design.html",          title: "Component design patterns" },
          { id: "4m", file: "4m-testing.html",                   title: "Testing — React Testing Library" },
        ]},
      ],
    },
    {
      id: "nextjs", slug: "nextjs", title: "Next.js",
      desc: "The modern React framework. Eleven lessons — App Router, Server Components, caching, server actions, deployment.",
      bridge: "Unifies Express's server-side patterns with React's component patterns into one framework.",
      time: "~3–4 hours",
      runs: "simulated",
      sections: [
        { slug: "rendering", title: "Rendering", lessons: [
          { id: "5a", file: "5a-rendering-spectrum.html",        title: "The rendering spectrum" },
          { id: "5b", file: "5b-app-router.html",                title: "App Router architecture" },
          { id: "5c", file: "5c-server-components.html",         title: "React Server Components" },
        ]},
        { slug: "data-and-actions", title: "Data & actions", lessons: [
          { id: "5d", file: "5d-data-caching.html",              title: "Data fetching & caching" },
          { id: "5e", file: "5e-server-actions.html",            title: "Server Actions" },
          { id: "5f", file: "5f-middleware-edge.html",           title: "Middleware & edge runtime" },
        ]},
        { slug: "shipping", title: "Shipping", lessons: [
          { id: "5g", file: "5g-auth.html",                      title: "Auth in Next.js" },
          { id: "5h", file: "5h-deployment.html",                title: "Deployment — Vercel vs self-hosted" },
          { id: "5i", file: "5i-production-architecture.html",   title: "Production architecture" },
          { id: "5j", file: "5j-performance.html",               title: "Performance — Core Web Vitals" },
          { id: "5k", file: "5k-testing.html",                   title: "Testing Next.js apps" },
        ]},
      ],
    },
  ],
};

// --- Derived views. Everything downstream (nav, progress, validator, indexer) uses these, not the tree directly.

/** Flat ordered list of lessons, each annotated with its topic, section, and site-root path. */
export function allLessons() {
  const out = [];
  for (const topic of CURRICULUM.topics)
    for (const section of topic.sections)
      for (const lesson of section.lessons)
        out.push({ ...lesson, topic, section, path: `/content/${topic.slug}/${section.slug}/${lesson.file}` });
  return out;
}

export function findLesson(id) {
  return allLessons().find(l => l.id === id) || null;
}

/** Previous and next lesson across section and topic boundaries. */
export function neighbours(id) {
  const list = allLessons();
  const i = list.findIndex(l => l.id === id);
  return { prev: list[i - 1] || null, next: list[i + 1] || null, index: i, total: list.length };
}
