import { renderEmpty } from "../../../components/feedback/emptyState.js";
import { renderAggregateCard } from "../../../components/reports/aggregateCard.js";
import { renderReportFilters } from "../../../components/reports/reportFilters.js";
import { renderReportSummary } from "../../../components/reports/reportSummary.js";
import { escapeHtml } from "../../../utils/html.js";

export function renderSummaryReportScreen({
  activeProperty,
  aggregates,
  animals,
  filters,
  selectedAnimal,
  summary
}) {
  return `
    <section class="screen">
      <h1 class="screen-title">Relatório Resumido</h1>
      <p class="screen-subtitle">${escapeHtml(activeProperty?.name ?? "")}</p>
      <div class="field" style="margin-top: 14px;">
        <label for="summary-animal">Animal</label>
        <select id="summary-animal" data-action="summary-animal">
          <option ${selectedAnimal === "Todos" ? "selected" : ""}>Todos</option>
          ${animals.map((animal) => `<option ${selectedAnimal === animal ? "selected" : ""}>${escapeHtml(animal)}</option>`).join("")}
        </select>
      </div>
      ${renderReportFilters(filters)}
      <div class="row-actions" style="margin-top: 14px;">
        <button class="btn green small" type="button" data-action="export-summary-csv">CSV</button>
        <button class="btn red small" type="button" data-action="export-summary-pdf">PDF</button>
      </div>
      ${renderReportSummary(summary)}
      ${
        aggregates.length
          ? aggregates.map(renderAggregateCard).join("")
          : renderEmpty("Nenhum dado agregado encontrado.")
      }
    </section>
  `;
}
