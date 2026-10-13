/** Skill sky — stars and copy live in data/skill-sky.json (see meta.expand). */
let STARS = [];
let STAR_ORDER = [];
let CORE_STAR_IDS = new Set();
let BY_ID = {};
let UI_COPY = {};

const positions = new Map();
const factIndex = new Map();

function applySkillSkyData(data) {
  STAR_ORDER = data.starOrder || [];
  CORE_STAR_IDS = new Set(data.coreStarIds || []);
  STARS = data.stars || [];
  BY_ID = Object.fromEntries(STARS.map((s) => [s.id, s]));
  UI_COPY = data.ui || {};
  positions.clear();
  factIndex.clear();
  for (const star of STARS) {
    positions.set(star.id, { x: star.x, y: star.y });
    factIndex.set(star.id, 0);
  }
}

async function loadSkillSkyData() {
  const res = await fetch(window.sitePath("data/skill-sky.json"), { cache: "no-cache" });
  if (!res.ok) throw new Error(`skill-sky.json: ${res.status}`);
  applySkillSkyData(await res.json());
}

const mapEl = document.getElementById("sky-map");
const starsEl = document.getElementById("sky-stars");
const rocketEl = document.getElementById("sky-rocket");
const landedRocketEl = document.getElementById("sky-rocket-landed");

let skyRocket = null;

function glyphMarkup(star) {
  const glyphs = window.SKILL_SKY_GLYPHS || {};
  const key = star.glyph || star.id;
  return glyphs[key] || glyphs[window.SKILL_SKY_DEFAULT_GLYPH] || "";
}

class SkyRocket {
  constructor(map, cursorEl, landedEl) {
    this.map = map;
    this.cursorEl = cursorEl;
    this.landedEl = landedEl;
    this.mode = "hidden";
    this.anim = null;
    this.lastPointer = null;
    this.lastClient = null;
    this.parkedStarId = null;
    this.hoverStarId = null;
    this.reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const glyphs = window.SKILL_SKY_GLYPHS || {};
    if (glyphs.rocket) {
      if (cursorEl) cursorEl.innerHTML = glyphs.rocket;
      if (landedEl) landedEl.innerHTML = glyphs.rocket;
    }
    if (!map || !cursorEl) return;

    map.addEventListener("pointerenter", (e) => this.onEnter(e));
    map.addEventListener("pointerleave", () => this.onLeave());
    map.addEventListener(
      "pointermove",
      (e) => this.onMapPointerMove(e),
      { capture: true }
    );

    this._onDocPointerMove = (e) => {
      if (this.mode !== "follow" || !this.pointerInsideMapAt(e.clientX, e.clientY)) return;
      this.trackPointer(e);
      this.applyFollowPose();
    };
    document.addEventListener("pointermove", this._onDocPointerMove, { passive: true });
  }

  pointerInsideMapAt(clientX, clientY) {
    if (!this.map) return false;
    const r = this.map.getBoundingClientRect();
    return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
  }

  syncOsCursor() {
    if (!this.map) return;
    const hide = this.mode === "follow" || this.mode === "transit";
    this.map.classList.toggle("sky-map--hide-os-cursor", hide);
  }

  onMapPointerMove(e) {
    this.trackPointer(e);
    if (this.mode === "follow") this.applyFollowPose();
  }

  /** WAAPI fill:forwards blocks inline left/top until animations are committed + cancelled. */
  clearCursorAnimations() {
    if (!this.cursorEl) return;
    for (const animation of this.cursorEl.getAnimations()) {
      try {
        animation.commitStyles();
      } catch {
        /* ignore */
      }
      animation.cancel();
    }
    this.anim = null;
  }

  snapCursorFromFrame(frame) {
    if (!this.cursorEl || !frame) return;
    if (frame.left) this.cursorEl.style.left = frame.left;
    if (frame.top) this.cursorEl.style.top = frame.top;
    if (frame.transform) this.cursorEl.style.transform = frame.transform;
  }

  mapPoint(clientX, clientY) {
    const r = this.map.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  pointerInsideMap() {
    if (!this.lastClient || !this.map) return false;
    const r = this.map.getBoundingClientRect();
    const { x, y } = this.lastClient;
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }

  starLandPoint(starId) {
    const btn = starEl(starId);
    if (!btn || !this.map) return null;
    const mr = this.map.getBoundingClientRect();
    const pad = btn.querySelector(".sky-star-pad");
    const pr = pad?.getBoundingClientRect() || btn.getBoundingClientRect();
    return {
      x: pr.left + pr.width / 2 - mr.left,
      y: pr.top - mr.top + 6,
    };
  }

  flightAngle(x1, y1, x2, y2) {
    return (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI + 90;
  }

  setCursorPose(x, y, deg, { flying = false } = {}) {
    if (!this.cursorEl) return;
    if (!flying) this.clearCursorAnimations();
    this.cursorEl.style.left = `${x}px`;
    this.cursorEl.style.top = `${y}px`;
    this.cursorEl.style.transform = `translate(-50%, -50%) rotate(${deg}deg)`;
    this.cursorEl.classList.toggle("is-flying", flying);
  }

  parkOnStar(starId) {
    if (!this.landedEl || !starId) return;
    const p = this.starLandPoint(starId);
    if (!p) return;
    if (this.parkedStarId && this.parkedStarId !== starId) {
      starEl(this.parkedStarId)?.classList.remove("is-rocket-pad");
    }
    this.parkedStarId = starId;
    this.landedEl.style.left = `${p.x}px`;
    this.landedEl.style.top = `${p.y}px`;
    this.landedEl.style.transform = "translate(-50%, -50%) rotate(0deg)";
    this.landedEl.hidden = false;
    starEl(starId)?.classList.add("is-rocket-pad");
  }

  clearParked() {
    if (this.parkedStarId) starEl(this.parkedStarId)?.classList.remove("is-rocket-pad");
    this.parkedStarId = null;
    if (this.landedEl) this.landedEl.hidden = true;
  }

  finishAtStar(starId) {
    this.parkOnStar(starId);
    this.enterFollowMode();
    this.onLanded?.(starId);
  }

  followBesideParkedStar() {
    const parked = this.parkedStarId ? this.starLandPoint(this.parkedStarId) : null;
    if (!parked || !this.cursorEl) return;
    const x = parked.x + 44;
    const y = parked.y + 34;
    this.lastPointer = { x, y };
    this._prevFollow = null;
    this.setCursorPose(x, y, -6);
  }

  enterFollowMode() {
    if (!this.cursorEl) return;
    this.clearCursorAnimations();
    this.mode = "follow";
    this.syncOsCursor();
    this.cursorEl.hidden = false;
    this.cursorEl.classList.remove("is-flying");

    const parked = this.parkedStarId ? this.starLandPoint(this.parkedStarId) : null;

    if (this.pointerInsideMap() && parked) {
      const mouse = this.mapPoint(this.lastClient.x, this.lastClient.y);
      if (Math.hypot(mouse.x - parked.x, mouse.y - parked.y) > 52) {
        this.lastPointer = mouse;
        this._prevFollow = null;
        this.applyFollowPose();
        return;
      }
    }

    if (parked) {
      this.followBesideParkedStar();
      return;
    }

    if (this.pointerInsideMap()) {
      this.lastPointer = this.mapPoint(this.lastClient.x, this.lastClient.y);
      this._prevFollow = null;
      this.applyFollowPose();
    }
  }

  showFollow() {
    if (!this.cursorEl) return;
    this.cursorEl.hidden = false;
    this.mode = "follow";
    this.syncOsCursor();
    this.cursorEl.classList.remove("is-flying");
  }

  hideCursor() {
    if (this.mode === "transit") return;
    if (this.mode !== "follow") return;
    this.cursorEl.hidden = true;
    this.mode = "hidden";
    this.syncOsCursor();
  }

  onEnter(e) {
    if (this.mode === "transit") return;
    this.trackPointer(e);
    if (this.mode === "hidden") this.showFollow();
    if (this.mode === "follow") this.applyFollowPose();
  }

  onLeave() {
    this.hideCursor();
  }

  trackPointer(e) {
    this.lastClient = { x: e.clientX, y: e.clientY };
    this.lastPointer = this.mapPoint(e.clientX, e.clientY);
  }

  setHoverStar(starId) {
    this.hoverStarId = starId;
    if (this.mode === "follow") this.applyFollowPose();
  }

  clearHoverStar(starId) {
    if (this.hoverStarId === starId) this.hoverStarId = null;
    if (this.mode === "follow") this.applyFollowPose();
  }

  applyFollowPose() {
    if (!this.lastPointer || !this.cursorEl) return;
    const { x, y } = this.lastPointer;

    if (this.hoverStarId) {
      const target = starPoint(this.hoverStarId);
      const aim = this.flightAngle(x, y, target.x, target.y);
      this._prevFollow = { x, y };
      this.setCursorPose(x, y, aim);
      return;
    }

    let tilt = 0;
    if (this._prevFollow) {
      const dx = x - this._prevFollow.x;
      const dy = y - this._prevFollow.y;
      if (Math.hypot(dx, dy) > 1.5) {
        tilt = Math.max(
          -22,
          Math.min(22, this.flightAngle(this._prevFollow.x, this._prevFollow.y, x, y) - 90)
        );
      }
    }
    this._prevFollow = { x, y };
    this.setCursorPose(x, y, tilt);
  }

  releaseToFollow() {
    this.clearCursorAnimations();
    this.clearParked();
    this.mode = "hidden";
    this.syncOsCursor();
    if (this.cursorEl) {
      this.cursorEl.classList.remove("is-flying");
      this.cursorEl.hidden = true;
    }
    this._prevFollow = null;
  }

  runTransit(frames, duration, onDone) {
    if (!this.cursorEl) return;
    this.clearCursorAnimations();
    this.mode = "transit";
    this.syncOsCursor();
    this.cursorEl.hidden = false;
    this.cursorEl.classList.add("is-flying");

    const lastFrame = frames[frames.length - 1];
    const complete = () => {
      this.snapCursorFromFrame(lastFrame);
      this.clearCursorAnimations();
      this.cursorEl.classList.remove("is-flying");
      onDone();
    };

    if (this.reduceMotion) {
      this.snapCursorFromFrame(lastFrame);
      complete();
      return;
    }

    this.snapCursorFromFrame(frames[0]);
    this.anim = this.cursorEl.animate(frames, { duration, easing: "linear", fill: "forwards" });
    this.anim.onfinish = complete;
    this.anim.oncancel = () => {
      this.snapCursorFromFrame(lastFrame);
    };
  }

  flyToStar(starId, fromClient) {
    if (!this.cursorEl || !this.map || !starId) return;
    const target = this.starLandPoint(starId);
    if (!target) return;

    this.clearCursorAnimations();
    if (fromClient) this.trackPointer({ clientX: fromClient.x, clientY: fromClient.y });

    let start;
    if (fromClient) {
      start = this.mapPoint(fromClient.x, fromClient.y);
    } else if (this.cursorEl.style.left) {
      start = {
        x: Number.parseFloat(this.cursorEl.style.left),
        y: Number.parseFloat(this.cursorEl.style.top),
      };
    } else if (this.lastPointer) {
      start = { ...this.lastPointer };
    } else {
      start = { x: target.x, y: target.y + 48 };
    }

    const a0 = this.flightAngle(start.x, start.y, target.x, target.y);
    this.runTransit(
      [
        {
          left: `${start.x}px`,
          top: `${start.y}px`,
          transform: `translate(-50%, -50%) rotate(${a0}deg)`,
        },
        {
          left: `${target.x}px`,
          top: `${target.y}px`,
          transform: "translate(-50%, -50%) rotate(0deg)",
        },
      ],
      480,
      () => this.finishAtStar(starId)
    );
  }

  currentMapPos() {
    if (!this.cursorEl?.style.left) return null;
    return {
      x: Number.parseFloat(this.cursorEl.style.left),
      y: Number.parseFloat(this.cursorEl.style.top),
    };
  }

  pushSegmentFrames(frames, from, to, steps) {
    for (let i = 1; i <= steps; i += 1) {
      const t = i / steps;
      const x = from.x + (to.x - from.x) * t;
      const y = from.y + (to.y - from.y) * t;
      const tAhead = Math.min(1, t + 1 / steps);
      const xAhead = from.x + (to.x - from.x) * tAhead;
      const yAhead = from.y + (to.y - from.y) * tAhead;
      const angle = this.flightAngle(x, y, xAhead, yAhead);
      frames.push({
        left: `${x}px`,
        top: `${y}px`,
        transform: `translate(-50%, -50%) rotate(${angle}deg)`,
      });
    }
  }

  traverseLine(fromId, toId) {
    if (!this.cursorEl || !this.map || !fromId || !toId) return;
    this.clearCursorAnimations();

    const start = starPoint(fromId);
    const end = starPoint(toId);
    const lineDist = Math.hypot(end.x - start.x, end.y - start.y);
    const lineSteps = Math.max(10, Math.min(24, Math.round(lineDist / 14)));
    const duration = Math.min(850, Math.max(360, lineDist * 2.4));

    const frames = [];
    const a0 = this.flightAngle(start.x, start.y, end.x, end.y);
    frames.push({
      left: `${start.x}px`,
      top: `${start.y}px`,
      transform: `translate(-50%, -50%) rotate(${a0}deg)`,
    });
    this.pushSegmentFrames(frames, start, end, lineSteps);

    this.runTransit(frames, duration, () => this.finishAtStar(toId));
  }

  repositionParked() {
    if (this.parkedStarId) this.parkOnStar(this.parkedStarId);
  }
}

const linesEl = document.getElementById("sky-lines");
const retireLinesEl = document.getElementById("sky-lines-retire");
const summaryEl = document.getElementById("sky-summary");
const kickerEl = document.getElementById("summary-kicker");
const leadEl = document.getElementById("summary-lead");
const bulletsEl = document.getElementById("summary-bullets");
const scribbleEl = document.getElementById("sky-scribble");
const edges = [];
const MAX_SKY_LINES = 3;
const LINE_RETIRE_MS = 420;

let linkFrom = null;
let previewPoint = null;
let pointer = null;

function edgeKey(a, b) {
  return [a, b].sort().join("|");
}

function showStarSummary(starId) {
  const star = BY_ID[starId];
  if (!star) return;
  const block = star.summary || {};
  showSummary(
    star.label,
    block.lead || star.tagline || "",
    block.bullets?.length ? block.bullets : star.facts || []
  );
}

function showSummary(kicker, lead, bullets = []) {
  if (kickerEl) kickerEl.textContent = kicker;
  if (leadEl) leadEl.textContent = lead;
  if (bulletsEl) {
    bulletsEl.replaceChildren();
    if (bullets.length > 0) {
      for (const item of bullets.slice(0, 3)) {
        const li = document.createElement("li");
        li.textContent = item;
        bulletsEl.appendChild(li);
      }
      bulletsEl.hidden = false;
    } else {
      bulletsEl.hidden = true;
    }
  }
  if (summaryEl) {
    summaryEl.scrollTop = 0;
    summaryEl.classList.remove("is-bump");
    void summaryEl.offsetWidth;
    summaryEl.classList.add("is-bump");
  }
}

function updateLinkUI() {
  starsEl?.querySelectorAll(".sky-star").forEach((el) => {
    const id = el.dataset.star;
    el.classList.toggle("is-link-source", id === linkFrom);
    el.classList.toggle("is-linked", isNodeLinked(id));
  });
}

function isNodeLinked(id) {
  return edges.some((e) => e.a === id || e.b === id);
}

function starEl(id) {
  return starsEl?.querySelector(`[data-star="${id}"]`);
}

function starPoint(id) {
  const btn = starEl(id);
  if (!mapEl || !btn) return { x: 0, y: 0 };
  const map = mapEl.getBoundingClientRect();
  const r = btn.getBoundingClientRect();
  return {
    x: r.left + r.width / 2 - map.left,
    y: r.top + r.height / 2 - map.top,
  };
}

function starAtPoint(clientX, clientY, except) {
  let best = null;
  let bestD = Infinity;
  for (const star of STARS) {
    if (star.id === except) continue;
    const btn = starEl(star.id);
    if (!btn) continue;
    const r = btn.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const d = Math.hypot(clientX - cx, clientY - cy);
    if (d < bestD && d < 56) {
      bestD = d;
      best = star.id;
    }
  }
  return best;
}

function syncLinesViewBox() {
  if (!mapEl) return;
  const w = mapEl.clientWidth;
  const h = mapEl.clientHeight;
  const box = `0 0 ${w} ${h}`;
  linesEl?.setAttribute("viewBox", box);
  retireLinesEl?.setAttribute("viewBox", box);
}

/** Erase oldest segment along the direction it was drawn (anchor → target). */
function playLineRetire(fromId, toId) {
  if (!retireLinesEl || !mapEl) return;
  syncLinesViewBox();

  const pFrom = starPoint(fromId);
  const pTo = starPoint(toId);
  const len = Math.hypot(pTo.x - pFrom.x, pTo.y - pFrom.y);
  if (len < 2) return;

  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  // Stroke runs opposite to draw direction (draw was from → to).
  line.setAttribute("x1", String(pTo.x));
  line.setAttribute("y1", String(pTo.y));
  line.setAttribute("x2", String(pFrom.x));
  line.setAttribute("y2", String(pFrom.y));
  line.setAttribute("class", "sky-line sky-line--retire");
  line.style.strokeDasharray = `${len}`;
  line.style.strokeDashoffset = "0";
  retireLinesEl.appendChild(line);

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const duration = reduced ? 1 : LINE_RETIRE_MS;

  const cleanup = () => line.remove();

  if (reduced) {
    cleanup();
    return;
  }

  requestAnimationFrame(() => {
    line.style.transition = `stroke-dashoffset ${duration}ms linear`;
    line.style.strokeDashoffset = String(len);
  });
  window.setTimeout(cleanup, duration + 40);
}

function renderLines() {
  if (!linesEl || !mapEl) return;
  syncLinesViewBox();
  linesEl.innerHTML = "";

  const addLine = (x1, y1, x2, y2, className) => {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", String(x1));
    line.setAttribute("y1", String(y1));
    line.setAttribute("x2", String(x2));
    line.setAttribute("y2", String(y2));
    line.setAttribute("class", className);
    linesEl.appendChild(line);
  };

  for (const { a, b, fresh } of edges) {
    const p1 = starPoint(a);
    const p2 = starPoint(b);
    addLine(p1.x, p1.y, p2.x, p2.y, fresh ? "sky-line sky-line--new" : "sky-line");
  }

  if (linkFrom && previewPoint) {
    const p1 = starPoint(linkFrom);
    addLine(p1.x, p1.y, previewPoint.x, previewPoint.y, "sky-line sky-line--preview");
  }
}

function addEdge(a, b) {
  if (a === b) return false;
  const key = edgeKey(a, b);
  if (edges.some((e) => edgeKey(e.a, e.b) === key)) {
    linkFrom = b;
    updateLinkUI();
    skyRocket?.traverseLine(a, b);
    renderLines();
    return false;
  }
  if (edges.length >= MAX_SKY_LINES) {
    const oldest = edges.shift();
    if (oldest) playLineRetire(oldest.a, oldest.b);
  }
  edges.push({ a, b, fresh: true });
  window.setTimeout(() => {
    const edge = edges.find((e) => edgeKey(e.a, e.b) === key);
    if (edge) edge.fresh = false;
    renderLines();
  }, 500);

  linkFrom = b;
  skyRocket?.traverseLine(a, b);
  updateLinkUI();
  renderLines();
  return true;
}

function selectLinkFrom(id, pointerOrigin) {
  linkFrom = id;
  previewPoint = null;
  updateLinkUI();
  skyRocket?.flyToStar(id, pointerOrigin);
  renderLines();
}

function onStarActivate(id) {
  if (!linkFrom) {
    selectLinkFrom(id);
    return;
  }
  if (linkFrom === id) return;
  addEdge(linkFrom, id);
}

function buildStars() {
  if (!starsEl) return;
  starsEl.replaceChildren();
  for (const star of STARS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sky-star";
    if (CORE_STAR_IDS.has(star.id)) {
      btn.classList.add("sky-star--core");
    }
    btn.dataset.star = star.id;
    btn.style.left = `${positions.get(star.id)?.x ?? star.x}%`;
    btn.style.top = `${positions.get(star.id)?.y ?? star.y}%`;
    btn.setAttribute(
      "aria-label",
      `${star.label}. Tap to link. Double-tap for a resume note.`
    );
    btn.classList.add(`sky-star--${star.glyph || star.id}`);
    btn.innerHTML = `<span class="sky-star-pad"><span class="sky-star-icon">${glyphMarkup(star)}</span></span><span class="sky-star-label">${star.label}</span>`;
    btn.addEventListener("pointerenter", () => skyRocket?.setHoverStar(star.id));
    btn.addEventListener("pointerleave", () => skyRocket?.clearHoverStar(star.id));
    btn.addEventListener("pointermove", (e) => {
      skyRocket?.trackPointer(e);
      if (skyRocket?.hoverStarId === star.id && skyRocket.mode === "follow") {
        skyRocket.applyFollowPose();
      }
    });
    btn.addEventListener("pointerdown", (e) => onStarPointerDown(e, star.id));
    starsEl.appendChild(btn);
  }
}

function onStarPointerDown(event, id) {
  event.preventDefault();
  event.stopPropagation();
  skyRocket?.trackPointer(event);
  const btn = starEl(id);
  pointer = {
    id,
    pointerId: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    moved: false,
    lastTap: pointer?.id === id ? pointer.lastTap : 0,
  };
  btn?.setPointerCapture(event.pointerId);
  btn?.addEventListener("pointermove", onStarPointerMove);
  btn?.addEventListener("pointerup", onStarPointerUp);
  btn?.addEventListener("pointercancel", onStarPointerUp);

  if (!linkFrom) selectLinkFrom(id, { x: event.clientX, y: event.clientY });
}

function onStarPointerMove(event) {
  skyRocket?.trackPointer(event);
  if (!pointer || event.pointerId !== pointer.pointerId || !mapEl) return;
  const dx = event.clientX - pointer.x;
  const dy = event.clientY - pointer.y;
  if (Math.hypot(dx, dy) < 6) return;
  pointer.moved = true;
  const map = mapEl.getBoundingClientRect();
  previewPoint = { x: event.clientX - map.left, y: event.clientY - map.top };
  renderLines();
}

function onStarPointerUp(event) {
  if (!pointer || event.pointerId !== pointer.pointerId) return;
  const btn = starEl(pointer.id);
  btn?.releasePointerCapture(event.pointerId);
  btn?.removeEventListener("pointermove", onStarPointerMove);
  btn?.removeEventListener("pointerup", onStarPointerUp);
  btn?.removeEventListener("pointercancel", onStarPointerUp);

  const star = BY_ID[pointer.id];
  const now = Date.now();

  if (!pointer.moved) {
    if (now - pointer.lastTap < 380) {
      const idx = factIndex.get(pointer.id) || 0;
      showSummary(`${star.label} · note`, star.facts[idx % star.facts.length], []);
      factIndex.set(pointer.id, idx + 1);
      pointer = null;
      previewPoint = null;
      renderLines();
      return;
    }
    pointer.lastTap = now;
    onStarActivate(pointer.id);
  } else {
    const target = starAtPoint(event.clientX, event.clientY, pointer.id);
    const from = linkFrom || pointer.id;
    if (target && target !== from) addEdge(from, target);
    else if (linkFrom) {
      showStarSummary(linkFrom);
    }
  }

  previewPoint = null;
  pointer = null;
  renderLines();
}

class SkyScribble {
  constructor(canvas, host) {
    this.canvas = canvas;
    this.host = host;
    this.ctx = canvas?.getContext("2d");
    this.dots = [];
    this.drawing = false;
    this.resize();
    window.addEventListener("resize", () => this.resize());
    host?.addEventListener("pointerdown", (e) => this.onDown(e));
    host?.addEventListener("pointermove", (e) => this.onMove(e));
    host?.addEventListener("pointerup", () => this.onUp());
    host?.addEventListener("pointercancel", () => this.onUp());
    this.loop();
  }

  resize() {
    if (!this.canvas || !this.host) return;
    const r = this.host.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.w = r.width;
    this.h = r.height;
    this.canvas.width = this.w * dpr;
    this.canvas.height = this.h * dpr;
    this.canvas.style.width = `${this.w}px`;
    this.canvas.style.height = `${this.h}px`;
    this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  onDown(e) {
    if (e.target.closest(".sky-star")) return;
    this.drawing = true;
    this.add(e);
  }

  onMove(e) {
    if (!this.drawing) return;
    this.add(e);
  }

  onUp() {
    this.drawing = false;
  }

  add(e) {
    if (!this.host || !this.ctx) return;
    const r = this.host.getBoundingClientRect();
    this.dots.push({
      x: e.clientX - r.left,
      y: e.clientY - r.top,
      life: 1,
    });
  }

  loop() {
    if (!this.ctx) return;
    const { ctx, w, h } = this;
    ctx.clearRect(0, 0, w, h);
    for (let i = this.dots.length - 1; i >= 0; i -= 1) {
      const d = this.dots[i];
      d.life -= 0.018;
      if (d.life <= 0) {
        this.dots.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = d.life * 0.65;
      ctx.fillStyle = "#ffe9a8";
      ctx.beginPath();
      ctx.arc(d.x, d.y, 2.2 * d.life + 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(() => this.loop());
  }
}

function initSkillSky() {
  if (!mapEl || !starsEl) return;

  const ready = UI_COPY.ready || {};
  showSummary(ready.kicker || "Ready to link", ready.lead || "", []);

  buildStars();
  if (mapEl && rocketEl) {
    skyRocket = new SkyRocket(mapEl, rocketEl, landedRocketEl);
    skyRocket.onLanded = (starId) => {
      linkFrom = starId;
      updateLinkUI();
      showStarSummary(starId);
      window.applySiteTheme?.(starId);
    };
  }
  renderLines();
  window.addEventListener("resize", () => {
    renderLines();
    skyRocket?.repositionParked();
    if (skyRocket?.mode === "follow") skyRocket.enterFollowMode();
  });

  mapEl.addEventListener("click", (e) => {
    if (e.target.closest(".sky-star")) return;
    previewPoint = null;
    renderLines();
    window.applySiteTheme?.("default");
  });

  if (scribbleEl) new SkyScribble(scribbleEl, mapEl);

  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.setInterval(() => {
      starsEl?.querySelectorAll(".sky-star").forEach((el, i) => {
        el.style.setProperty("--twinkle", String(Math.sin(Date.now() / 900 + i) * 0.5 + 0.5));
      });
    }, 50);
  }
}

async function bootstrapSkillSky() {
  try {
    await loadSkillSkyData();
    initSkillSky();
  } catch (err) {
    console.error(err);
    if (leadEl) {
      leadEl.textContent =
        "Could not load skill sky data. Check that data/skill-sky.json is deployed.";
    }
  }
}

bootstrapSkillSky();
