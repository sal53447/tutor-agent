---
id: d1a
title: Big-O by counting operations
goals:
  - Count the basic operations of a loop nest and turn the count into Big-O (drop constants and lower-order terms; sequential loops add, nested loops multiply)
  - Recognise O(1), O(log n), O(n), O(n log n), O(n^2) and O(2^n) from code shape
  - Spot hidden costs in JS built-ins - includes/indexOf in a loop, shift/unshift/splice vs push/pop, Set/Map lookups, string concatenation
  - Distinguish worst, average and amortized cost (array push growth), and state space complexity
sources:
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/shift
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
  - https://wiki.python.org/moin/TimeComplexity
  - https://en.wikipedia.org/wiki/Amortized_analysis
gaps:
  - "Engine behaviour (V8 left-trimming for shift, rope strings for +=) is stated as 'engines may optimise, the spec promises nothing'; not benchmarked here."
---

::: concept #01
## Count operations, then keep the dominant term
Big-O is a statement about how the number of basic operations grows with input size `n`. Don't reason about seconds. Count what the code does, write the count as a function of `n`, then simplify:

1. **Sequential blocks add.** A pass of `n` then a pass of `n` is `2n`.
2. **Nested blocks multiply.** `n` iterations each doing `n` work is `n * n`.
3. **Drop constants.** `2n` and `100n` are both O(n): doubling `n` doubles the work either way.
4. **Drop lower-order terms.** `n^2/2 - n/2` is O(n^2): at large `n` the square dominates.
5. **Different inputs, different letters.** A loop over `a` then a loop over `b` is O(a + b), not O(n).

O(f(n)) is an upper bound on growth, not an exact speed. It tells you what happens when `n` grows 10x or 1000x, which is where code that looked fine in testing falls over.
:::

::: stepper #02 kind=array
Count the inner body of a pair loop on 4 elements. `ops` is the number of times `ops++` has run.
```json
{ "code": "let ops = 0;\nfor (let i = 0; i < n; i++)\n  for (let j = i + 1; j < n; j++)\n    ops++;",
  "steps": [
    { "label": "Nothing counted yet", "line": 1, "note": "n = 4. The inner loop starts at <code>i + 1</code>, so each unordered pair is visited once.",
      "state": { "cells": [10,20,30,40], "pointers": { "i": 0 }, "vars": { "n": 4, "ops": 0 } } },
    { "label": "Pair (0,1)", "line": 4, "note": "i = 0 sees <code>j = 1, 2, 3</code>: three inner iterations.",
      "state": { "cells": [10,20,30,40], "pointers": { "i": 0, "j": 1 }, "mark": [0,1], "vars": { "n": 4, "ops": 1 } } },
    { "label": "Pair (0,2)", "line": 4, "note": "Same outer iteration, <code>j</code> moves right.",
      "state": { "cells": [10,20,30,40], "pointers": { "i": 0, "j": 2 }, "mark": [0,2], "vars": { "n": 4, "ops": 2 } } },
    { "label": "Pair (0,3)", "line": 4, "note": "<code>j</code> hits the end, so i = 0 contributed <code>n - 1 = 3</code>.",
      "state": { "cells": [10,20,30,40], "pointers": { "i": 0, "j": 3 }, "mark": [0,3], "vars": { "n": 4, "ops": 3 } } },
    { "label": "Pair (1,2)", "line": 4, "note": "i = 1 gets <code>n - 2 = 2</code> inner iterations.",
      "state": { "cells": [10,20,30,40], "pointers": { "i": 1, "j": 2 }, "mark": [1,2], "vars": { "n": 4, "ops": 4 } } },
    { "label": "Pair (1,3)", "line": 4, "note": "Second and last for i = 1.",
      "state": { "cells": [10,20,30,40], "pointers": { "i": 1, "j": 3 }, "mark": [1,3], "vars": { "n": 4, "ops": 5 } } },
    { "label": "Pair (2,3)", "line": 4, "note": "i = 2 gets 1; i = 3 gets 0.",
      "state": { "cells": [10,20,30,40], "pointers": { "i": 2, "j": 3 }, "mark": [2,3], "vars": { "n": 4, "ops": 6 } } },
    { "label": "6 = n(n-1)/2", "line": 4, "note": "The sum is <code>(n-1) + (n-2) + ... + 0 = n(n-1)/2 = n<sup>2</sup>/2 - n/2</code>. Drop the constant <code>1/2</code> and the lower term: O(n<sup>2</sup>). Half of n<sup>2</sup> is still quadratic.",
      "state": { "cells": [10,20,30,40], "pointers": {}, "mark": [0,1,2,3], "vars": { "n": 4, "ops": 6 } } }
  ] }
```
:::

::: concept #03
## Read the class off the code shape
| Shape | Count | Class |
|---|---|---|
| No loop; index, arithmetic, property read | constant | O(1) |
| Loop where the variable is halved (or doubled) each pass | log2 n | O(log n) |
| One pass over the input | n | O(n) |
| Sort, then one pass (`sort` is O(n log n)) | n log n + n | O(n log n) |
| Loop inside a loop, both over the input | n * n | O(n^2) |
| Recursion that calls itself twice on `n - 1` | 2^n calls | O(2^n) |

Details that decide the class:
- **Halving** is about *the variable*, not the data: `for (let m = n; m > 1; m >>= 1)` runs `floor(log2 n)` times. Binary search (next lesson) is this loop.
- A nested loop whose inner bound shrinks (`j = i + 1`) is still O(n^2), as the stepper showed.
- A nested loop whose inner bound is a *constant* (`j < 3`) is O(n).
- **Branching recursion** `fib(n) = fib(n-1) + fib(n-2)` builds a tree of calls; doubling per level gives O(2^n) (the tight bound is about 1.618^n, still exponential). Recursion that makes *one* call on `n/2` is O(log n); one call on `n - 1` is O(n).
- Space is counted the same way: the extra memory you allocate (and the recursion depth). A single `Set` of the input is O(n) space; in-place two-pointer work is O(1).
:::

::: playground #04
Count shapes instead of timing them. Try: change `8` and `16` to `16` and `32`. The `single` column doubles, `halving` gains 1, `nested` quadruples, `calls` for fib multiplies by about 1.6 per +1 of n (try `fib(20)` vs `fib(21)`).
```js
function count(n) {
  let single = 0, halving = 0, nested = 0;
  for (let i = 0; i < n; i++) single++;
  for (let m = n; m > 1; m >>= 1) halving++;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) nested++;
  return { n, single, halving, nested };
}
let calls = 0;
function fib(n) { calls++; return n < 2 ? n : fib(n - 1) + fib(n - 2); }
console.log(count(8));
console.log(count(16));
fib(20);
console.log(calls);
```
```output
{ n: 8, single: 8, halving: 3, nested: 64 }
{ n: 16, single: 16, halving: 4, nested: 256 }
21891
```
:::

::: concept #05
## Hidden costs: one line of JS, a loop underneath
Built-ins hide loops. Cost a line by what it does inside, then multiply by how many times it runs.

| Call | Cost | Note |
|---|---|---|
| `arr[i]`, `arr.push(x)`, `arr.pop()`, `arr.length` | O(1) (`push` amortized) | |
| `arr.includes(x)`, `arr.indexOf(x)`, `arr.find`, `arr.some` | O(n) | scans from the front |
| `arr.shift()`, `arr.unshift(x)` | O(n) as specified | the spec describes moving every element by one index; it states no complexity |
| `arr.splice(i, 1)` | O(n) | elements after `i` move |
| `arr.slice()`, `[...arr]`, `arr.concat`, `arr.map/filter` | O(n) | allocate a new array |
| `arr.sort()` | O(n log n) | comparison sort |
| `set.has(x)`, `map.get(k)`, `set.add(x)` | O(1) average | hash lookup; worst case is much worse, rarely met |
| `s1 + s2`, `str.slice`, `str.includes` | O(length) conceptually | |

The pattern that bites is **a linear call inside a loop over the same data**:

```js
for (const x of items) {
  if (!seen.includes(x)) seen.push(x);   // O(n) inside O(n) -> O(n^2)
}
```

It reads like one loop and costs a nested one. A `Set` turns the inner scan into one hash probe: O(n) total. The same applies to `indexOf` as a "find the partner" step (two-sum), and to `while (q.length) { q.shift() }` as a queue: each `shift` shifts every remaining element.

> [!warn] Engines may rescue you, the spec does not
> V8 can trim the front of an array cheaply and implements `+=` on strings as ropes, so both patterns can look fast in a microbenchmark. Neither is promised. Use an index (`head++`) for a queue, and collect pieces in an array and `join("")` when building a big string, so the cost doesn't depend on the engine.
:::

::: bridge #06
The same traps exist in Python, with different names for the fixes:

```py
x in some_list          # O(n)         x in some_set        # O(1) average
lst.pop(0)              # O(n)         dq.popleft()         # O(1), collections.deque
"".join(parts)          # linear       s += piece in a loop # may be quadratic
```

JS has no `deque` in the standard library. A queue is an array plus a `head` index, or a linked list. `Set`/`Map` correspond to `set`/`dict`, but `arr.includes` is the same linear scan as `x in list`, and JS `Set` iterates in insertion order. `"".join(parts)` is `parts.join("")` (separator first in Python, array first in JS). Sets of objects compare by identity in JS, so `new Set([[1],[1]]).size` is 2.
:::

::: concept #07
## Worst, average, amortized, and space
- **Worst case** is the bound for the nastiest input. `indexOf` is O(n) because the target may be last or absent. Big-O quoted without qualification usually means this.
- **Average case** assumes a distribution of inputs. A hash lookup is O(1) *on average* because keys spread across buckets; a pathological set of colliding keys makes it slower.
- **Amortized** averages over a *sequence of operations*, with no randomness involved. `push` is usually O(1), but when the backing store is full it allocates a larger one (a growth factor, not +1 slot) and copies every element: one O(n) push. Growth by a constant factor means copies happen after 1, 2, 4, 8, ... pushes, so `n` pushes copy at most about `1 + 2 + 4 + ... + n < 2n` elements in total. Total O(n) work for `n` pushes is O(1) amortized per push. Growing by a constant *amount* (+10) would copy `n^2 / 20` elements and be O(n) amortized.
- **Space complexity** is the extra memory beyond the input, as a function of `n`. Deduping with a `Set` costs O(n) space to buy O(n) time; the nested-loop version costs O(1) extra space but O(n^2) time. That trade-off is the most common one you will make.

> [!py] Python
> `list.append` is amortized O(1) for the same reason (the over-allocation factor is smaller, about 1.125). Python's `dict`/`set` average-case O(1) carries the same worst-case caveat.
:::

::: exercise #08 kind=predict
How many times does `ops++` run? Count each loop, add sequential ones, multiply nested ones.
```js
let ops = 0;
const n = 6;
for (let i = 0; i < n; i++)
  for (let j = 0; j < n; j++) ops++;
for (let k = 0; k < n; k++) ops++;
for (let m = n; m > 1; m = Math.floor(m / 2)) ops++;
console.log(ops);
```
```output
44
```
```hint
Three parts: 6 * 6, then 6, then the halving loop (m = 6, 3, then 1 stops it).
```
```explain
36 + 6 + 2 = 44. As a function of n this is `n^2 + n + log n`, which is O(n^2): the nested block dominates.
```
:::

::: exercise #09 kind=complete
Write the closed forms, with no loops: `pairOps(n)` is how many times `ops++` runs in `for i in 0..n-1, for j in i+1..n-1`, and `halvingOps(n)` is how many times `for (let m = n; m > 1; m = Math.floor(m / 2))` iterates (n >= 1). Test contract: both match the real loops for n = 1..200, and both must be O(1): the tests also check n = 10^6 (`pairOps` = 499999500000, `halvingOps` = 19), a size where a quadratic loop would time out.
```js
function pairOps(n) {
  // TODO
}
function halvingOps(n) {
  // TODO
}
```
```js tests
test("pairOps matches the loop", () => {
  for (let n = 1; n <= 200; n++) {
    let ops = 0;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) ops++;
    assert.equal(pairOps(n), ops);
  }
});
test("halvingOps matches the loop", () => {
  for (let n = 1; n <= 200; n++) {
    let ops = 0;
    for (let m = n; m > 1; m = Math.floor(m / 2)) ops++;
    assert.equal(halvingOps(n), ops);
  }
});
test("constant time at n = 10^6", () => {
  assert.equal(pairOps(1e6), 499999500000);
  assert.equal(halvingOps(1e6), 19);
});
```
```js solution
function pairOps(n) {
  return n * (n - 1) / 2;
}
function halvingOps(n) {
  return 31 - Math.clz32(n);
}
```
```hint
The pair count is (n-1) + (n-2) + ... + 0.
```
```hint
Halving count is floor(log2 n). `Math.clz32(n)` counts leading zero bits of a 32-bit int, so the highest set bit is at position `31 - clz32(n)`.
```
:::

::: exercise #10 kind=fix
`twoSum(nums, target)` returns indices `[i, j]` with `i < j` and `nums[i] + nums[j] === target`. It works but is O(n^2): `indexOf` is a hidden loop. Make it O(n) with a `Map` from value to index. Test contract: correct answers, and on 2000 elements the input array may be read at most 8000 times in total (4 per element). The test counts every element read through a Proxy, so any quadratic approach (`indexOf`, `findIndex`, `some`, `filter`, a manual inner loop) fails; the O(n^2) version reads about 2,000,000.
```js
function twoSum(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    const j = nums.indexOf(target - nums[i], i + 1);
    if (j !== -1) return [i, j];
  }
  return null;
}
```
```js tests
test("small cases", () => {
  assert.equal(twoSum([2, 7, 11, 15], 9), [0, 1]);
  assert.equal(twoSum([3, 2, 4], 6), [1, 2]);
  assert.equal(twoSum([3, 3], 6), [0, 1]);
  assert.equal(twoSum([1, 2, 3], 100), null);
});
test("at most 4 reads per element on a big input", () => {
  const n = 2000;
  let reads = 0;
  const base = Array.from({ length: n }, (_, i) => i * 2);
  const nums = new Proxy(base, { get(t, k) { if (typeof k === "string" && /^\d+$/.test(k)) reads++; return t[k]; } });
  assert.equal(twoSum(nums, (n - 2) * 2 + (n - 1) * 2), [n - 2, n - 1]);
  assert(reads <= 8000, "read " + reads + " elements, expected <= 8000");
});
```
```js solution
function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const j = seen.get(target - nums[i]);
    if (j !== undefined) return [j, i];
    seen.set(nums[i], i);
  }
  return null;
}
```
```hint
For each `x`, you need to know "have I already seen `target - x`, and where?" That is a lookup, not a scan.
```
```hint
Check the map before inserting `x`, so an element never pairs with itself. Return `[earlierIndex, i]`.
```
:::

::: exercise #11 kind=complete
Implement a FIFO `Queue` with `push(x)`, `shift()` (returns `undefined` when empty) and `get size()`. Test contract: it must never call `Array.prototype.shift`, `unshift` or `splice` (the test spies on them), and 100,000 pushes then 100,000 shifts must return items in order. Use a `head` index. Bonus: memory of consumed items is not freed in the simple version, which is a space trade-off worth noticing.
```js
class Queue {
  constructor() { this.items = []; }
  push(x) { this.items.push(x); }
  shift() {
    // TODO
  }
  get size() { return this.items.length; }
}
```
```js tests
test("fifo order and empty", () => {
  const q = new Queue();
  assert.equal(q.shift(), undefined);
  q.push(1); q.push(2);
  assert.equal(q.size, 2);
  assert.equal(q.shift(), 1);
  q.push(3);
  assert.equal(q.shift(), 2);
  assert.equal(q.shift(), 3);
  assert.equal(q.shift(), undefined);
  assert.equal(q.size, 0);
});
test("no O(n) array methods, 100k items", () => {
  const calls = [];
  const names = ["shift", "unshift", "splice"];
  const orig = names.map((k) => Array.prototype[k]);
  names.forEach((k, i) => { Array.prototype[k] = function (...a) { calls.push(k); return orig[i].apply(this, a); }; });
  try {
    const q = new Queue();
    const n = 100000;
    for (let i = 0; i < n; i++) q.push(i);
    let ok = true;
    for (let i = 0; i < n; i++) if (q.shift() !== i) ok = false;
    assert(ok, "wrong order");
    assert.equal(calls.length, 0, "called " + calls[0]);
  } finally { names.forEach((k, i) => { Array.prototype[k] = orig[i]; }); }
});
```
```js solution
class Queue {
  constructor() { this.items = []; this.head = 0; }
  push(x) { this.items.push(x); }
  shift() {
    if (this.head >= this.items.length) return undefined;
    return this.items[this.head++];
  }
  get size() { return this.items.length - this.head; }
}
```
```hint
Keep a `head` index instead of removing from the front: read `items[head]` and increment.
```
```hint
`size` must now be `items.length - head`, and `shift` on an empty queue must not move `head` past the end.
```
:::

::: exercise #12 kind=complete
Implement `power(x, e, mul)`: `x` raised to the integer `e >= 0` using only the supplied `mul(a, b)` to multiply (and `1` as the identity), by repeated squaring. Test contract: the result is correct, and for `e = 1,000,000` you may call `mul` at most 45 times (about `2 * log2(e)`). A loop that multiplies `e` times fails.
```js
function power(x, e, mul) {
  // TODO
}
```
```js tests
const P = 1000007;
const mulMod = (a, b) => (a * b) % P;
test("small exponents", () => {
  for (let e = 0; e <= 20; e++) {
    let want = 1;
    for (let k = 0; k < e; k++) want = (want * 3) % P;
    assert.equal(power(3, e, mulMod), want);
  }
});
test("log-many multiplications", () => {
  let calls = 0;
  const mul = (a, b) => { calls++; return mulMod(a, b); };
  let want = 1;
  for (let k = 0; k < 1000000; k++) want = (want * 3) % P;
  assert.equal(power(3, 1000000, mul), want);
  assert(calls <= 45, "mul called " + calls + " times, expected <= 45");
});
```
```js solution
function power(x, e, mul) {
  let result = 1, base = x;
  while (e > 0) {
    if (e % 2 === 1) result = mul(result, base);
    base = mul(base, base);
    e = Math.floor(e / 2);
  }
  return result;
}
```
```hint
x^e = (x^2)^(e/2) when e is even; when e is odd, peel off one factor of x first.
```
```hint
Loop while `e > 0`: if the low bit is set multiply it into `result`, always square `base`, then halve `e`. That is a halving loop.
```
:::

::: exercise #13 kind=mcq
Which code is O(n log n)?
- [ ] `for (const x of a) if (!seen.includes(x)) seen.push(x)`
- [x] `const s = [...a].sort((p, q) => p - q); for (let i = 1; i < s.length; i++) if (s[i] === s[i-1]) return true;`
- [ ] `for (let i = 1; i < n; i *= 2) work()`
- [ ] `function f(n) { return n < 1 ? 0 : f(n - 1) + f(n - 1) }`
```explain
The sort is O(n log n) and the scan after it is O(n), so the sum is O(n log n). The first is O(n^2) because `includes` is a hidden O(n) loop. The third is a doubling loop, O(log n). The fourth makes two calls per level, O(2^n).
```
:::

::: exercise #14 kind=mcq
A dynamic array doubles its capacity when full and copies all elements. What is the cost of `n` calls to `push`, and why?
- [ ] O(n^2), because a single push can cost O(n) and there are n of them
- [x] O(n) total, so O(1) amortized per push: copies happen at sizes 1, 2, 4, ..., and those sum to less than 2n
- [ ] O(n log n), one doubling per power of two and each doubling costs n
- [ ] O(1) per push in the worst case, because the copy is done by the engine in native code
```explain
The expensive pushes are rare and geometrically spaced; their total copy cost is a geometric series bounded by 2n. "Worst case per push is O(n)" is true and "n times that" is a valid but loose upper bound, which is why amortized analysis exists. Native code doesn't change the asymptotics. Growing by a fixed +k instead of a factor would indeed give O(n^2) total.
```
:::

::: exercise #17 kind=complete
Finish `DynArray.push`: store `x`; when the array is full, call `this.resize(newCap)` first. `resize` copies the elements and counts each copy in `this.copies`. Choose `newCap` so the amortized cost is O(1). Test contract: after 1000 pushes the contents are right, `length` is 1000, and `copies <= 2000` (2n). Growing by a fixed +10 copies about 50,000 and fails.
```js
class DynArray {
  constructor() { this.data = new Array(1); this.cap = 1; this.length = 0; this.copies = 0; }
  resize(newCap) {
    const next = new Array(newCap);
    for (let i = 0; i < this.length; i++) { next[i] = this.data[i]; this.copies++; }
    this.data = next; this.cap = newCap;
  }
  push(x) {
    // TODO
  }
  get(i) { return this.data[i]; }
}
```
```js tests
test("contents and length", () => {
  const d = new DynArray();
  for (let i = 0; i < 1000; i++) d.push(i * 3);
  assert.equal(d.length, 1000);
  for (let i = 0; i < 1000; i++) assert.equal(d.get(i), i * 3);
});
test("copies <= 2n for n pushes", () => {
  const d = new DynArray();
  for (let i = 0; i < 1000; i++) d.push(i);
  assert(d.copies <= 2000, "copied " + d.copies + " elements, expected <= 2000");
});
```
```js solution
class DynArray {
  constructor() { this.data = new Array(1); this.cap = 1; this.length = 0; this.copies = 0; }
  resize(newCap) {
    const next = new Array(newCap);
    for (let i = 0; i < this.length; i++) { next[i] = this.data[i]; this.copies++; }
    this.data = next; this.cap = newCap;
  }
  push(x) {
    if (this.length === this.cap) this.resize(this.cap * 2);
    this.data[this.length++] = x;
  }
  get(i) { return this.data[i]; }
}
```
```hint
Resize only when `length === cap`, then store at `data[length]` and bump `length`.
```
```hint
The new capacity must be a multiple of the old one (e.g. `cap * 2`), not `cap + k`.
```
:::

::: exercise #18 kind=mcq
Two ways to dedupe an array of n numbers: (A) a `Set` of seen values, (B) a nested loop comparing each item with the earlier ones, with no extra collections besides the output. Which is right?
- [ ] A is O(n) time and O(1) extra space
- [x] A is O(n) time and O(n) extra space; B is O(n^2) time and, beyond the output, O(1) extra space
- [ ] Both are O(n) time; A just has a smaller constant
- [ ] B uses more space because it makes more comparisons
```explain
Comparisons cost time, not space. The Set holds up to n values (O(n) extra) and buys O(1) lookups; the nested loop keeps only a few indices (O(1) extra) and pays O(n^2) time.
```
:::

::: exercise #19 kind=mcq
You build a string from 1,000,000 pieces. Which statement is the safe one to rely on?
- [ ] `s += piece` in a loop is always O(n^2) in JS, so never use it
- [ ] `s += piece` is always O(1) per step, so `join` is only style
- [x] Collect the pieces in an array and `join("")` once: the cost is linear regardless of how the engine handles `+=`
- [ ] `parts.unshift(piece)` then `join("")` is equivalent, since both are linear
```explain
Engines may implement `+=` with ropes and make it fast, but the language doesn't promise it, and flattening the rope (indexing, regex) can bring the cost back. `join` is portable. `unshift` is O(n) per call as specified, which makes that variant quadratic.
```
:::

::: review #15
- **Complexity is invisible in tests.** A quadratic dedupe passes every unit test on 20 items and times out on 200,000 in production. Put `n` in the review question: "what is the largest input this handles, and which line dominates?"
- **Linear call inside a loop.** `includes`, `indexOf`, `find`, `splice`, `slice`, spread (`[...acc, x]` in a `reduce` is O(n^2)) and `Object.keys(obj).length` inside a loop over the same data. Hoist into a `Set`/`Map` built once.
- **`shift()` as a queue.** Fine for ten items, a stall for a million. Use a head index or a ring buffer.
- **Hash lookups are average-case.** Adversarial keys (user-controlled input hashed into a table) can degrade it, and `Map`/`Set` still cost O(n) memory.
- **Constants matter below the crossover.** For tiny `n`, `includes` on a 10-element array beats a `Set`. Big-O says what wins as `n` grows, not at `n = 10`; measure when it matters.
:::

::: recall #16
### What do you do to a count like n^2/2 + 3n + 7 to get its Big-O?
Drop the constant factors and lower-order terms: O(n^2).

### Sequential loops add and nested loops multiply. What is `for i<n { for j<n {...} }; for k<n {...}`?
n^2 + n, which is O(n^2): the dominant term wins.

### What code shape gives O(log n)?
A loop that halves (or doubles) a variable each pass, e.g. `for (m = n; m > 1; m >>= 1)`, or recursion on half the input.

### Why is `if (!seen.includes(x)) seen.push(x)` inside a loop O(n^2), and what is the fix?
`includes` scans the array: O(n) per call inside an O(n) loop. Use a `Set` (`has`/`add` are O(1) average) for O(n) total.

### Why is `arr.shift()` a bad queue pop, and what do you use instead?
O(n) as specified (the spec describes moving every element; it states no complexity): each remaining element moves down one index. Use a `head` index (or a ring buffer/linked list); Python's `deque.popleft()` is the analogue.

### What does "amortized O(1)" mean for `push`?
Occasional O(n) resizes (capacity grows by a constant factor) are spread over many pushes: n pushes cost O(n) total, so O(1) each on average with no randomness.

### Why is naive recursive fib O(2^n)?
Each call makes two calls on smaller inputs, so the call tree doubles per level. Memoising makes it O(n).

### Worst, average, amortized: what differs?
Worst: the nastiest single input. Average: over a distribution of inputs (e.g. hash lookup). Amortized: over a sequence of operations on the same structure, guaranteed.
:::
