# Curriculum Index

_Data structures & algorithms, taught in JavaScript to an engineer with a Python background. Lessons are Markdown sources under `src/`, rendered to interactive pages (`npm run dev` → http://localhost:8080). Order and ids come from `assets/manifest.js`; see `CLAUDE.md` for how it's built._

---

## Data structures & algorithms (2 lessons) — `src/dsa/`

### Foundations — `foundations/`

- **d1a — Big-O by counting operations** — Counting operations in loop nests (add sequential, multiply nested, drop constants), shape → class (O(1) … O(2ⁿ)), hidden costs of `includes`/`indexOf`/`shift`/`splice`/string `+=`, Set/Map average O(1), worst vs average vs amortized (doubling array), space complexity; `x in set` and `deque.popleft()` bridges. Steps through an n² pair loop; read-counting tests force O(n).
- **d1b — Binary search and its invariant** — Exact-match search, lower bound on a half-open `[lo, hi)` range, choosing `lo < hi` vs `lo <= hi` from the loop invariant, the `lo = mid` infinite loop, float midpoint and overflow-safe `>> 1`, binary search on the answer (integer square root); `bisect_left`/`bisect_right` bridge. Steps through each probe; counted-reads tests enforce O(log n).
