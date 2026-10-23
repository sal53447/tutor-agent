// The curriculum manifest — the single source of truth for what exists and in what order.
// topic → section → lesson. Sections are grouping only: moving a lesson between sections
// means editing this file (and moving the file to match, so disk mirrors the tree).
//
// Lesson sources live at src/<topic.slug>/<section.slug>/<id>-<slug>.md; `npm run build` renders
// them to content/<topic.slug>/<section.slug>/<lesson.file> (generated, gitignored).
// Lesson ids are stable and used for progress keys and block ids (`d1b-03`) — never reuse one.

export const CURRICULUM = {
  title: "Data structures & algorithms — for a Python engineer, in JavaScript",
  topics: [
    {
      id: "dsa", slug: "dsa", title: "Data structures & algorithms",
      desc: "Two lessons so far — the pilot for the source-format pipeline.",
      bridge: "Code is JavaScript (runs in the page); Python bridges where the idiom differs.",
      time: "~1 hour",
      runs: "browser",
      sections: [
        { slug: "foundations", title: "Foundations", lessons: [
          { id: "d1a", file: "d1a-big-o.html",          title: "Big-O by counting operations" },
          { id: "d1b", file: "d1b-binary-search.html",  title: "Binary search and its invariant" },
        ]},
      ],
    },
  ],
};

// --- Derived views. Everything downstream (nav, progress, validator, indexer) uses these, not the tree directly.

/** Flat ordered list of lessons, each annotated with its topic, section, site-root path and source path. */
export function allLessons() {
  const out = [];
  for (const topic of CURRICULUM.topics)
    for (const section of topic.sections)
      for (const lesson of section.lessons)
        out.push({ ...lesson, topic, section,
          path: `/content/${topic.slug}/${section.slug}/${lesson.file}`,
          src: `src/${topic.slug}/${section.slug}/${lesson.file.replace(/\.html$/, ".md")}` });
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
