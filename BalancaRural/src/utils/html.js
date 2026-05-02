export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function svg(path) {
  return `<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;
}
