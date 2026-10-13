(function initMotion() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarsePointer = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  const scrollAnchorOffset = () => {
    const v = getComputedStyle(document.documentElement).getPropertyValue("--scroll-anchor-offset");
    const n = Number.parseFloat(v);
    return Number.isFinite(n) ? n : 16;
  };

  function bootHero() {
    const hero = document.querySelector(".hero");
    if (!hero || reduceMotion) {
      hero?.querySelectorAll(".reveal--hero").forEach((el) => el.classList.add("is-visible"));
      return;
    }
    requestAnimationFrame(() => hero.classList.add("is-booted"));
  }

  function bootReveals(onScroll) {
    const targets = document.querySelectorAll(".reveal:not(.reveal--hero)");
    if (!targets.length) return;

    if (reduceMotion) {
      targets.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target;
          el.classList.add("is-visible");
          el.querySelectorAll(".reveal-stagger").forEach((stagger) => {
            stagger.classList.add("is-visible");
          });
          io.unobserve(el);
        }
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );

    const revealInView = () => {
      for (const el of targets) {
        if (el.classList.contains("is-visible")) continue;
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.94 && r.bottom > 0) {
          el.classList.add("is-visible");
          el.querySelectorAll(".reveal-stagger").forEach((stagger) => {
            stagger.classList.add("is-visible");
          });
          io.unobserve(el);
        }
      }
    };

    targets.forEach((el) => io.observe(el));
    revealInView();
    requestAnimationFrame(revealInView);
    window.addEventListener("load", revealInView, { once: true });
    window.addEventListener("resize", revealInView, { passive: true });
    onScroll?.(revealInView);
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
    if (reduceMotion || coarsePointer || typeof Lenis !== "function") return null;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.92,
      touchMultiplier: 1.15,
      infinite: false,
    });

    document.documentElement.classList.add("lenis", "lenis-smooth");

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    bindAnchorScroll((el) => {
      lenis.scrollTo(el, { offset: -scrollAnchorOffset(), duration: 1.35 });
    });

    return lenis;
  }

  function startNativeScroll() {
    bindAnchorScroll((el) => {
      const top = el.getBoundingClientRect().top + window.scrollY - scrollAnchorOffset();
      window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  bootHero();
  const lenis = startLenis();
  bootReveals((cb) => {
    if (lenis) lenis.on("scroll", cb);
    else window.addEventListener("scroll", cb, { passive: true });
  });

  if (lenis) return;
  startNativeScroll();
})();
