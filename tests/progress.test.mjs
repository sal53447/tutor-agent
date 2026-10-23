import { beforeEach, describe, expect, it } from "vitest";
import * as P from "../assets/runtime/progress.js";

// Minimal localStorage for node.
beforeEach(() => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: k => store.delete(k),
  };
});

describe("progress store", () => {
  it("starts empty", () => {
    expect(P.load()).toEqual({ version: 3, lessons: {}, blocks: {}, cards: {} });
  });

  it("migrates v2 read-lesson arrays", () => {
    localStorage.setItem(P.LEGACY_KEY, JSON.stringify(["1a", "1b"]));
    const p = P.load();
    expect(Object.keys(p.lessons)).toEqual(["1a", "1b"]);
    expect(p.lessons["1a"].read).toBeTruthy();
    expect(localStorage.getItem(P.KEY)).toContain('"version":3');
  });

  it("records blocks and computes lesson status", () => {
    P.touchLesson("1f", { exercise: 2, recall: 1 });
    P.recordBlock("1f-05", false);
    P.recordBlock("1f-05", true);
    P.recordBlock("1f-06", true);
    let st = P.lessonStatus(P.load(), "1f");
    expect(st).toMatchObject({ read: false, passed: 2, total: 2, complete: false });
    expect(P.load().blocks["1f-05"].attempts).toBe(2);
    P.markRead("1f");
    st = P.lessonStatus(P.load(), "1f");
    expect(st.complete).toBe(true);
  });

  it("complete requires read when totals are unknown", () => {
    P.markRead("2a");
    expect(P.lessonStatus(P.load(), "2a")).toMatchObject({ read: true, total: null, complete: true });
  });

  it("spaces recall cards", () => {
    const t0 = new Date("2026-01-01T00:00:00Z");
    P.gradeCard("1f-08#0", "good", t0);
    expect(P.load().cards["1f-08#0"].interval).toBe(1);
    expect(P.isCardDue(P.load(), "1f-08#0", t0)).toBe(false);
    expect(P.isCardDue(P.load(), "1f-08#0", new Date("2026-01-02T00:00:01Z"))).toBe(true);
    P.gradeCard("1f-08#0", "good", t0);
    expect(P.load().cards["1f-08#0"].interval).toBe(3);
    P.gradeCard("1f-08#0", "again", t0);
    expect(P.load().cards["1f-08#0"].interval).toBe(0);
    expect(P.isCardDue(P.load(), "1f-08#0", new Date(t0.getTime() + 11 * 60 * 1000))).toBe(true);
  });

  it("round-trips export/import", () => {
    P.markRead("3a");
    const json = P.exportJSON();
    P.reset();
    expect(P.load().lessons).toEqual({});
    P.importJSON(json);
    expect(P.load().lessons["3a"].read).toBeTruthy();
    expect(() => P.importJSON('{"version":2}')).toThrow();
  });
});
