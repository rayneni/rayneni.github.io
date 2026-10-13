(function initMotion() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scrollAnchorOffset = () => {
    const v = getComputedStyle(document.documentElement).getPropertyValue("--scroll-anchor-offset");
    const n = Number.parseFloat(v);
    return Number.isFinite(n) ? n : 16;
  };

  const appleEase = (t) => Math.min(1, 1.001 - 2 ** (-10 * t));

  function bootHero() {
    const hero = document.querySelector(".hero");
    if (!hero || reduceMotion) {
      hero?.querySelectorAll(".reveal--hero").forEach((el) => el.classList.add("is-visible"));
      return;
    }
    requestAnimationFrame(() => hero.classList.add("is-booted"));
  }

  function markScrollableRegions() {
    document
      .querySelectorAll(".sky-summary, .sky-map, .career-track-wrap, .edu-track-wrap")
      .forEach((el) => {
        el.setAttribute("data-lenis-prevent", "");
      });
  }

  function bootReveals(onScroll) {
    const panels = [...document.querySelectorAll(".reveal.panel")];
    if (!panels.length) return;

    if (reduceMotion) {
      panels.forEach((el) => {
        el.classList.add("is-visible");
        el.style.opacity = "";
        el.style.transform = "";
      });
      return;
    }

    const root = document.documentElement;
    const scaleMin = () => {
      const v = getComputedStyle(root).getPropertyValue("--reveal-scale-min");
      const n = Number.parseFloat(v);
      return Number.isFinite(n) ? n : 0.82;
    };
    const liftPx = () => {
      const v = getComputedStyle(root).getPropertyValue("--reveal-lift");
      const n = Number.parseFloat(v);
      return Number.isFinite(n) ? n : 48;
    };

    function panelRevealProgress(el, r, vh) {
      if (r.bottom <= 0 || r.top >= vh) return 0;

      const visibleTop = Math.max(r.top, 0);
      const visibleBottom = Math.min(r.bottom, vh);
      const visible = visibleBottom - visibleTop;
      if (visible <= 0) return 0;

      const height = r.height || el.offsetHeight || 1;
      const targetVisible = Math.min(height, vh * 0.68);
      let p = Math.min(1, visible / Math.max(targetVisible, 1));

      const center = r.top + height / 2;
      const focusY = vh * 0.44;
      const focusSpread = vh * 0.5;
      const focus = 1 - Math.min(1, Math.abs(center - focusY) / focusSpread);
      p *= 0.5 + focus * 0.5;

      const offTop = Math.max(0, -r.top);
      const offBottom = Math.max(0, r.bottom - vh);
      const clipped = offTop + offBottom;
      p *= 1 - Math.min(1, clipped / Math.max(height * 0.9, 1));

      const maxScroll = document.documentElement.scrollHeight - vh;
      const scrollY = window.__lenis?.scroll ?? window.scrollY ?? 0;
      const atPageEnd = maxScroll - scrollY <= 6;
      if (atPageEnd && r.bottom > 0 && r.top < vh) {
        const endBoost = Math.min(1, visible / Math.max(vh * 0.26, 1));
        p = Math.max(p, endBoost);
      }

      return Math.max(0, Math.min(1, p));
    }

    function tickPanelScale() {
      const vh = window.innerHeight;
      const min = scaleMin();
      const lift = liftPx();

      for (const el of panels) {
        const r = el.getBoundingClientRect();
        const p = panelRevealProgress(el, r, vh);

        if (p <= 0.01) {
          el.classList.remove("is-visible", "is-revealing");
          el.style.opacity = "0";
          el.style.transform = `translate3d(0, ${lift}px, 0) scale(${min})`;
          continue;
        }

        const scale = min + p * (1 - min);
        const y = (1 - p) * lift;

        el.classList.add("is-revealing");
        el.classList.toggle("is-visible", p >= 0.92);
        el.style.opacity = String(0.08 + p * 0.92);
        el.style.transform = `translate3d(0, ${y}px, 0) scale(${scale})`;
      }
    }

    onScroll?.(tickPanelScale);
    tickPanelScale();
    window.addEventListener("resize", tickPanelScale, { passive: true });
    window.addEventListener("load", tickPanelScale, { once: true });
  }

  function bootHeroParallax(onScroll) {
    const hero = document.querySelector(".hero");
    if (!hero || reduceMotion) return;

    const tick = () => {
      const scroll = window.scrollY || 0;
      const h = hero.offsetHeight || 1;
      const t = Math.min(scroll / h, 1);
      const y = scroll * 0.28;
      hero.style.transform = `translate3d(0, ${y}px, 0)`;
      hero.style.opacity = String(1 - t * 0.42);
    };

    tick();
    onScroll?.(tick);
  }

  function bindAnchorScroll(scrollTo) {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (e) => {
        const hash = link.getAttribute("href");
        if (!hash || hash === "#") return;
        const target = document.querySelector(hash);
        if (!target) return;
        e.preventDefault();
        scrollTo(target);
      });
    });
  }

  function startLenis() {
    if (reduceMotion || typeof Lenis !== "function") return null;

    const lenis = new Lenis({
      lerp: 0.09,
      duration: 1.35,
      easing: appleEase,
      smoothWheel: true,
      wheelMultiplier: 0.78,
      touchMultiplier: 0.92,
      syncTouch: true,
      syncTouchLerp: 0.085,
      touchInertiaMultiplier: 28,
      infinite: false,
      autoResize: true,
      overscroll: true,
    });

    document.documentElement.classList.add("lenis", "lenis-smooth");

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    bindAnchorScroll((el) => {
      lenis.scrollTo(el, {
        offset: -scrollAnchorOffset(),
        duration: 1.55,
        easing: appleEase,
      });
    });

    window.__lenis = lenis;
    return lenis;
  }

  function startNativeScroll() {
    bindAnchorScroll((el) => {
      const top = el.getBoundingClientRect().top + window.scrollY - scrollAnchorOffset();
      window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  markScrollableRegions();
  bootHero();

  const lenis = startLenis();
  const onScroll = (fn) => {
    if (lenis) lenis.on("scroll", fn);
    else window.addEventListener("scroll", fn, { passive: true });
  };

  bootReveals(onScroll);
  bootHeroParallax(onScroll);

  onScroll(() => {
    window.dispatchEvent(
      new CustomEvent("site-scroll", {
        detail: { scroll: lenis?.scroll ?? window.scrollY },
      })
    );
  });

  if (lenis) return;
  startNativeScroll();
})();
