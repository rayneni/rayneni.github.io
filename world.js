const canvas = document.getElementById("bg-canvas");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function cloneCanvasTheme(t) {
  return {
    sky: [...t.sky],
    nebulae: t.nebulae.map((n) => ({ ...n })),
    starWarm: t.starWarm,
    starCool: t.starCool,
    starStrength: t.starStrength ?? 1,
  };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpColor(c1, c2, t) {
  const parse = (hex) => {
    const h = hex.replace("#", "");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  };
  try {
    const [r1, g1, b1] = parse(c1);
    const [r2, g2, b2] = parse(c2);
    const r = Math.round(lerp(r1, r2, t));
    const g = Math.round(lerp(g1, g2, t));
    const b = Math.round(lerp(b1, b2, t));
    return `rgb(${r},${g},${b})`;
  } catch {
    return t < 0.5 ? c1 : c2;
  }
}

class SiteBackground {
  constructor(el) {
    this.canvas = el;
    this.ctx = el?.getContext("2d");
    this.stars = [];
    this.mouse = { x: 0.5, y: 0.5 };
    this.starStrength = 1;
    this.targetStarStrength = 1;
    const fallback = window.SITE_SPACE?.canvas || window.SITE_THEMES?.default?.space?.canvas;
    this.current = fallback ? cloneCanvasTheme(fallback) : null;
    this.target = this.current ? cloneCanvasTheme(this.current) : null;
    this.themeEase = 0.016;
    this.resize();
    this.seed();
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("site-theme-change", (e) => {
      const th = e.detail?.theme?.canvas;
      if (!th) return;
      this.target = cloneCanvasTheme(th);
      this.targetStarStrength = th.starStrength ?? (e.detail.mode === "space" ? 1 : 0.12);
      if (e.detail.snap) {
        this.current = cloneCanvasTheme(this.target);
        this.starStrength = this.targetStarStrength;
      }
      this.themeEase = e.detail.snap ? 1 : 0.016;
    });
    if (!reduceMotion) {
      window.addEventListener("pointermove", (e) => {
        this.mouse.x = e.clientX / window.innerWidth;
        this.mouse.y = e.clientY / window.innerHeight;
      });
      this.loop();
    } else {
      this.drawStatic();
    }
  }

  resize() {
    if (!this.canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = this.w * dpr;
    this.canvas.height = this.h * dpr;
    this.canvas.style.width = `${this.w}px`;
    this.canvas.style.height = `${this.h}px`;
    this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  seed() {
    this.stars = Array.from({ length: reduceMotion ? 80 : 140 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.78,
      z: 0.12 + Math.random() * 0.88,
      phase: Math.random() * Math.PI * 2,
    }));
  }

  tickTheme() {
    if (!this.current || !this.target) return;
    const ease = this.themeEase ?? 0.016;
    for (let i = 0; i < 3; i++) {
      this.current.sky[i] = lerpColor(this.current.sky[i], this.target.sky[i], ease);
    }
    this.current.starWarm = lerpColor(this.current.starWarm, this.target.starWarm, ease);
    this.current.starCool = lerpColor(this.current.starCool, this.target.starCool, ease);
    this.starStrength = lerp(this.starStrength, this.targetStarStrength, ease);
    for (let i = 0; i < this.current.nebulae.length; i++) {
      const c = this.current.nebulae[i];
      const t = this.target.nebulae[i];
      if (!t) continue;
      c.x = lerp(c.x, t.x, ease);
      c.y = lerp(c.y, t.y, ease);
      c.r = lerp(c.r, t.r, ease);
      c.color = t.color;
    }
  }

  drawStatic() {
    if (!this.ctx || !this.current) return;
    const { ctx, w, h, current: th } = this;
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, th.sky[0]);
    sky.addColorStop(0.45, th.sky[1]);
    sky.addColorStop(1, th.sky[2]);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    for (const star of this.stars) {
      ctx.globalAlpha = star.z * 0.75 * this.starStrength;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(star.x * w, star.y * h, (1 - star.z) * 1.8 + 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  loop() {
    if (!this.ctx || !this.current) return;
    this.tickTheme();
    const { ctx, w, h, current: th } = this;
    const t = Date.now() * 0.00035;
    const parallaxX = (this.mouse.x - 0.5) * 18;
    const parallaxY = (this.mouse.y - 0.5) * 10;

    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, th.sky[0]);
    sky.addColorStop(0.45, th.sky[1]);
    sky.addColorStop(1, th.sky[2]);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    for (const neb of th.nebulae) {
      const g = ctx.createRadialGradient(
        w * (neb.x + parallaxX * 0.002),
        h * (neb.y + parallaxY * 0.002),
        0,
        w * neb.x,
        h * neb.y,
        w * neb.r
      );
      g.addColorStop(0, neb.color);
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }

    const strength = this.starStrength;
    for (const star of this.stars) {
      const sx = star.x * w + parallaxX * star.z;
      const sy = star.y * h + parallaxY * star.z;
      const flicker = 0.5 + Math.sin(t * 3 + star.phase) * 0.24;
      const size = (1 - star.z) * 2 + 0.35;
      ctx.globalAlpha = flicker * star.z * strength;
      ctx.fillStyle = star.z > 0.7 ? th.starWarm : th.starCool;
      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    requestAnimationFrame(() => this.loop());
  }
}

if (canvas) {
  const boot = () => new SiteBackground(canvas);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
}
