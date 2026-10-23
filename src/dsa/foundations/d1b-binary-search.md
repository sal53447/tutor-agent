---
id: d1b
title: Binary search and its invariant
goals:
  - Write an exact-match binary search that terminates and returns the right index or -1
  - Write lower bound (first index with a[i] >= x) on a half-open [lo, hi) range, and explain lo < hi vs lo <= hi from the invariant
  - Recognise and fix the classic bugs - infinite loop from lo = mid, an off-by-one hi, float midpoint in JS
  - Apply binary search on the answer to a monotonic predicate (integer square root)
sources:
  - https://docs.python.org/3/library/bisect.html
  - https://en.wikipedia.org/wiki/Binary_search_algorithm
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Right_shift
gaps: []
---

::: concept #01
## Throw away half, keep a promise
Binary search on a sorted array compares the middle element and discards the half that cannot contain the answer. n items take at most about log2(n) + 1 probes: O(log n).

The code is easy. Getting it right is not, and the only reliable tool is a **loop invariant**: a sentence that is true before every iteration, and that you re-establish in each branch.

- **Closed range `[lo, hi]`** (both ends included). Invariant: *if `x` is in the array, its index is in `[lo, hi]`*. The range is empty when `lo > hi`, so the loop runs `while (lo <= hi)`.
- **Half-open range `[lo, hi)`** (`hi` excluded). Invariant: *the answer is in `[lo, hi]`*, where `hi` may be the "not found" slot. The range is empty when `lo == hi`, so the loop runs `while (lo < hi)`.

The loop condition is not a style choice. It is "the range still contains a candidate", written in whichever convention you picked. Every branch must also **shrink** the range, or the loop never ends.
:::

::: stepper #02 kind=array
Closed range, searching for 23. `cmp` counts three-way comparisons of `a[mid]` with `x`: the `===` and `<` tests on one probe count once.
```json
{ "code": "let lo = 0, hi = a.length - 1;\nwhile (lo <= hi) {\n  const mid = (lo + hi) >> 1;\n  if (a[mid] === x) return mid;\n  if (a[mid] < x) lo = mid + 1;\n  else hi = mid - 1;\n}\nreturn -1;",
  "steps": [
    { "label": "Whole array", "line": 1, "note": "Invariant holds trivially: if 23 is anywhere, it is in <em>[0, 8]</em>.",
      "state": { "cells": [2,5,8,12,16,23,38,56,72], "pointers": { "lo": 0, "hi": 8 }, "window": [0,8], "vars": { "x": 23, "cmp": 0 } } },
    { "label": "Probe the middle", "line": 3, "note": "<code>(0 + 8) >> 1</code> is 4.",
      "state": { "cells": [2,5,8,12,16,23,38,56,72], "pointers": { "lo": 0, "mid": 4, "hi": 8 }, "window": [0,8], "vars": { "x": 23, "cmp": 0 } } },
    { "label": "16 < 23", "line": 5, "note": "Sorted, so everything at or left of index 4 is also &lt; 23. None of it can be the answer.",
      "state": { "cells": [2,5,8,12,16,23,38,56,72], "pointers": { "lo": 0, "mid": 4, "hi": 8 }, "window": [0,8], "mark": [4], "vars": { "x": 23, "cmp": 1 } } },
    { "label": "lo = mid + 1", "line": 5, "note": "<code>mid + 1</code>, not <code>mid</code>: <code>mid</code> was just ruled out, and keeping it risks no progress.",
      "state": { "cells": [2,5,8,12,16,23,38,56,72], "pointers": { "lo": 5, "hi": 8 }, "window": [5,8], "vars": { "x": 23, "cmp": 1 } } },
    { "label": "Probe the middle", "line": 3, "note": "<code>(5 + 8) >> 1</code> is 6.",
      "state": { "cells": [2,5,8,12,16,23,38,56,72], "pointers": { "lo": 5, "mid": 6, "hi": 8 }, "window": [5,8], "vars": { "x": 23, "cmp": 1 } } },
    { "label": "38 > 23", "line": 6, "note": "Everything at or right of index 6 is too big.",
      "state": { "cells": [2,5,8,12,16,23,38,56,72], "pointers": { "lo": 5, "mid": 6, "hi": 8 }, "window": [5,8], "mark": [6], "vars": { "x": 23, "cmp": 2 } } },
    { "label": "hi = mid - 1", "line": 6, "note": "One candidate is left. <code>lo == hi</code> is still a non-empty closed range, which is why the loop uses <code>&lt;=</code>.",
      "state": { "cells": [2,5,8,12,16,23,38,56,72], "pointers": { "lo": 5, "hi": 5 }, "window": [5,5], "vars": { "x": 23, "cmp": 2 } } },
    { "label": "Probe the middle", "line": 3, "note": "<code>(5 + 5) >> 1</code> is 5.",
      "state": { "cells": [2,5,8,12,16,23,38,56,72], "pointers": { "lo": 5, "mid": 5, "hi": 5 }, "window": [5,5], "vars": { "x": 23, "cmp": 2 } } },
    { "label": "Found at 5", "line": 4, "note": "Three comparisons for nine elements. Had <code>x</code> been absent, <code>lo</code> would pass <code>hi</code> and the loop would exit with -1.",
      "state": { "cells": [2,5,8,12,16,23,38,56,72], "pointers": { "lo": 5, "mid": 5, "hi": 5 }, "window": [5,5], "mark": [5], "vars": { "x": 23, "cmp": 3 } } }
  ] }
```
:::

::: playground #03
Try: search for `72` (last cell) and `4` (absent). Then change `hi = mid - 1` to `hi = mid`: finding `23` still works, but searching for `4` never finishes and the run times out after 3 s. That is the no-progress bug from #07.
```js
function search(a, x) {
  let lo = 0, hi = a.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (a[mid] === x) return mid;
    if (a[mid] < x) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}
const a = [2, 5, 8, 12, 16, 23, 38, 56, 72];
console.log(search(a, 23), search(a, 4), search(a, 72), search([], 1));
```
```output
5 -1 8 -1
```
:::

::: concept #04
## Lower bound: the one to memorise
Exact match has a flaw: with duplicates it returns *some* matching index. The more useful primitive is **lower bound**: the first index `i` with `a[i] >= x` (or `a.length` if none). Exact search, insertion point, "how many are less than x" and range counts are all one call to it.

Use a half-open range and a one-sided test:

```js
function lowerBound(a, x) {
  let lo = 0, hi = a.length;        // answer is in [lo, hi]; hi = "none"
  while (lo < hi) {                 // non-empty: lo < hi
    const mid = (lo + hi) >> 1;     // lo <= mid < hi, so a[mid] is valid
    if (a[mid] < x) lo = mid + 1;   // a[mid] is too small: answer > mid
    else hi = mid;                  // a[mid] >= x: mid could be the answer, keep it
  }
  return lo;                        // lo == hi
}
```

Why `lo < hi`: when `lo == hi` the range `[lo, hi)` is empty and the invariant says the answer is in `[lo, lo]`, so it is `lo`. With `lo <= hi` the body runs anyway with `mid == lo == hi`. If `a[mid] >= x` (which is where every search ends up), `hi = mid` changes nothing and the loop hangs; it only escapes in the `lo = mid + 1` case, returning `lo` one too far. When the answer is `a.length` it also reads `a[a.length]`, which is `undefined`. Why `hi = mid` and not `mid - 1`: `mid` itself may be the first `>= x`, and the invariant says `hi` is a *possible answer*. Why this terminates: `lo <= mid < hi`, so `lo = mid + 1` raises `lo` and `hi = mid` lowers `hi`. The range shrinks every time.
:::

::: stepper #05 kind=array
Lower bound of 2 in an array with duplicates. `hi` is exclusive and can sit one past the last cell (dashed); the window runs to `hi - 1`.
```json
{ "code": "let lo = 0, hi = a.length;\nwhile (lo < hi) {\n  const mid = (lo + hi) >> 1;\n  if (a[mid] < x) lo = mid + 1;\n  else hi = mid;\n}\nreturn lo;",
  "steps": [
    { "label": "Whole array", "line": 1, "note": "<code>hi = 8</code> is one past the last cell: the &ldquo;every element is smaller&rdquo; answer.",
      "state": { "cells": [1,2,2,2,3,5,5,8], "pointers": { "lo": 0, "hi": 8 }, "window": [0,7], "vars": { "x": 2, "cmp": 0 } } },
    { "label": "mid = 3", "line": 3, "note": "<code>(0 + 8) >> 1</code>.",
      "state": { "cells": [1,2,2,2,3,5,5,8], "pointers": { "lo": 0, "mid": 3, "hi": 8 }, "window": [0,7], "vars": { "x": 2, "cmp": 0 } } },
    { "label": "2 is not < 2", "line": 4, "note": "<code>a[3]</code> qualifies, but an earlier 2 might too. Keep <code>mid</code> inside: <code>hi = mid</code>.",
      "state": { "cells": [1,2,2,2,3,5,5,8], "pointers": { "lo": 0, "mid": 3, "hi": 8 }, "window": [0,7], "mark": [3], "vars": { "x": 2, "cmp": 1 } } },
    { "label": "hi = 3", "line": 5, "note": "Everything from index 3 right is already known to be <code>&gt;= 2</code>.",
      "state": { "cells": [1,2,2,2,3,5,5,8], "pointers": { "lo": 0, "hi": 3 }, "window": [0,2], "vars": { "x": 2, "cmp": 1 } } },
    { "label": "mid = 1", "line": 3, "note": "<code>(0 + 3) >> 1</code>.",
      "state": { "cells": [1,2,2,2,3,5,5,8], "pointers": { "lo": 0, "mid": 1, "hi": 3 }, "window": [0,2], "vars": { "x": 2, "cmp": 1 } } },
    { "label": "2 is not < 2", "line": 4, "note": "Still qualifies, so <code>hi = 1</code>.",
      "state": { "cells": [1,2,2,2,3,5,5,8], "pointers": { "lo": 0, "mid": 1, "hi": 3 }, "window": [0,2], "mark": [1], "vars": { "x": 2, "cmp": 2 } } },
    { "label": "hi = 1", "line": 5, "note": "One candidate cell remains: index 0.",
      "state": { "cells": [1,2,2,2,3,5,5,8], "pointers": { "lo": 0, "hi": 1 }, "window": [0,0], "vars": { "x": 2, "cmp": 2 } } },
    { "label": "1 < 2", "line": 4, "note": "<code>mid = 0</code>. Too small, so the answer is strictly right of it.",
      "state": { "cells": [1,2,2,2,3,5,5,8], "pointers": { "lo": 0, "mid": 0, "hi": 1 }, "window": [0,0], "mark": [0], "vars": { "x": 2, "cmp": 3 } } },
    { "label": "lo = 1", "line": 4, "note": "<code>lo = mid + 1</code> closes the gap: <code>lo == hi</code>, an empty range.",
      "state": { "cells": [1,2,2,2,3,5,5,8], "pointers": { "lo": 1, "hi": 1 }, "window": [1,0], "vars": { "x": 2, "cmp": 3 } } },
    { "label": "lo == hi, stop", "line": 7, "note": "The invariant pins the answer to <code>[1, 1]</code>: index 1, the first 2.",
      "state": { "cells": [1,2,2,2,3,5,5,8], "pointers": { "lo": 1, "hi": 1 }, "window": [1,0], "mark": [1], "vars": { "x": 2, "cmp": 3 } } }
  ] }
```
:::

::: bridge #06
`bisect.bisect_left(a, x)` is `lowerBound(a, x)`. `bisect.bisect_right(a, x)` is **upper bound**: the first index with `a[i] > x`; change `a[mid] < x` to `a[mid] <= x`. So `bisect_right - bisect_left` counts occurrences of `x`. JS has no `bisect` in the standard library, so you write it.

> [!py] Midpoints
> Python's `(lo + hi) // 2` floors and ints never overflow. In JS `(lo + hi) / 2` is a **float**: `(0 + 5) / 2` is `2.5`, and `a[2.5]` is `undefined`, so the comparison silently goes false. Use `Math.floor((lo + hi) / 2)`, or `(lo + hi) >> 1`, which truncates to int32 and so is only safe below 2^31. `lo + ((hi - lo) >> 1)` only needs `hi - lo < 2^31`, but `lo` and `hi` themselves can be larger. Array indices fit; large numeric search spaces may not (see #11).
:::

::: concept #07
## Three bugs to recognise on sight
1. **`lo = mid` (or `hi = mid` in a closed range).** With `lo = 3, hi = 4`, `mid` is 3, so `lo = mid` changes nothing and the loop spins forever. Every branch must move a pointer *past* `mid`, unless the other pointer is exclusive and `mid` is genuinely still a candidate.
2. **Mixing conventions.** `hi = a.length` with `while (lo <= hi)` reads `a[a.length]` (`undefined`). `hi = a.length - 1` with `hi = mid` (instead of `mid - 1`) can loop forever. Pick closed or half-open, then write all four of init, condition, and both updates in that convention.
3. **Float midpoint.** Covered in the bridge. `undefined < x` is `false`, so the search drifts one way and returns -1 or the wrong slot with no error.
:::

::: exercise #08 kind=predict
What does each midpoint expression print for `lo = 0, hi = 5`? Order: float division, shift, floor.
```js
const lo = 0, hi = 5;
console.log((lo + hi) / 2, (lo + hi) >> 1, Math.floor((lo + hi) / 2));
```
```output
2.5 2 2
```
```hint
Only one of them is not an integer.
```
```explain
`/` is true division in JS, like Python 3's `/`. `>> 1` and `Math.floor` both give the `//` result for non-negative values.
```
:::

::: exercise #09 kind=fix
`search` should return an index of `x` or -1, but it never finishes on some inputs. A step counter turns the hang into an error so the tests can report it. Fix the bug.
```js
function search(a, x) {
  let lo = 0, hi = a.length - 1, steps = 0;
  while (lo <= hi) {
    if (++steps > 64) throw new Error("did not terminate");
    const mid = (lo + hi) >> 1;
    if (a[mid] === x) return mid;
    if (a[mid] < x) lo = mid;
    else hi = mid - 1;
  }
  return -1;
}
```
```js tests
test("finds every element", () => {
  const a = [1, 3, 5, 7, 9, 11];
  a.forEach((v, i) => assert.equal(search(a, v), i));
});
test("misses return -1", () => {
  assert.equal(search([1, 3, 5, 7], 4), -1);
  assert.equal(search([1, 3, 5, 7], 99), -1);
  assert.equal(search([1, 3, 5, 7], 0), -1);
});
test("empty and single", () => {
  assert.equal(search([], 1), -1);
  assert.equal(search([4], 4), 0);
  assert.equal(search([4], 5), -1);
});
```
```js solution
function search(a, x) {
  let lo = 0, hi = a.length - 1, steps = 0;
  while (lo <= hi) {
    if (++steps > 64) throw new Error("did not terminate");
    const mid = (lo + hi) >> 1;
    if (a[mid] === x) return mid;
    if (a[mid] < x) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}
```
```hint
Trace `search([1, 3, 5, 7], 7)` by hand until `lo` stops changing.
```
```hint
`a[mid]` was just compared and rejected. The range has to exclude it.
```
:::

::: exercise #17 kind=complete
Implement `binarySearch(a, x)` on a sorted array: an index of `x`, or -1. Use the closed range `[lo, hi]`. Test contract: every element is found, misses (including a target larger than all elements) return -1, no read is outside `0..length-1`, and on 1024 items you may read the array at most 11 times, so read `a[mid]` once per iteration.
```js
function binarySearch(a, x) {
  // TODO
}
```
```js tests
test("finds every element", () => {
  const a = [1, 3, 5, 7, 9, 11, 13];
  a.forEach((v, i) => assert.equal(binarySearch(a, v), i));
});
test("misses return -1", () => {
  const a = [1, 3, 5, 7];
  for (const x of [0, 2, 4, 6, 8, 99]) assert.equal(binarySearch(a, x), -1);
  assert.equal(binarySearch([], 1), -1);
});
test("never reads out of range, never needs a float index", () => {
  const bad = [];
  const base = Array.from({ length: 6 }, (_, i) => i * 2);
  const a = new Proxy(base, { get(t, k) { if (typeof k === "string" && /^[-\d.]+$/.test(k) && !(Number.isInteger(+k) && +k >= 0 && +k < t.length)) bad.push(k); return t[k]; } });
  for (const x of [-1, 0, 5, 10, 11, 100]) binarySearch(a, x);
  assert.equal(bad.length, 0, "bad index reads: " + bad.join(","));
});
test("O(log n) reads", () => {
  let reads = 0;
  const base = Array.from({ length: 1024 }, (_, i) => i * 2);
  const a = new Proxy(base, { get(t, k) { if (typeof k === "string" && /^\d+$/.test(k)) reads++; return t[k]; } });
  assert.equal(binarySearch(a, 2046), 1023);
  assert(reads <= 11, "read " + reads + " elements, expected <= 11");
});
```
```js solution
function binarySearch(a, x) {
  let lo = 0, hi = a.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const v = a[mid];
    if (v === x) return mid;
    if (v < x) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}
```
```hint
Closed range: `hi = a.length - 1`, loop while `lo <= hi`, and both updates skip `mid`.
```
```hint
The midpoint must be an integer: `Math.floor((lo + hi) / 2)`.
```
:::

::: exercise #10 kind=complete
Implement `lowerBound(a, x)`: the first index with `a[i] >= x`, or `a.length`. Use `[lo, hi)`. Test contract: results must match a linear scan, and on 1024 items you may read the array at most 11 times (`ceil(log2(1025))`), so read `a[mid]` once per iteration.
```js
function lowerBound(a, x) {
  // TODO
}
```
```js tests
test("first of duplicates", () => assert.equal(lowerBound([1, 2, 2, 2, 3], 2), 1));
test("between values", () => assert.equal(lowerBound([1, 3, 5], 4), 2));
test("before all, after all, empty", () => {
  assert.equal(lowerBound([5, 6], 1), 0);
  assert.equal(lowerBound([5, 6], 9), 2);
  assert.equal(lowerBound([], 9), 0);
});
test("agrees with a linear scan", () => {
  const a = [0, 0, 1, 3, 3, 3, 4, 8, 8, 9];
  for (let x = -1; x <= 10; x++) {
    const want = a.findIndex((v) => v >= x);
    assert.equal(lowerBound(a, x), want === -1 ? a.length : want);
  }
});
test("O(log n) reads", () => {
  let reads = 0;
  const base = Array.from({ length: 1024 }, (_, i) => i * 2);
  const a = new Proxy(base, { get(t, k) { if (typeof k === "string" && /^\d+$/.test(k)) reads++; return t[k]; } });
  assert.equal(lowerBound(a, 777), 389);
  assert(reads <= 11, "read " + reads + " elements, expected <= 11");
});
```
```js solution
function lowerBound(a, x) {
  let lo = 0, hi = a.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (a[mid] < x) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
```
```hint
Start with `hi = a.length`, not `a.length - 1`, and loop while `lo < hi`.
```
```hint
If `a[mid] < x`, the answer is right of `mid`. Otherwise `mid` is still a candidate.
```
```hint
Read `a[mid]` once per iteration; the read-count test allows 11 for 1024 items.
```
:::

::: concept #11
## Binary search on the answer
The array is not the point. Binary search works on any **monotonic predicate** over an ordered range: false, false, ..., false, true, true, ..., true. Find the first `true` and you have the answer, with no array in memory. Lower bound *is* this, with the predicate `a[i] >= x`.

Integer square root: the largest `r` with `r * r <= n`. The predicate `r * r > n` is monotonic in `r`, so find the first `r` where it holds and subtract one.

```js
function isqrt(n) {
  let lo = 0, hi = n + 1;           // first r with r*r > n lies in [0, n + 1]
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);   // not >> 1: values pass 2^31
    if (mid * mid <= n) lo = mid + 1;        // predicate false: go right
    else hi = mid;                           // predicate true: keep as candidate
  }
  return lo - 1;
}
```

The loop body is the lower-bound loop with the array read replaced by a predicate. Search space 10^15 costs about 50 steps. `>> 1` would truncate to int32 here and give wrong answers, which is the one place that shortcut bites.
:::

::: playground #16
Try: swap `Math.floor((lo + hi) / 2)` for `(lo + hi) >> 1` and rerun the last call.
```js
function isqrt(n) {
  let lo = 0, hi = n + 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (mid * mid <= n) lo = mid + 1;
    else hi = mid;
  }
  return lo - 1;
}
console.log(isqrt(99), isqrt(100), isqrt(10 ** 12));
```
```output
9 10 1000000
```
:::

::: exercise #12 kind=complete
Implement `isqrt(n)`: the largest integer `r` with `r * r <= n`, using binary search on `r`. Don't use `Math.sqrt`. Test contract: for the huge case, `n` is an object whose `valueOf` counts reads and returns 10^15, so `n + 1` and `mid * mid <= n` coerce it and each use counts. You may touch `n` at most 70 times (about 50 iterations plus setup), which a linear scan can't meet.
```js
function isqrt(n) {
  // TODO
}
```
```js tests
test("small values", () => {
  const want = [0, 1, 1, 1, 2, 2, 2, 2, 2, 3];
  want.forEach((w, n) => assert.equal(isqrt(n), w));
});
test("perfect squares and neighbours", () => {
  for (const r of [10, 1000, 94906265]) {
    assert.equal(isqrt(r * r), r);
    assert.equal(isqrt(r * r - 1), r - 1);
  }
});
test("log-many probes for a huge n", () => {
  let reads = 0;
  const n = { valueOf() { reads++; return 10 ** 15; } };
  assert.equal(isqrt(n), 31622776);
  assert(reads <= 70, "read n " + reads + " times, expected <= 70");
});
```
```js solution
function isqrt(n) {
  let lo = 0, hi = n + 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (mid * mid <= n) lo = mid + 1;
    else hi = mid;
  }
  return lo - 1;
}
```
```hint
Search `r` in `[0, n + 1)` for the first `r` where `r * r > n`.
```
```hint
Answer is `lo - 1` when the loop ends. Midpoint: `Math.floor((lo + hi) / 2)`, because `>> 1` overflows int32 for big `n`.
```
:::

::: exercise #13 kind=mcq
`lowerBound` uses `while (lo < hi)` with `hi = a.length`. A teammate changes the condition to `lo <= hi` and leaves the rest. What happens?
- [ ] Nothing, it just does one extra comparison
- [x] Once `lo == hi` the body still runs with `mid == lo`; `hi = mid` then changes nothing, so the loop hangs on almost every input
- [ ] It returns the upper bound instead of the lower bound
- [ ] It only breaks for arrays with duplicates
```explain
With `[lo, hi)` half-open, `lo == hi` means empty. Entering the body there gives `mid == lo`. If `a[mid] >= x`, `hi = mid` is a no-op, and the search always ends in that state, so it hangs. (When the answer is `a.length`, `mid` is also out of range and `a[mid]` is `undefined`.) `lo <= hi` belongs to the closed convention.
```
:::

::: review #14
- **Unsorted or wrongly sorted input.** Binary search never checks. `[10, 9, 1].sort()` is lexicographic and breaks numeric search. Sort with `(a, b) => a - b`, and use the same ordering in the search comparison.
- **Objects and strings.** `<` on objects is meaningless. Take a key function or comparator, and search the same key the data is sorted by.
- **Exact search on duplicates.** Any matching index may come back. If callers need first, last or a count, build on lower and upper bound, not on `===`.
- **Small n.** For under about 50 elements, `includes`/`indexOf` is clearer and no slower in practice. Binary search pays when the data is large and read many times, or when the "array" is a predicate.
- **Floats as the search space.** Searching a real range, loop a fixed iteration count (e.g. 60) rather than testing `lo < hi`, since `(lo + hi) / 2` can stall on adjacent doubles.
:::

::: recall #15
### What does the closed-range binary search invariant say, and what loop condition follows?
If the target exists, its index is in `[lo, hi]`. The range is empty when `lo > hi`, so loop `while (lo <= hi)`.

### What does the half-open lower-bound invariant say, and what loop condition follows?
The answer is in `[lo, hi]`: it may equal `hi` (meaning "none qualifies"), while the candidates still to test are `[lo, hi)`. That range is empty when `lo == hi`, so loop `while (lo < hi)`.

### What is lower bound, and what is the Python equivalent?
The first index `i` with `a[i] >= x` (or `a.length`). It is `bisect.bisect_left`. Upper bound (first `a[i] > x`) is `bisect_right`.

### In lower bound, why is the else branch `hi = mid` and not `mid - 1`?
`a[mid] >= x`, so `mid` itself may be the first such index. `hi` is exclusive and must stay a possible answer.

### Why does `lo = mid` cause an infinite loop?
When `hi == lo + 1`, `mid == lo`, so the assignment changes nothing. Each branch must move a pointer past `mid`.

### Why is `(lo + hi) / 2` a bug in JS, and what are two fixes?
It yields a float like 2.5, so `a[2.5]` is `undefined`. Use `Math.floor((lo + hi) / 2)` or `(lo + hi) >> 1` (int32 only, below 2^31).

### What makes a problem solvable by binary search on the answer?
A monotonic predicate over an ordered range (false...false true...true). Find the first true.

### Worst-case comparisons and extra space of iterative binary search on n items?
About log2(n) + 1 comparisons, O(1) extra space.
:::
