/** Resolve site-relative URLs (works on rval.dev, GitHub Pages, and local static servers). */
window.sitePath = function sitePath(path) {
  const clean = String(path).replace(/^\//, "");
  return new URL(clean, document.baseURI).href;
};
