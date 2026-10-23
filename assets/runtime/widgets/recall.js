// Recall block: flashcards for spaced review. Cards are a <dl>; progress is kept per card
// (`<blockId>#<index>`) and review.html gathers due cards across all lessons.
//
// <section class="block" data-block="recall" id="1f-08">
//   <dl>
//     <dt>Question (HTML ok)</dt>
//     <dd>Answer (HTML ok)</dd>
//   </dl>
// </section>

import { h } from "../ui.js";
import { gradeCard, isCardDue, load } from "../progress.js";

/** Extract [{ id, q, a }] from a recall block; used here and by review.html. */
export function cardsOf(block, lessonId) {
  const dts = [...block.querySelectorAll("dl > dt")];
  return dts.map((dt, i) => {
    const dd = dt.nextElementSibling;
    return { id: `${block.id}#${i}`, lessonId, q: dt.innerHTML, a: dd?.tagName === "DD" ? dd.innerHTML : "" };
  });
}

/** Renders a deck UI into `host`. onDone(stats) fires when the last card is graded. */
export function deck(host, cards, { onDone, lessonLinks = false } = {}) {
  let i = 0;
  const stats = { again: 0, good: 0 };
  const front = h("div", { class: "card-q" });
  const back = h("div", { class: "card-a", hidden: true });
  const counter = h("span", { class: "card-counter" });
  const link = h("a", { class: "card-link", hidden: !lessonLinks }, "");
  const show = h("button", { class: "btn primary", type: "button", onClick: reveal }, "Show answer");
  const again = h("button", { class: "btn bad-btn", type: "button", hidden: true, onClick: () => grade("again") }, "Again");
  const good = h("button", { class: "btn good-btn", type: "button", hidden: true, onClick: () => grade("good") }, "Good");
  const el = h("div", { class: "card", tabindex: "0" }, h("div", { class: "card-head" }, counter, link), front, back, h("div", { class: "sb-toolbar" }, show, again, good));
  el.addEventListener("keydown", (e) => {
    if (e.key === " " || e.key === "Enter") { if (back.hidden) { e.preventDefault(); reveal(); } }
    if (!back.hidden && e.key === "1") grade("again");
    if (!back.hidden && (e.key === "2" || e.key === "3")) grade("good");
  });
  host.replaceChildren(el);

  function render() {
    const c = cards[i];
    counter.textContent = `${i + 1} / ${cards.length}`;
    front.innerHTML = c.q;
    back.innerHTML = c.a;
    back.hidden = true; show.hidden = false; again.hidden = good.hidden = true;
    if (lessonLinks && c.href) { link.href = c.href; link.textContent = c.lessonId; }
    if (globalThis.Prism) Prism.highlightAllUnder(el);
  }
  function reveal() { back.hidden = false; show.hidden = true; again.hidden = good.hidden = false; good.focus(); }
  function grade(g) {
    gradeCard(cards[i].id, g);
    stats[g] += 1;
    if (i + 1 < cards.length) { i += 1; render(); }
    else {
      host.replaceChildren(h("div", { class: "card done" },
        h("p", {}, `Deck finished — ${stats.good} good, ${stats.again} again. `, stats.again ? "Cards marked “again” come back in 10 minutes." : "Next review follows the spacing schedule."),
        h("button", { class: "btn", type: "button", onClick: () => { i = 0; deck(host, cards, { onDone, lessonLinks }); } }, "Go again")));
      onDone?.(stats);
    }
  }
  render();
}

export function mount(block, ctx) {
  const cards = cardsOf(block, ctx.lesson?.id);
  if (!cards.length) return;
  const dl = block.querySelector("dl");
  dl.hidden = true; // keep the source in the DOM for review.html and the tutor agent
  const p = load();
  const due = cards.filter(c => isCardDue(p, c.id)).length;
  const host = h("div", { class: "deck" });
  const meta = h("p", { class: "deck-meta" }, `${cards.length} cards · ${due} due now · Space to flip, 1 = again, 2 = good`);
  block.append(meta, host);
  deck(host, cards, { onDone: () => { meta.textContent = `${cards.length} cards · reviewed`; block.classList.add("done"); } });
}
