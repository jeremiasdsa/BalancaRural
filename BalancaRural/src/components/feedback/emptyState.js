import { escapeHtml } from "../../utils/html.js";

export function renderEmpty(message) {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}
