import { icons } from "../icons/icons.js";
import { escapeHtml } from "../../utils/html.js";

export function renderReportFilters(filters) {
  return `
    <details class="filters">
      <summary>${icons.filter} Filtros</summary>
      <div class="filters-panel">
        <div class="field">
          <label for="filter-animal">Código do Animal</label>
          <input id="filter-animal" value="${escapeHtml(filters.animalId)}" placeholder="Digite o código do animal" data-filter="animalId" />
        </div>
        <div class="field">
          <label for="filter-from">Data inicial</label>
          <input id="filter-from" type="date" value="${escapeHtml(filters.from)}" data-filter="from" />
        </div>
        <div class="field">
          <label for="filter-to">Data final</label>
          <input id="filter-to" type="date" value="${escapeHtml(filters.to)}" data-filter="to" />
        </div>
      </div>
    </details>
  `;
}
