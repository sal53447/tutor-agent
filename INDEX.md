# Curriculum Index

_A five-part curriculum taking Python-fluent engineers through modern full-stack JS/TS: JavaScript → TypeScript → Express → React → Next.js. 53 lessons, all HTML, readable in any browser._

See [`README.md`](./README.md) for audience, setup, and contribution notes. Open [`index.html`](./index.html) for the interactive landing page with progress tracking and search.

---

## Part 1 — JavaScript (11 lessons)

_From primitives and functions through async and the event loop to tooling and testing — the foundations of idiomatic JavaScript._

- **1a — The Language Model** — Primitives vs references, equality (`==`, `===`, `Object.is`), truthiness, nullish coalescing (`??`), optional chaining (`?.`), and `const` as binding not immutability.
- **1b — Functions, Closures, and `this`** — Function forms (declaration, expression, arrow), hoisting and the Temporal Dead Zone (TDZ), class field arrow functions, closures for private state, and the four `this` binding rules (default, implicit, explicit, `new`).
- **1c — Objects, Prototypes, and Classes** — Object literals and computed keys, the prototype chain, classes as sugar, private fields (`#`), destructuring (objects, arrays, function parameters), spread and `Object.assign`, `hasOwnProperty` vs `in`, and `Object.hasOwn`.
- **1d — Arrays, Iteration, and Generators** — Daily methods (`map`, `filter`, `reduce`, `find`, `some`, `every`, `flat`, `flatMap`), mutable vs immutable operations (`sort` vs `toSorted`), `Map`, `Set`, the iterator protocol (`Symbol.iterator`), `for...of` vs `for...in`, and generators (`function*`, `yield`).
- **1e — Modules** — ESM (`import`, `export`, dynamic import) vs CommonJS (`require`, `module.exports`), `import.meta.url` for `__dirname`/`__filename`, named exports over default, and circular import hazards.
- **1f — Async & Concurrency** — The event loop (microtask and macrotask queues), Promise states and `.then`/`.catch`/`.finally`, `async`/`await`, combinators (`Promise.all`, `Promise.allSettled`, `Promise.race`, `Promise.any`), `AbortController`, and unhandled rejections.
- **1g — Error Handling** — Custom error subclasses, `instanceof` narrowing, `error.cause` for error chains (ES2022), async error flows, `AggregateError`, and the Result pattern as an alternative.
- **1h — Runtimes** — Node.js (file system, HTTP, full-featured), browser (DOM, no fs), and edge runtimes (V8 isolates, Web APIs only, no Node APIs), plus alternative runtimes (Deno, Bun).
- **1i — Tooling Ecosystem** — Package managers (npm, pnpm, yarn), `package.json` anatomy (`type`, `main`, `engines`), `peerDependencies`, `npx` and `pnpm dlx`, semver versioning, lockfiles, and bundlers (Vite, esbuild, Turbopack, webpack).
- **1j — Code Quality** — Prettier (formatting) vs ESLint (bugs and patterns), non-negotiable rules (`eqeqeq`, `prefer-const`, `no-floating-promises`), and Husky + lint-staged for pre-commit enforcement.
- **1k — Testing** — Vitest, Jest, and Node's built-in runner; async test traps (`await` in test bodies); `beforeEach`/`afterEach` and `beforeAll`/`afterAll`; `vi.fn()` vs `vi.spyOn()`; and testing behavior not implementation.

---

## Part 2 — TypeScript (8 lessons)

_Static type checking on top of JavaScript — from basic types through generics and type-level programming to practical patterns in React and on the backend._

- **2a — What TypeScript Actually Is** — Static type checker that compiles to plain JavaScript; types are erased at runtime and serve as a design tool, not a runtime guarantee. Structural typing means shape matches regardless of name.
- **2b — The Type System** — Primitives, literal types, unions, intersections, and discriminated unions; control flow analysis with narrowing (`typeof`, `instanceof`, `in`, truthiness checks); `unknown` vs `any` vs `never`; interfaces vs type aliases; literal unions over enums.
- **2c — Generics in Practice** — Parametrized types with inference flowing from call site through function bodies; constraints and defaults; generic components; when to reach for generics vs `unknown`.
- **2d — Type-Level Tools** — `keyof`, `typeof`, mapped types, conditional types with `infer`; utility types (`Pick`, `Omit`, `Record`, `Exclude`, `Extract`, `Parameters`, `ReturnType`, `Awaited`); `satisfies` operator for shape validation without type widening.
- **2e — tsconfig Deep Dive** — Frontend (bundler resolution) vs backend (Node/ESM resolution) configs; key flags (`strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `isolatedModules`); `paths` aliases are compile-time only.
- **2f — TS Idioms** — Type guards and assertion functions; `in` narrowing for discriminated unions; type assertions with `as`; exhaustiveness checking with `never`; `noUncheckedIndexedAccess` in practice; branded types for semantic nominal distinctions.
- **2g — TS in React** — Props typing with `ReactNode`; `useRef` with DOM refs (null initial) vs mutable refs (non-null initial); `useReducer` with discriminated union actions; Context typing and custom hooks; `ComponentPropsWithoutRef` and `ComponentPropsWithRef` for native element extension; generic hooks.
- **2h — TS on the Backend** — `@types/*` for JS libraries; Express `Request<Params, ResBody, ReqBody, Query>` generics; `RequestHandler` and `ErrorRequestHandler`; declaration merging to augment `Express.Request`; Zod for runtime validation with type inference; tRPC for end-to-end type safety; environment variable validation; Prisma and Drizzle ORM type generation.

---

## Part 3 — Express (10 lessons)

_Production APIs: HTTP fundamentals, middleware, layered architecture, runtime validation, auth, databases, observability, testing, deployment, and when to reach for alternatives._

- **3a — HTTP Fundamentals** — HTTP methods, status codes, `Cache-Control` directives, streaming with chunked transfer and Server-Sent Events (SSE), CORS, and the request/response lifecycle over the wire.
- **3b — Express Core — Routing & Middleware** — The middleware chain pattern, `express.Router` for file-based routing, `AppError` typed exceptions, request-ID correlation, and `express-rate-limit` to prevent abuse.
- **3c — Project Architecture — Where Code Lives** — Four-layer architecture (routes → controllers → services → repositories), config parsing with Zod at startup, `app.ts` factory function (testable), `server.ts` bootstrap, and dependency injection without a framework.
- **3d — Validation & Serialization** — Runtime validation with Zod schemas and `z.infer` for single-source-of-truth types, validating body/params/query, and response schemas with `.pick()` to prevent internal fields leaking to clients.
- **3e — Auth — Sessions, JWT, OAuth** — Stateful sessions with Redis store and HttpOnly cookies, stateless JWT bearer tokens with `jose`, short-lived access + refresh-token pattern, OAuth/OIDC via `openid-client`, CSRF mitigation, and RBAC/ABAC for authorization.
- **3f — Databases — ORMs, Migrations, Transactions** — Connection pooling and pool sizing, Prisma vs Drizzle vs Kysely, schema-first migrations in VCS (`prisma migrate deploy` for CI), transactions, N+1 prevention, and serverless proxy patterns.
- **3g — Observability — Logs, Metrics, Traces** — Structured logging with `pino` and `pino-http` (automatic request logging with redaction), request-ID correlation, `/healthz` liveness and `/readyz` readiness endpoints, Prometheus metrics, OpenTelemetry tracing, and Sentry error tracking.
- **3h — Testing — Unit, Integration, Supertest** — Unit tests for services (mock repos), integration tests for routes with `supertest` and fake DI, auth-protected route testing with real JWT helpers, coverage thresholds, and test-DB strategies (transaction rollback vs container per suite).
- **3i — Deployment & Ops** — Multi-stage Dockerfile with Alpine for production, `docker-compose.yml` for local dev (app + Postgres + Redis), `prisma migrate deploy` in init containers before traffic, nginx reverse proxy with SSE timeouts, multi-environment `.env` loading, and graceful shutdown on SIGTERM.
- **3j — When Express Isn't the Answer** — Fastify (2× faster, schema-first), Koa (async-first, cleaner), Hono (edge-deployed, tiny), Elysia (Bun runtime, full type inference), NestJS (opinionated DI), tRPC (end-to-end type safety without codegen), and Next.js route handlers as an alternative to a separate backend.

---

## Part 4 — React (13 lessons)

_A declarative UI library centered on concurrent rendering, Server vs Client Components, and the evolution from hooks to form Actions and the React Compiler._

- **4a — React Mental Model** — UI = f(state); unidirectional data flow; concurrent rendering; where code runs (browser vs server) in Next.js Server Components.
- **4b — Components & JSX** — Function components, JSX compiles to `React.createElement` calls, Fragments, React 19 ref-as-prop pattern (no `forwardRef` needed), composition with children and slots.
- **4c — State Primitives** — `useState` and `useReducer` for local state, immutability invariant, lazy initialization, `useRef` as non-rendering instance variable.
- **4d — useEffect Properly** — Synchronizing with external systems only, not "do something after render"; `useLayoutEffect` for DOM measurements; Strict Mode double-invocation; Next.js bridge on Server Components.
- **4e — Other Core Hooks** — `useMemo` and `useCallback` (only for referential stability), `useRef` (DOM access + instance variables), `useContext`, `useTransition`, `useDeferredValue`, `useOptimistic`, and React 19's `use()` hook (Promise/Context unwrapper).
- **4f — Custom Hooks** — Sharing stateful logic via functions that call hooks; example data-fetching hook bridging raw `useEffect` and TanStack Query.
- **4g — Server State vs Client State** — Server Components (render on server, no JS shipped) vs Client Components (`"use client"` directive), TanStack Query for API caching/invalidation, Suspense mode with `useSuspenseQuery`, SWR as lightweight alternative.
- **4h — Client State Management** — Context (rarely-changing global data), Zustand (recommended default for 2026), Redux Toolkit (complex teams), URL state via query params with `useSearchParams`.
- **4i — Forms** — `react-hook-form` + Zod for uncontrolled forms; React 19 Form Actions (`useActionState`, `useFormStatus`) paired with Next.js Server Actions; progressive enhancement.
- **4j — Styling** — Tailwind CSS dominates (utility-first, ecosystem); CSS Modules (local scoping); `clsx` + `tailwind-merge` for conditional classes; Tailwind v4 CSS-first configuration.
- **4k — Performance** — Measure first; `React.memo` + `useMemo`/`useCallback` only when needed; React Compiler (stable in 19) auto-inserts memoization; virtualization for large lists; Suspense as a performance/streaming boundary.
- **4l — Component Design Patterns** — Compound components via context; headless UI libraries (Radix, shadcn/ui); `asChild` pattern (Radix Slot) over `as` prop; Suspense + ErrorBoundary for composition.
- **4m — Testing** — React Testing Library philosophy (test as users do); Vitest as Jest-compatible runner; `customRender` with providers; MSW for intercepting network calls; RSC testing via E2E/integration.

---

## Part 5 — Next.js (11 lessons)

_Where everything converges: the rendering spectrum, Server Components, caching, Server Actions, and production patterns for the industry-standard full-stack React framework._

- **5a — The Rendering Spectrum** — CSR, SSR, SSG, ISR, and Streaming trade-offs; Partial Prerendering (PPR) for hybrid static shells with dynamic holes.
- **5b — App Router Architecture** — File-system routing, layouts, parallel routes, intercepting routes, `generateStaticParams` for static dynamic segments, and Metadata API.
- **5c — React Server Components** — Server by default with async/await, the `"use client"` waterfall problem, server components as children (escape hatch), `useFormStatus`, and serialization rules.
- **5d — Data Fetching & Caching** — Next 15's `no-store` default, `unstable_cache` with ORM examples, `revalidateTag` and `revalidatePath`, and the four-layer cache model.
- **5e — Server Actions** — `useActionState` (replacing `useFormState`), typed signatures, progressive enhancement, `redirect()`, and form mutation patterns.
- **5f — Middleware & Edge Runtime** — V8 isolate constraints, JWT verification with `jose`, rate limiting, and corrected ~50ms CPU budget (not 30s).
- **5g — Auth in Next.js** — Auth.js as the ecosystem default, three-layer defense (middleware + layout + action), JWT vs DB sessions, and CSRF protection.
- **5h — Deployment** — Vercel vs self-hosted `standalone` output, `NEXT_PUBLIC_` env vars, `next/after` for post-response work, and `instrumentation.ts` for observability.
- **5i — Production Architecture** — Service layer pattern, `server-only` and `client-only` guards, connection pooling for serverless, and structured logging with `pino`.
- **5j — Performance** — Core Web Vitals (LCP, INP, CLS), `<Image priority>` for preload, `next/dynamic` code-splitting, `next/script` strategies, and `@next/bundle-analyzer`.
- **5k — Testing** — Vitest for services/components, Playwright E2E, MSW for fetch mocking, RSC testing via service extraction, and `page.route()` for API interception.
