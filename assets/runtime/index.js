// Landing page: topic → section → lesson tree with progress, search, start-here, progress export/import.

import { CURRICULUM, allLessons } from "/assets/manifest.js";
import { h, toast, applyTheme, themeButton } from "./ui.js";
import { load, reset, lessonStatus, exportJSON, importJSON, isCardDue } from "./progress.js";

applyTheme();

const root = document.getElementById("index-topics");
const p = load();
const lessons = allLessons();

function lessonRow(l) {
  const st = lessonStatus(p, l.id);
  const a = h("a", { href: l.path, class: st.complete ? "done" : st.read ? "read" : "" },
    h("span", { class: "check" }, st.complete ? "✓" : st.read ? "◐" : "○"),
    h("span", { class: "lesson-meta" }, h("span", { class: "num" }, l.id), h("span", { class: "title" }, l.title),
      st.total ? h("span", { class: "ex-count" }, `${st.passed}/${st.total} ex`) : null));
  return h("li", { dataset: { id: l.id, title: l.title.toLowerCase(), topic: l.topic.slug } }, a);
}

for (const topic of CURRICULUM.topics) {
  const tl = lessons.filter(l => l.topic === topic);
  const done = tl.filter(l => lessonStatus(p, l.id).complete).length;
  const sec = h("section", { class: "index-part", dataset: { topic: topic.slug } },
    h("h2", {}, topic.title, h("span", { class: "part-progress" }, `${done} / ${tl.length}`)),
    h("p", { class: "desc" }, topic.desc),
    h("p", { class: "bridge" }, `${topic.bridge}  ·  ${topic.time}  ·  ${topic.runs === "browser" ? "runs in your browser" : "simulated runtime"}`),
    ...topic.sections.map(s => h("div", { class: "index-section" },
      h("h3", {}, s.title),
      h("ol", {}, s.lessons.map(id => lessonRow(tl.find(l => l.id === id.id))))))
  );
  root.appendChild(sec);
}

// Overall progress + start CTA
const completed = lessons.filter(l => lessonStatus(p, l.id).complete).length;
document.getElementById("progress-label").textContent = `${completed} / ${lessons.length} lessons complete`;
document.getElementById("progress-fill").style.width = `${(completed / lessons.length) * 100}%`;
const first = lessons.find(l => !lessonStatus(p, l.id).complete) || lessons[0];
const cta = document.getElementById("start-cta");
cta.href = first.path;
cta.textContent = completed ? `Continue with ${first.id} →` : `Start with lesson ${first.id} →`;

// Due recall cards (only known for lessons already opened — cards register when a lesson loads)
const due = Object.keys(p.cards).filter(id => isCardDue(p, id)).length;
const reviewLink = document.getElementById("review-link");
if (reviewLink && due) reviewLink.textContent = `Review (${due} due)`;

// Search
document.getElementById("search").addEventListener("input", (e) => {
  const q = e.target.value.trim().toLowerCase();
  document.querySelectorAll(".index-part").forEach(sec => {
    let any = false;
    sec.querySelectorAll("li").forEach(li => {
      const match = !q || li.dataset.title.includes(q) || li.dataset.id.includes(q) || li.dataset.topic.includes(q);
      li.classList.toggle("hidden", !match);
      if (match) any = true;
    });
    sec.classList.toggle("hidden-all", !any);
  });
});

// Reset / export / import
document.getElementById("reset-progress").addEventListener("click", () => {
  if (!confirm("Reset all progress (lessons, exercises, recall cards)?")) return;
  reset(); location.reload();
});
document.getElementById("export-progress").addEventListener("click", () => {
  const blob = new Blob([exportJSON()], { type: "application/json" });
  const a = h("a", { href: URL.createObjectURL(blob), download: "progress.json" });
  document.body.appendChild(a); a.click(); a.remove();
  toast("Exported progress.json — put it in progress/ for the tutor agent");
});
document.getElementById("import-progress").addEventListener("change", async (e) => {
  const f = e.target.files[0]; if (!f) return;
  try { importJSON(await f.text()); toast("Progress imported"); location.reload(); }
  catch (err) { alert("Import failed: " + err.message); }
});

document.querySelector(".index-controls").appendChild(themeButton());
