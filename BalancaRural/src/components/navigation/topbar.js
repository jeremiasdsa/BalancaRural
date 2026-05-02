import { escapeHtml } from "../../utils/html.js";

export function renderTopbar(activeProperty) {
  return `
    <header class="topbar">
      <div class="logo" aria-hidden="true">BR</div>
      <button class="property-switcher" data-action="cycle-property" type="button">
        <span class="property-title">${escapeHtml(activeProperty?.name ?? "Sem propriedade")}</span>
        <span aria-hidden="true">⌄</span>
      </button>
      <button class="topbar-menu" type="button" data-action="logout">Sair</button>
    </header>
  `;
}
