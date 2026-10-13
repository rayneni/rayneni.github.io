/** Career flight log — data in data/career-path.json */
let CAREER_STOPS = [];
let CAREER_UI = {};

const careerTrackEl = document.getElementById("career-track");
const careerStopsEl = document.getElementById("career-stops");
const careerRocketEl = document.getElementById("career-rocket");
const careerKickerEl = document.getElementById("career-kicker");
const careerTitleEl = document.getElementById("career-title");
const careerLeadEl = document.getElementById("career-lead");
const careerBulletsEl = document.getElementById("career-bullets");
const careerLogoEl = document.getElementById("career-logo");

let activeStopId = null;

/** Logos that should fill the badge (no white matting). */
const LOGO_FILL_STOP_IDS = new Set(["wagepoint", "workday"]);

const BY_STOP_ID = () => Object.fromEntries(CAREER_STOPS.map((s) => [s.id, s]));

async function loadCareerData() {
  const res = await fetch(window.sitePath("data/career-path.json"), { cache: "no-cache" });
  if (!res.ok) throw new Error(`career-path.json: ${res.status}`);
  const data = await res.json();
  CAREER_STOPS = data.stops || [];
  CAREER_UI = data.ui || {};
}

function setCareerLogo(stop) {
  if (!careerLogoEl) return;
  if (stop?.logo) {
    careerLogoEl.src = window.sitePath(stop.logo);
    careerLogoEl.alt = stop.label || "";
    careerLogoEl.hidden = false;
    careerLogoEl.classList.toggle("career-summary-logo--fill", LOGO_FILL_STOP_IDS.has(stop.id));
  } else {
    careerLogoEl.removeAttribute("src");
    careerLogoEl.alt = "";
    careerLogoEl.hidden = true;
    careerLogoEl.classList.remove("career-summary-logo--fill");
  }
}

function showCareerSummary(stop) {
  setCareerLogo(stop);
  if (careerKickerEl) careerKickerEl.textContent = stop ? stop.label : "";
  if (careerTitleEl) {
    if (stop) {
      careerTitleEl.textContent =
        stop.title === stop.period ? stop.title : `${stop.title} · ${stop.period}`;
      careerTitleEl.hidden = false;
    } else {
      careerTitleEl.hidden = true;
    }
  }
  if (careerLeadEl) careerLeadEl.textContent = stop ? stop.lead : "";
  if (careerBulletsEl) {
    careerBulletsEl.replaceChildren();
    const lines = stop?.bullets || [];
    if (lines.length > 0) {
      for (const item of lines.slice(0, 3)) {
        const li = document.createElement("li");
        li.textContent = item;
        careerBulletsEl.appendChild(li);
      }
      careerBulletsEl.hidden = false;
    } else {
      careerBulletsEl.hidden = true;
    }
  }
  const panel = document.getElementById("career-summary");
  if (panel) {
    panel.classList.remove("is-bump");
    void panel.offsetWidth;
    panel.classList.add("is-bump");
  }
}

function stopButton(id) {
  return careerStopsEl?.querySelector(`[data-career-stop="${id}"]`);
}

function mountCareerRocket() {
  if (!careerRocketEl) return;
  const glyph = window.SKILL_SKY_GLYPHS?.rocket;
  if (glyph) careerRocketEl.innerHTML = glyph;
}

function moveRocketToStop(id, { smooth = true } = {}) {
  if (!careerRocketEl || !careerTrackEl) return;
  const btn = stopButton(id);
  const mark = btn?.querySelector(".career-stop-mark");
  if (!mark) return;
  const track = careerTrackEl.getBoundingClientRect();
  const r = mark.getBoundingClientRect();
  const x = r.left + r.width / 2 - track.left;
  const y = r.top - track.top;
  careerRocketEl.hidden = false;
  const motion = smooth ? "left 0.5s cubic-bezier(0.22, 0.9, 0.28, 1), top 0.5s cubic-bezier(0.22, 0.9, 0.28, 1)" : "none";
  careerRocketEl.style.transition = motion;
  careerRocketEl.style.left = `${x}px`;
  careerRocketEl.style.top = `${y}px`;
}

function selectStop(id, { smooth = true } = {}) {
  const stop = BY_STOP_ID()[id];
  if (!stop) return;
  activeStopId = id;
  careerStopsEl?.querySelectorAll(".career-stop").forEach((el) => {
    el.classList.toggle("is-active", el.dataset.careerStop === id);
    el.setAttribute("aria-pressed", el.dataset.careerStop === id ? "true" : "false");
  });
  moveRocketToStop(id, { smooth });
  showCareerSummary(stop);
  if (smooth) window.applySiteTheme?.(id);
}

function buildStopMark(stop) {
  const mark = document.createElement("span");
  mark.className = "career-stop-mark";
  if (LOGO_FILL_STOP_IDS.has(stop.id)) mark.classList.add("career-stop-mark--fill");
  mark.setAttribute("aria-hidden", "true");
  if (stop.logo) {
    const img = document.createElement("img");
    img.className = "career-stop-logo";
    img.src = window.sitePath(stop.logo);
    img.alt = "";
    img.width = 48;
    img.height = 48;
    img.loading = "lazy";
    img.decoding = "async";
    mark.appendChild(img);
  } else {
    const dot = document.createElement("span");
    dot.className = "career-stop-dot";
    mark.appendChild(dot);
  }
  return mark;
}

function buildStops() {
  if (!careerStopsEl) return;
  careerStopsEl.replaceChildren();
  for (const stop of CAREER_STOPS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "career-stop";
    btn.dataset.careerStop = stop.id;
    btn.setAttribute("aria-pressed", "false");
    btn.appendChild(buildStopMark(stop));
    const label = document.createElement("span");
    label.className = "career-stop-label";
    label.textContent = stop.label;
    btn.appendChild(label);
    const period = document.createElement("span");
    period.className = "career-stop-period";
    period.textContent = stop.period;
    btn.appendChild(period);
    btn.addEventListener("click", () => selectStop(stop.id));
    careerStopsEl.appendChild(btn);
  }
}

function showReady() {
  const ready = CAREER_UI.ready || {};
  setCareerLogo(null);
  if (careerKickerEl) careerKickerEl.textContent = ready.kicker || "Career path";
  if (careerTitleEl) careerTitleEl.hidden = true;
  if (careerLeadEl) careerLeadEl.textContent = ready.lead || "";
  if (careerBulletsEl) {
    careerBulletsEl.replaceChildren();
    careerBulletsEl.hidden = true;
  }
}

function repositionRocket() {
  if (activeStopId) moveRocketToStop(activeStopId, { smooth: false });
}

async function initCareer() {
  if (!careerTrackEl || !careerStopsEl) return;
  try {
    await loadCareerData();
    mountCareerRocket();
    buildStops();
    window.addEventListener("resize", repositionRocket);
    if (CAREER_STOPS.length > 0) {
      selectStop(CAREER_STOPS[CAREER_STOPS.length - 1].id, { smooth: false });
    } else {
      showReady();
    }
  } catch (err) {
    console.error(err);
    if (careerLeadEl) careerLeadEl.textContent = "Could not load career path data.";
  }
}

initCareer();
