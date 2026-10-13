/** About themes — evidence in data/about.json */
let ABOUT_POINTS = [];
let ABOUT_UI = {};

const aboutListEl = document.getElementById("about-list");
const aboutKickerEl = document.getElementById("about-kicker");
const aboutLeadEl = document.getElementById("about-lead");
const aboutBulletsEl = document.getElementById("about-bullets");

let activeAboutId = null;

const ABOUT_BY_ID = () => Object.fromEntries(ABOUT_POINTS.map((p) => [p.id, p]));

async function loadAboutData() {
  const res = await fetch(window.sitePath("data/about.json"), { cache: "no-cache" });
  if (!res.ok) throw new Error(`about.json: ${res.status}`);
  const data = await res.json();
  ABOUT_POINTS = data.points || [];
  ABOUT_UI = data.ui || {};
}

function showAboutSummary(point) {
  if (aboutKickerEl) {
    if (point) {
      aboutKickerEl.hidden = true;
    } else {
      aboutKickerEl.textContent = ABOUT_UI.ready?.kicker || "About";
      aboutKickerEl.hidden = false;
    }
  }
  if (aboutLeadEl) {
    aboutLeadEl.textContent = point
      ? point.lead
      : ABOUT_UI.ready?.lead || "Tap a theme to see resume-backed examples.";
  }
  if (aboutBulletsEl) {
    aboutBulletsEl.replaceChildren();
    const lines = point?.bullets || [];
    if (lines.length > 0) {
      for (const item of lines.slice(0, 5)) {
        const li = document.createElement("li");
        li.textContent = item;
        aboutBulletsEl.appendChild(li);
      }
      aboutBulletsEl.hidden = false;
    } else {
      aboutBulletsEl.hidden = true;
    }
  }
  const panel = document.getElementById("about-summary");
  if (panel) {
    panel.classList.remove("is-bump");
    void panel.offsetWidth;
    panel.classList.add("is-bump");
  }
}

function selectAboutPoint(id) {
  const point = ABOUT_BY_ID()[id];
  if (!point) return;
  activeAboutId = id;
  aboutListEl?.querySelectorAll(".about-point").forEach((el) => {
    const on = el.dataset.aboutPoint === id;
    el.classList.toggle("is-active", on);
    el.setAttribute("aria-pressed", on ? "true" : "false");
    el.setAttribute("aria-expanded", on ? "true" : "false");
  });
  showAboutSummary(point);
}

function buildAboutList() {
  if (!aboutListEl) return;
  aboutListEl.replaceChildren();
  for (const point of ABOUT_POINTS) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "about-point";
    btn.dataset.aboutPoint = point.id;
    btn.setAttribute("aria-pressed", "false");
    btn.setAttribute("aria-expanded", "false");
    btn.textContent = point.label || point.title;
    btn.addEventListener("click", () => selectAboutPoint(point.id));
    li.appendChild(btn);
    aboutListEl.appendChild(li);
  }
}

async function initAbout() {
  if (!aboutListEl) return;
  try {
    await loadAboutData();
    buildAboutList();
    showAboutSummary(null);
    if (ABOUT_POINTS.length > 0) {
      selectAboutPoint(ABOUT_POINTS[0].id);
    }
  } catch (err) {
    console.error(err);
    if (aboutLeadEl) aboutLeadEl.textContent = "Could not load about data.";
  }
}

initAbout();
