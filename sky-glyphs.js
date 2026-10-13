/**
 * SVG glyphs for skill-sky stars and the player rocket.
 * Add a key here, then set "glyph": "<key>" on a star in data/skill-sky.json.
 */
window.SKILL_SKY_GLYPHS = {
  rocket: `<svg viewBox="0 0 32 48" class="glyph-svg glyph-svg--rocket" aria-hidden="true">
    <path class="glyph-rocket-body" d="M16 2c-2 8-6 14-6 22a6 6 0 0 0 12 0c0-8-4-14-6-22z"/>
    <circle class="glyph-rocket-window" cx="16" cy="20" r="3.5"/>
    <path class="glyph-rocket-fin glyph-rocket-fin--l" d="M10 30 L4 42 L12 34z"/>
    <path class="glyph-rocket-fin glyph-rocket-fin--r" d="M22 30 L28 42 L20 34z"/>
    <path class="glyph-rocket-flame" d="M16 36c-3 4-5 8-5 11 0 2 2 3 5 3s5-1 5-3c0-3-2-7-5-11z"/>
  </svg>`,

  agents: `<svg viewBox="0 0 40 40" class="glyph-svg glyph-svg--agents" aria-hidden="true">
    <circle class="glyph-agents-orbit" cx="20" cy="20" r="14" fill="none"/>
    <circle class="glyph-agents-core" cx="20" cy="20" r="6"/>
    <circle class="glyph-agents-node" cx="20" cy="6" r="2.5"/>
    <circle class="glyph-agents-node" cx="33" cy="26" r="2.5"/>
    <circle class="glyph-agents-node" cx="7" cy="26" r="2.5"/>
  </svg>`,

  evals: `<svg viewBox="0 0 40 40" class="glyph-svg glyph-svg--evals" aria-hidden="true">
    <rect class="glyph-evals-bar" x="8" y="22" width="5" height="12" rx="1"/>
    <rect class="glyph-evals-bar" x="17" y="14" width="5" height="20" rx="1"/>
    <rect class="glyph-evals-bar" x="26" y="8" width="5" height="26" rx="1"/>
    <path class="glyph-evals-trend" d="M8 30 L18 20 L28 14 L34 10" fill="none"/>
  </svg>`,

  zerotone: `<svg viewBox="0 0 40 40" class="glyph-svg glyph-svg--zerotone" aria-hidden="true">
    <path class="glyph-zt-spark" d="M20 4 L24 16 L36 20 L24 24 L20 36 L16 24 L4 20 L16 16 Z"/>
    <circle class="glyph-zt-dot" cx="20" cy="20" r="3"/>
  </svg>`,

  teams: `<svg viewBox="0 0 40 40" class="glyph-svg glyph-svg--teams" aria-hidden="true">
    <circle class="glyph-teams-head" cx="14" cy="14" r="4"/>
    <circle class="glyph-teams-head" cx="26" cy="14" r="4"/>
    <circle class="glyph-teams-head" cx="20" cy="10" r="4.5"/>
    <path class="glyph-teams-body" d="M6 32c0-6 5-10 14-10s14 4 14 10"/>
  </svg>`,

  platform: `<svg viewBox="0 0 40 40" class="glyph-svg glyph-svg--platform" aria-hidden="true">
    <rect class="glyph-plat-cell" x="6" y="6" width="12" height="12" rx="2"/>
    <rect class="glyph-plat-cell" x="22" y="6" width="12" height="12" rx="2"/>
    <rect class="glyph-plat-cell" x="6" y="22" width="12" height="12" rx="2"/>
    <rect class="glyph-plat-cell glyph-plat-cell--accent" x="22" y="22" width="12" height="12" rx="2"/>
  </svg>`,

  compliance: `<svg viewBox="0 0 40 40" class="glyph-svg glyph-svg--compliance" aria-hidden="true">
    <path class="glyph-shield" d="M20 4 L34 10 V22c0 10-7 14-14 16C13 36 6 32 6 22 V10 L20 4z"/>
    <path class="glyph-shield-check" d="M14 21 L18 25 L27 15" fill="none"/>
  </svg>`,
};

window.SKILL_SKY_DEFAULT_GLYPH = "zerotone";
