import { icons } from "../icons/icons.js";
import { escapeHtml } from "../../utils/html.js";

export function renderPropertySheet({ error, property }) {
  const isEditing = Boolean(property);

  return `
    <div class="sheet-backdrop" data-action="close-sheet">
      <form class="sheet" data-form="property">
        <h2>${isEditing ? "Editar propriedade" : "Nova propriedade"}</h2>
        <div class="field">
          <label for="propertyName">Nome da propriedade</label>
          <input id="propertyName" name="name" value="${escapeHtml(property?.name ?? "")}" placeholder="Ex.: Fazenda Santa Clara" autocomplete="off" />
        </div>
        ${error ? `<div class="field-error">${escapeHtml(error)}</div>` : ""}
        <div class="row-actions" style="margin-top: 16px;">
          <button class="btn ghost" type="button" data-action="close-sheet">Cancelar</button>
          <button class="btn green" type="submit">${icons.check} Confirmar</button>
        </div>
      </form>
    </div>
  `;
}
