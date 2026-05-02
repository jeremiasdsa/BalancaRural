import { icons } from "../icons/icons.js";
import { renderBottomNav } from "../navigation/bottomNav.js";
import { renderTopbar } from "../navigation/topbar.js";
import { renderSyncStatus } from "./syncStatus.js";
import { escapeHtml } from "../../utils/html.js";

export function renderAppChrome({
  activeProperty,
  cloud,
  pdfPreviewContent,
  route,
  routeContent,
  sheetContent,
  toast
}) {
  return `
    ${renderTopbar(activeProperty)}

    <main class="app-shell">
      ${renderSyncStatus(cloud)}
      ${routeContent}
    </main>

    <button class="fab" type="button" data-action="open-weight-sheet" aria-label="Adicionar pesagem">${icons.target}</button>

    ${renderBottomNav(route)}

    ${sheetContent}
    ${pdfPreviewContent}
    ${toast ? `<div class="toast">${escapeHtml(toast)}</div>` : ""}
  `;
}
