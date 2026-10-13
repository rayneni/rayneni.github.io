/** Space (default) + per-stop planet palettes when an icon is selected. */
const THEME_TRANSITION_MS = 2800;
const SCAPE_SWAP_OUT_MS = 1400;

const SPACE = {
  label: "Space",
  vars: {
    "--theme-sky-top": "#02030c",
    "--theme-sky-mid": "#0a0e28",
    "--theme-sky-bottom": "#141838",
    "--theme-nebula-a": "rgba(120, 80, 220, 0.42)",
    "--theme-nebula-b": "rgba(40, 180, 255, 0.28)",
    "--theme-accent": "#c8b8ff",
    "--theme-accent-soft": "rgba(200, 184, 255, 0.18)",
    "--scape-1": "#888",
    "--scape-2": "#666",
    "--scape-3": "#444",
    "--scape-glow": "transparent",
  },
  canvas: {
    sky: ["#02030c", "#0a0e28", "#141838"],
    nebulae: [
      { x: 0.2, y: 0.18, r: 0.55, color: "rgba(100, 60, 200, 0.35)" },
      { x: 0.78, y: 0.14, r: 0.42, color: "rgba(30, 160, 255, 0.22)" },
      { x: 0.55, y: 0.65, r: 0.35, color: "rgba(255, 100, 180, 0.12)" },
    ],
    starWarm: "#fff8e8",
    starCool: "#a8d8ff",
    starStrength: 1,
  },
};

function mkPlanet({
  label,
  accent,
  accentSoft,
  sky,
  scape,
  atmo,
  canvasSky,
  nebulae,
  starWarm,
  starCool,
}) {
  const [scape1, scape2, scape3] = scape;
  return {
    label,
    planet: {
      vars: {
        "--theme-sky-top": sky[0],
        "--theme-sky-mid": sky[1],
        "--theme-sky-bottom": sky[2],
        "--theme-nebula-a": atmo.replace(/[\d.]+\)$/, "0.35)"),
        "--theme-nebula-b": accentSoft,
        "--theme-accent": accent,
        "--theme-accent-soft": accentSoft,
        "--scape-1": scape1,
        "--scape-2": scape2,
        "--scape-3": scape3,
        "--scape-glow": atmo,
      },
      canvas: {
        sky: canvasSky || sky,
        nebulae: nebulae || [
          { x: 0.35, y: 0.2, r: 0.4, color: atmo },
          { x: 0.7, y: 0.25, r: 0.32, color: accentSoft },
        ],
        starWarm: starWarm || "#fff0e8",
        starCool: starCool || accent,
        starStrength: 0.12,
      },
    },
  };
}

const SITE_THEMES = {
  default: { space: SPACE },
  agents: mkPlanet({
    label: "Agents",
    accent: "#5cefff",
    accentSoft: "rgba(92, 239, 255, 0.35)",
    sky: ["#0a1428", "#1e3a68", "#6ab0d8"],
    scape: ["#88d0f0", "#3a7098", "#1a3858"],
    atmo: "rgba(92, 239, 255, 0.45)",
    starCool: "#88e8ff",
    nebulae: [
      { x: 0.25, y: 0.15, r: 0.5, color: "rgba(92, 239, 255, 0.28)" },
      { x: 0.72, y: 0.2, r: 0.38, color: "rgba(100, 80, 220, 0.2)" },
    ],
  }),
  evals: mkPlanet({
    label: "Evals",
    accent: "#7ae878",
    accentSoft: "rgba(122, 232, 120, 0.32)",
    sky: ["#081810", "#1a4030", "#58a878"],
    scape: ["#6ac880", "#2a7850", "#143828"],
    atmo: "rgba(122, 232, 120, 0.4)",
    starCool: "#a8ffb0",
    nebulae: [{ x: 0.5, y: 0.35, r: 0.45, color: "rgba(122, 232, 120, 0.22)" }],
  }),
  zerotone: mkPlanet({
    label: "0 → 1",
    accent: "#ffb040",
    accentSoft: "rgba(255, 176, 64, 0.35)",
    sky: ["#180818", "#682018", "#d87830"],
    scape: ["#e8a060", "#a04028", "#401010"],
    atmo: "rgba(255, 140, 60, 0.42)",
    starWarm: "#ffe8c0",
    nebulae: [{ x: 0.5, y: 0.55, r: 0.55, color: "rgba(255, 120, 40, 0.35)" }],
  }),
  platform: mkPlanet({
    label: "Platform",
    accent: "#58b0ff",
    accentSoft: "rgba(88, 176, 255, 0.35)",
    sky: ["#060c18", "#142850", "#5090d0"],
    scape: ["#a8d0f8", "#4070b0", "#182848"],
    atmo: "rgba(88, 176, 255, 0.4)",
    nebulae: [
      { x: 0.4, y: 0.25, r: 0.48, color: "rgba(200, 230, 255, 0.25)" },
      { x: 0.65, y: 0.3, r: 0.35, color: "rgba(88, 176, 255, 0.18)" },
    ],
  }),
  compliance: mkPlanet({
    label: "Compliance",
    accent: "#e8c040",
    accentSoft: "rgba(232, 192, 64, 0.32)",
    sky: ["#101018", "#282838", "#686878"],
    scape: ["#9898a8", "#585868", "#282830"],
    atmo: "rgba(232, 192, 64, 0.28)",
    nebulae: [{ x: 0.5, y: 0.7, r: 0.4, color: "rgba(232, 192, 64, 0.15)" }],
  }),
  teams: mkPlanet({
    label: "Teams",
    accent: "#f0a0c0",
    accentSoft: "rgba(240, 160, 192, 0.35)",
    sky: ["#1a0818", "#482040", "#a06080"],
    scape: ["#e8a8c0", "#985878", "#481830"],
    atmo: "rgba(240, 160, 192, 0.38)",
    nebulae: [{ x: 0.45, y: 0.4, r: 0.5, color: "rgba(240, 160, 192, 0.25)" }],
  }),
  uh: mkPlanet({
    label: "University of Houston",
    accent: "#f0d070",
    accentSoft: "rgba(200, 16, 46, 0.35)",
    sky: ["#180408", "#780818", "#c84858"],
    scape: ["#e83848", "#980818", "#400408"],
    atmo: "rgba(232, 80, 100, 0.45)",
    nebulae: [{ x: 0.5, y: 0.5, r: 0.45, color: "rgba(200, 16, 46, 0.25)" }],
  }),
  rocket: mkPlanet({
    label: "Rocket",
    accent: "#ff5868",
    accentSoft: "rgba(255, 88, 104, 0.35)",
    sky: ["#100204", "#880818", "#e06050"],
    scape: ["#e85848", "#a02028", "#580810"],
    atmo: "rgba(255, 80, 90, 0.42)",
    nebulae: [{ x: 0.35, y: 0.45, r: 0.5, color: "rgba(255, 80, 60, 0.28)" }],
  }),
  wagepoint: mkPlanet({
    label: "Wagepoint",
    accent: "#48e878",
    accentSoft: "rgba(72, 232, 120, 0.35)",
    sky: ["#081410", "#285830", "#78c888"],
    scape: ["#b8f0a8", "#48a858", "#184820"],
    atmo: "rgba(72, 232, 120, 0.4)",
    nebulae: [{ x: 0.22, y: 0.45, r: 0.42, color: "rgba(255, 220, 120, 0.2)" }],
  }),
  workday: mkPlanet({
    label: "Workday",
    accent: "#3d9ae8",
    accentSoft: "rgba(61, 154, 232, 0.38)",
    sky: ["#061428", "#0c3d78", "#5ca8e8"],
    scape: ["#88c8f8", "#2878c8", "#0c3870"],
    atmo: "rgba(61, 154, 232, 0.42)",
    starCool: "#a8d8ff",
    nebulae: [
      { x: 0.3, y: 0.22, r: 0.55, color: "rgba(255, 255, 255, 0.18)" },
      { x: 0.7, y: 0.18, r: 0.48, color: "rgba(80, 160, 240, 0.28)" },
    ],
  }),
  anna: mkPlanet({
    label: "Anna University",
    accent: "#68b0ff",
    accentSoft: "rgba(104, 176, 255, 0.35)",
    sky: ["#060818", "#183878", "#68a0e8"],
    scape: ["#88c8ff", "#2860b0", "#0c2858"],
    atmo: "rgba(104, 176, 255, 0.42)",
    nebulae: [
      { x: 0.55, y: 0.25, r: 0.45, color: "rgba(180, 220, 255, 0.28)" },
      { x: 0.2, y: 0.35, r: 0.35, color: "rgba(104, 176, 255, 0.2)" },
    ],
  }),
};

const THEME_ALIASES = {
  "rocket-senior": "rocket",
  "rocket-em": "rocket",
  "uh-ms": "uh",
};

const PLANET_TRIGGER_SELECTOR =
  ".career-stop, .edu-stop, .sky-star";

function resolveThemeId(id) {
  if (!id || id === "default") return "default";
  if (THEME_ALIASES[id]) return THEME_ALIASES[id];
  if (SITE_THEMES[id]?.planet) return id;
  return "default";
}

function activeVisualTheme(id) {
  if (id === "default") return SPACE;
  const entry = SITE_THEMES[id];
  return entry?.planet || SPACE;
}

function applyThemeVars(visual) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(visual.vars)) {
    root.style.setProperty(key, value);
  }
  root.style.setProperty("--accent", visual.vars["--theme-accent"]);
  root.style.setProperty("--accent-soft", visual.vars["--theme-accent-soft"]);
  root.style.setProperty("--text", "#e8e6e3");
  root.style.setProperty("--text-muted", "#9a9690");
  root.style.setProperty("--border", "rgba(232, 230, 227, 0.1)");
}

function dispatchThemeChange(detail) {
  window.dispatchEvent(new CustomEvent("site-theme-change", { detail }));
}

function applySiteTheme(rawId, options = {}) {
  const id = resolveThemeId(rawId);
  const isSpace = id === "default";
  const snap = options.snap === true;
  const visual = activeVisualTheme(id);
  const root = document.documentElement;
  const prevTheme = root.dataset.siteTheme || "default";
  const prevMode = root.dataset.siteMode || "space";
  const swapLandscape =
    !snap && !isSpace && prevMode === "planet" && prevTheme !== id;

  root.classList.toggle("theme-snap", snap);
  if (snap) {
    window.setTimeout(() => root.classList.remove("theme-snap"), 80);
  } else {
    root.classList.add("theme-fade");
    root.classList.add("theme-orbit");
    window.setTimeout(() => {
      root.classList.remove("theme-orbit", "theme-fade");
    }, THEME_TRANSITION_MS);
  }

  applyThemeVars(visual);

  const finishMode = () => {
    root.dataset.siteMode = isSpace ? "space" : "planet";
    root.dataset.siteTheme = id;
  };

  if (swapLandscape) {
    root.classList.add("scape-swapping");
    window.setTimeout(() => {
      root.dataset.siteTheme = id;
      root.classList.remove("scape-swapping");
    }, SCAPE_SWAP_OUT_MS);
    root.dataset.siteMode = "planet";
  } else {
    finishMode();
  }

  dispatchThemeChange({
    id,
    mode: isSpace ? "space" : "planet",
    theme: visual,
    snap,
  });
}

window.applySiteTheme = applySiteTheme;
window.SITE_THEMES = SITE_THEMES;
window.SITE_SPACE = SPACE;

document.addEventListener("click", (e) => {
  if (e.target.closest(PLANET_TRIGGER_SELECTOR)) return;
  if (e.target.closest(".site-rail--comms, .contact-channel")) return;
  if (document.documentElement.dataset.siteMode !== "planet") return;
  applySiteTheme("default");
});

document.addEventListener("DOMContentLoaded", () => {
  applySiteTheme("default", { snap: true });
});
