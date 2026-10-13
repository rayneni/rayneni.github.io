const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = String(new Date().getFullYear());
}

function initSectionIndicator() {
  const root = document.getElementById("site-section-indicator");
  const labelEl = document.getElementById("site-section-label");
  const sections = [...document.querySelectorAll("main section[id]")];
  if (!root || !labelEl || sections.length === 0) return;

  const labels = new Map(
    sections.map((section) => [
      section.id,
      section.querySelector("h2")?.textContent?.trim() || section.id,
    ])
  );
  const ratios = new Map(sections.map((section) => [section.id, 0]));
  let activeId = null;

  function setActive(id) {
    if (id === activeId) return;
    activeId = id;
    if (!id) {
      root.classList.remove("is-visible", "is-bump");
      root.setAttribute("aria-hidden", "true");
      labelEl.textContent = "";
      return;
    }
    labelEl.textContent = labels.get(id) || id;
    root.classList.add("is-visible");
    root.setAttribute("aria-hidden", "false");
    root.classList.remove("is-bump");
    void root.offsetWidth;
    root.classList.add("is-bump");
  }

  function pickActive() {
    let bestId = null;
    let bestRatio = 0;
    for (const [id, ratio] of ratios) {
      if (ratio > bestRatio) {
        bestRatio = ratio;
        bestId = id;
      }
    }
    setActive(bestRatio > 0.08 ? bestId : null);
  }

  const thresholds = [0, 0.08, 0.15, 0.25, 0.4, 0.55, 0.7, 0.85, 1];
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        ratios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
      }
      pickActive();
    },
    { root: null, rootMargin: "-18% 0px -42% 0px", threshold: thresholds }
  );

  sections.forEach((section) => io.observe(section));
  pickActive();
}

initSectionIndicator();

document.querySelectorAll('.site-rail--comms a[href^="mailto:"], .contact-channel[href^="mailto:"]').forEach(
  (link) => {
    link.addEventListener("click", (e) => {
      e.stopPropagation();
      const href = link.getAttribute("href");
      if (!href) return;
      window.location.href = href;
    });
  }
);

document.querySelectorAll(".bg-brick").forEach((brick, index) => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.addEventListener("pointermove", (e) => {
    const shift = (e.clientX / window.innerWidth - 0.5) * (6 + index * 2);
    brick.style.transform = `translateX(${shift}px)`;
  });
});
