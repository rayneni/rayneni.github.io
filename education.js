/** Education flight log — data in data/education.json */
let EDU_STOPS = [];
let EDU_UI = {};

const eduTrackEl = document.getElementById("edu-track");
const eduStopsEl = document.getElementById("edu-stops");
const eduKickerEl = document.getElementById("edu-kicker");
const eduTitleEl = document.getElementById("edu-title");
const eduLeadEl = document.getElementById("edu-lead");
const eduBulletsEl = document.getElementById("edu-bullets");
const eduLogoEl = document.getElementById("edu-logo");

let activeEduId = null;

const EDU_BY_ID = () => Object.fromEntries(EDU_STOPS.map((s) => [s.id, s]));

async function loadEducationData() {
  const res = await fetch(window.sitePath("data/education.json"), { cache: "no-cache" });
  if (!res.ok) throw new Error(`education.json: ${res.status}`);
  const data = await res.json();
  EDU_STOPS = data.stops || [];
  EDU_UI = data.ui || {};
}

function setEduLogo(stop) {
  if (!eduLogoEl) return;
  if (stop?.logo) {
    eduLogoEl.src = window.sitePath(stop.logo);
    eduLogoEl.alt = stop.label || "";
    eduLogoEl.hidden = false;
  } else {
    eduLogoEl.removeAttribute("src");
    eduLogoEl.alt = "";
    eduLogoEl.hidden = true;
  }
}

function showEduSummary(stop) {
  setEduLogo(stop);
  if (eduKickerEl) eduKickerEl.textContent = stop ? stop.label : "";
  if (eduTitleEl) {
    if (stop?.degree) {
      eduTitleEl.textContent = stop.degree;
      eduTitleEl.hidden = false;
    } else {
      eduTitleEl.hidden = true;
    }
  }
  if (eduLeadEl) eduLeadEl.textContent = stop ? stop.lead : "";
  if (eduBulletsEl) {
    eduBulletsEl.replaceChildren();
    const lines = stop?.bullets || [];
    if (lines.length > 0) {
      for (const item of lines.slice(0, 3)) {
        const li = document.createElement("li");
        li.textContent = item;
        eduBulletsEl.appendChild(li);
      }
      eduBulletsEl.hidden = false;
    } else {
      eduBulletsEl.hidden = true;
    }
  }
  const panel = document.getElementById("edu-summary");
  if (panel) {
    panel.classList.remove("is-bump");
    void panel.offsetWidth;
    panel.classList.add("is-bump");
  }
}

function eduStopButton(id) {
  return eduStopsEl?.querySelector(`[data-edu-stop="${id}"]`);
}

function selectEduStop(id, { applyTheme = true } = {}) {
  const stop = EDU_BY_ID()[id];
  if (!stop) return;
  activeEduId = id;
  eduStopsEl?.querySelectorAll(".edu-stop").forEach((el) => {
    el.classList.toggle("is-active", el.dataset.eduStop === id);
    el.setAttribute("aria-pressed", el.dataset.eduStop === id ? "true" : "false");
  });
  showEduSummary(stop);
  if (applyTheme) window.applySiteTheme?.(id);
}

function buildEduStopMark(stop) {
  const mark = document.createElement("span");
  mark.className = "edu-stop-mark";
  mark.setAttribute("aria-hidden", "true");
  if (stop.logo) {
    const img = document.createElement("img");
    img.className = "edu-stop-logo";
    img.src = window.sitePath(stop.logo);
    img.alt = "";
    img.width = 40;
    img.height = 40;
    img.loading = "lazy";
    img.decoding = "async";
    mark.appendChild(img);
  }
  return mark;
}

function buildEduStops() {
  if (!eduStopsEl) return;
  eduStopsEl.replaceChildren();
  for (const stop of EDU_STOPS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "edu-stop";
    btn.dataset.eduStop = stop.id;
    btn.setAttribute("aria-pressed", "false");
    btn.appendChild(buildEduStopMark(stop));
    const label = document.createElement("span");
    label.className = "edu-stop-label";
    label.textContent = stop.label;
    btn.appendChild(label);
    const degree = document.createElement("span");
    degree.className = "edu-stop-degree";
    degree.textContent = stop.degree || "";
    btn.appendChild(degree);
    btn.addEventListener("click", () => selectEduStop(stop.id));
    eduStopsEl.appendChild(btn);
  }
}

function showEduReady() {
  const ready = EDU_UI.ready || {};
  setEduLogo(null);
  if (eduKickerEl) eduKickerEl.textContent = ready.kicker || "Education";
  if (eduTitleEl) eduTitleEl.hidden = true;
  if (eduLeadEl) eduLeadEl.textContent = ready.lead || "";
  if (eduBulletsEl) {
    eduBulletsEl.replaceChildren();
    eduBulletsEl.hidden = true;
  }
}

async function initEducation() {
  if (!eduTrackEl || !eduStopsEl) return;
  try {
    await loadEducationData();
    buildEduStops();
    if (EDU_STOPS.length > 0) {
      selectEduStop(EDU_STOPS[EDU_STOPS.length - 1].id, { applyTheme: false });
    } else {
      showEduReady();
    }
  } catch (err) {
    console.error(err);
    if (eduLeadEl) eduLeadEl.textContent = "Could not load education data.";
  }
}

initEducation();
