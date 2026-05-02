import { icons } from "../icons/icons.js";
import { escapeHtml } from "../../utils/html.js";

export function renderPropertyCard(property, index, activePropertyId) {
  const isActive = property.id === activePropertyId;
  return `
    <article class="card property-card ${isActive ? "active" : ""}">
      <button class="card-main" type="button" data-action="select-property" data-id="${property.id}" aria-label="Selecionar ${escapeHtml(property.name)}">
        <span>
          <span class="entity-id">#${index + 1}${isActive ? " · Ativa" : ""}</span>
          <span class="entity-name">${escapeHtml(property.name)}</span>
        </span>
      </button>
      <div class="row-actions">
        <button class="btn purple small" type="button" data-action="edit-property" data-id="${property.id}">${icons.pencil} Editar</button>
        <button class="btn red small" type="button" data-action="delete-property" data-id="${property.id}">${icons.trash} Excluir</button>
      </div>
    </article>
  `;
}
