import { escapeHtml } from "../../utils/html.js";

export function renderSyncStatus(cloud) {
  const modifier = cloud.enabled ? "online" : "offline";
  return `
    <div class="sync-status ${modifier}">
      <span></span>
      ${escapeHtml(cloud.message)}
    </div>
  `;
}
