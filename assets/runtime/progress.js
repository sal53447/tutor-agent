// Per-block learner progress, kept in localStorage. Pure functions over a plain object so the
// store can be unit-tested in node and exported as JSON for the tutor agent.
//
// Shape (v3):
// {
//   version: 3,
//   lessons: { "1f": { read: ISO|null, opened: ISO, counts: { exercise: 3, recall: 6 } } },
//   blocks:  { "1f-06": { passed: true, attempts: 2, lastSeen: ISO } },           // exercises + playgrounds
//   cards:   { "1f-08#2": { due: ISO, interval: 3, reps: 4, lastGrade: "good" } }  // recall cards
// }

export const KEY = "curriculum-progress-v3";
export const LEGACY_KEY = "curriculum-progress-v2";

const now = () => new Date().toISOString();

export function empty() {
  return { version: 3, lessons: {}, blocks: {}, cards: {} };
}

/** v2 was a JSON array of lesson ids marked read. Carry those over as `read`. */
export function migrateLegacy(legacyJson, at = now()) {
  const p = empty();
  try {
    for (const id of JSON.parse(legacyJson || "[]")) p.lessons[id] = { read: at, opened: at, counts: {} };
  } catch { /* ignore corrupt legacy data */ }
  return p;
}

function storage() {
  try { return globalThis.localStorage || null; } catch { return null; }
}

export function load() {
  const s = storage();
  if (!s) return empty();
  try {
    const raw = s.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p && p.version === 3) return { ...empty(), ...p };
    }
    const legacy = s.getItem(LEGACY_KEY);
    if (legacy) { const p = migrateLegacy(legacy); save(p); return p; }
  } catch { /* corrupt store → start fresh */ }
  return empty();
}

export function save(p) {
  const s = storage();
  if (s) s.setItem(KEY, JSON.stringify(p));
  return p;
}

export function reset() { return save(empty()); }

// --- Mutations. Each loads, mutates, saves, and returns the store.

export function touchLesson(id, counts) {
  const p = load();
  const l = p.lessons[id] || (p.lessons[id] = { read: null, opened: null, counts: {} });
  l.opened = now();
  if (counts) l.counts = counts;
  return save(p);
}

export function markRead(id, read = true) {
  const p = load();
  const l = p.lessons[id] || (p.lessons[id] = { read: null, opened: now(), counts: {} });
  l.read = read ? now() : null;
  return save(p);
}

export function recordBlock(blockId, passed) {
  const p = load();
  const b = p.blocks[blockId] || (p.blocks[blockId] = { passed: false, attempts: 0, lastSeen: null });
  b.attempts += 1;
  b.passed = b.passed || !!passed;
  b.lastSeen = now();
  return save(p);
}

// Recall cards: a deliberately small spaced-repetition rule. "again" → see it again in 10 minutes;
// "good" → interval grows 1 → 3 → 7 → 14 → 30 days. Enough to drive review.html without a full SM-2.
const GOOD_STEPS = [1, 3, 7, 14, 30];

export function gradeCard(cardId, grade, at = new Date()) {
  const p = load();
  const c = p.cards[cardId] || (p.cards[cardId] = { due: null, interval: 0, reps: 0, lastGrade: null });
  c.reps += 1;
  c.lastGrade = grade;
  if (grade === "again") {
    c.interval = 0;
    c.due = new Date(at.getTime() + 10 * 60 * 1000).toISOString();
  } else {
    const idx = GOOD_STEPS.indexOf(c.interval);
    c.interval = GOOD_STEPS[Math.min(idx + 1, GOOD_STEPS.length - 1)] ?? GOOD_STEPS[0];
    c.due = new Date(at.getTime() + c.interval * 24 * 60 * 60 * 1000).toISOString();
  }
  return save(p);
}

export function isCardDue(p, cardId, at = new Date()) {
  const c = p.cards[cardId];
  return !c || !c.due || new Date(c.due) <= at;
}

// --- Queries

/** Summary for one lesson: read flag plus exercise pass count against the last known total. */
export function lessonStatus(p, id) {
  const l = p.lessons[id] || { read: null, opened: null, counts: {} };
  const prefix = id + "-";
  const blocks = Object.entries(p.blocks).filter(([k]) => k.startsWith(prefix));
  const passed = blocks.filter(([, b]) => b.passed).length;
  const total = l.counts?.exercise ?? null;
  const complete = !!l.read && (total === null ? true : passed >= total);
  return { read: !!l.read, opened: !!l.opened, passed, total, complete };
}

export function exportJSON(p = load()) {
  return JSON.stringify({ ...p, exportedAt: now() }, null, 2);
}

export function importJSON(text) {
  const p = JSON.parse(text);
  if (!p || p.version !== 3) throw new Error("Not a v3 progress export");
  delete p.exportedAt;
  return save({ ...empty(), ...p });
}
