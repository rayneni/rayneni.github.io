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
    const targets = [...document.querySelectorAll(".reveal:not(.reveal--hero)")];
    if (!targets.length) return;

    if (reduceMotion) {
      targets.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          commitReveal(entry.target);
        }
      },
      { root: null, rootMargin: "0px 0px -6% 0px", threshold: [0, 0.12, 0.25] }
    );

    function commitReveal(el) {
      el.classList.add("is-visible");
      el.classList.remove("is-revealing");
      el.style.removeProperty("--reveal-p");
      el.querySelectorAll(".reveal-stagger").forEach((stagger) => {
        stagger.classList.add("is-visible");
      });
      io.unobserve(el);
    }

    const hasViewTimeline =
      typeof CSS !== "undefined" && CSS.supports("animation-timeline: view()");

    function scrubReveals() {
      if (hasViewTimeline) return;
      const vh = window.innerHeight;
      for (const el of targets) {
        if (el.classList.contains("is-visible")) continue;
        const r = el.getBoundingClientRect();
        const start = vh * 0.88;
        const end = vh * 0.38;
        const p = 1 - (r.top - end) / (start - end);
        const t = Math.max(0, Math.min(1, p));
        if (t <= 0.01) {
          el.classList.remove("is-revealing");
          el.style.removeProperty("--reveal-p");
          continue;
        }
        el.classList.add("is-revealing");
        el.style.setProperty("--reveal-p", t.toFixed(3));
        if (t >= 0.98) commitReveal(el);
      }
    }

    targets.forEach((el) => io.observe(el));
    scrubReveals();
    onScroll?.(scrubReveals);
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
