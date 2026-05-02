import { renderRecordCard } from "../../../components/cards/recordCard.js";
import { renderEmpty } from "../../../components/feedback/emptyState.js";
import { renderReportFilters } from "../../../components/reports/reportFilters.js";
import { renderReportSummary } from "../../../components/reports/reportSummary.js";
import { escapeHtml } from "../../../utils/html.js";

export function renderDetailedReportScreen({ activeProperty, filteredRecords, filters, summary }) {
  return `
    <section class="screen">
      <div class="screen-header">
        <div>
          <h1 class="screen-title">Relatório Detalhado</h1>
          <p class="screen-subtitle">${escapeHtml(activeProperty?.name ?? "")}</p>
        </div>
      </div>
      ${renderReportFilters(filters)}
      <div class="row-actions" style="margin-top: 14px;">
        <button class="btn green small" type="button" data-action="export-detailed-csv">CSV</button>
        <button class="btn red small" type="button" data-action="export-detailed-pdf">PDF</button>
        <button class="btn red small" type="button" data-action="delete-filtered">Excluir tudo</button>
      </div>
      ${renderReportSummary(summary)}
      ${filteredRecords.length ? filteredRecords.map(renderRecordCard).join("") : renderEmpty("Nenhum registro encontrado com os filtros atuais.")}
    </section>
  `;
}
