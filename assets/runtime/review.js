// Spaced review page: gathers recall cards from every lesson (fetch + parse), keeps the ones that
// are due, and runs them as one deck. Filter by topic with ?topic=<slug>.

import { allLessons } from "/assets/manifest.js";
import { h, applyTheme, themeButton } from "./ui.js";
import { load, isCardDue } from "./progress.js";
import { cardsOf, deck } from "./widgets/recall.js";

applyTheme();
document.querySelector(".topbar .nav-links").appendChild(themeButton());

const host = document.getElementById("review-deck");
const summary = document.getElementById("review-summary");
const topicFilter = new URL(location.href).searchParams.get("topic");
const parser = new DOMParser();

async function collect() {
  const lessons = allLessons().filter(l => !topicFilter || l.topic.slug === topicFilter);
  const all = [];
  await Promise.all(lessons.map(async (l) => {
    try {
      const html = await (await fetch(l.path)).text();
      const doc = parser.parseFromString(html, "text/html");
      for (const b of doc.querySelectorAll('section.block[data-block="recall"]'))
        for (const c of cardsOf(b, l.id)) all.push({ ...c, href: l.path, order: l.id });
    } catch (e) { console.warn("review: could not load", l.path, e); }
  }));
  all.sort((a, b) => a.order.localeCompare(b.order));
  return all;
}

const p = load();
const all = await collect();
const seen = all.filter(c => p.cards[c.id]);
const due = all.filter(c => isCardDue(p, c.id));
const dueSeen = due.filter(c => p.cards[c.id]);

const pick = h("select", {},
  h("option", { value: "due" }, `Due now (${dueSeen.length} seen + ${due.length - dueSeen.length} new)`),
  h("option", { value: "seen" }, `Everything reviewed before (${seen.length})`),
  h("option", { value: "all" }, `Every card in the curriculum (${all.length})`));
const start = h("button", { class: "btn primary", type: "button" }, "Start");
summary.replaceChildren(
  h("p", {}, `${all.length} cards across ${new Set(all.map(c => c.lessonId)).size} lessons${topicFilter ? ` (topic: ${topicFilter})` : ""}.`),
  h("div", { class: "sb-toolbar" }, pick, start));

start.addEventListener("click", () => {
  const set = pick.value === "all" ? all : pick.value === "seen" ? seen : due;
  if (!set.length) { host.replaceChildren(h("p", { class: "deck-meta" }, "Nothing to review in this set.")); return; }
  deck(host, set, { lessonLinks: true });
  host.querySelector(".card")?.focus();
});
