import { icons } from "../icons/icons.js";
import { formatDateTime, formatNumber } from "../../utils/format.js";
import { escapeHtml } from "../../utils/html.js";

export function renderRecordCard(record) {
  return `
    <article class="card record-card">
      <div class="card-main">
        <div>
          <div class="animal-id">${escapeHtml(record.animalId)}</div>
          <div class="record-date">${formatDateTime(record.timestamp)}</div>
        </div>
        <div class="weight-value">${formatNumber(record.weight)} kg</div>
      </div>
      <div class="row-actions">
        <button class="btn red small" type="button" data-action="delete-record" data-id="${record.id}">${icons.trash} Excluir</button>
        <button class="btn yellow small" type="button" data-action="edit-record" data-id="${record.id}">${icons.pencil} Editar</button>
      </div>
    </article>
  `;
}
