import { describe, expect, it } from "vitest";
import { CURRICULUM, allLessons, findLesson, neighbours } from "../assets/manifest.js";
import { layoutRows } from "../assets/runtime/widgets/diagram.js";

describe("manifest", () => {
  it("has unique ids and files", () => {
    const ls = allLessons();
    expect(new Set(ls.map(l => l.id)).size).toBe(ls.length);
    expect(new Set(ls.map(l => l.path)).size).toBe(ls.length);
    for (const l of ls) expect(l.file.startsWith(l.id + "-")).toBe(true);
  });

  it("walks prev/next", () => {
    const ls = allLessons();
    expect(neighbours(ls[0].id).prev).toBeNull();
    expect(neighbours(ls.at(-1).id).next).toBeNull();
    for (let i = 1; i < ls.length; i++) expect(neighbours(ls[i].id).prev.id).toBe(ls[i - 1].id);
  });

  it("builds site and source paths from topic/section slugs", () => {
    expect(findLesson("d1b").path).toBe("/content/dsa/foundations/d1b-binary-search.html");
    expect(findLesson("d1b").src).toBe("src/dsa/foundations/d1b-binary-search.md");
    expect(CURRICULUM.topics.map(t => t.slug)).toContain("dsa");
  });
});

describe("diagram layout", () => {
  it("derives rows from edge depth and honours explicit rows", () => {
    const rows = layoutRows(
      [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d", row: 0 }],
      [{ from: "a", to: "b" }, { from: "b", to: "c" }, { from: "a", to: "c" }]);
    expect(rows.map(r => r.map(n => n.id))).toEqual([["a", "d"], ["b"], ["c"]]);
  });

  it("survives cycles", () => {
    const rows = layoutRows([{ id: "a" }, { id: "b" }], [{ from: "a", to: "b" }, { from: "b", to: "a" }]);
    expect(rows.flat().length).toBe(2);
  });
});
