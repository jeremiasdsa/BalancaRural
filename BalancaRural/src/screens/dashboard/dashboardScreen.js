import { renderRecordCard } from "../../components/cards/recordCard.js";
import { renderEmpty } from "../../components/feedback/emptyState.js";
import { icons } from "../../components/icons/icons.js";
import { formatNumber } from "../../utils/format.js";
import { escapeHtml } from "../../utils/html.js";

export function renderDashboardScreen({ activeProperty, records }) {
  const total = records.reduce((sum, record) => sum + record.weight, 0);

  return `
    <section class="screen">
      <div class="screen-header">
        <div>
          <h1 class="screen-title">Pesagens</h1>
          <p class="screen-subtitle">${escapeHtml(activeProperty?.name ?? "Crie uma propriedade")}</p>
        </div>
      </div>

      <div class="dashboard-total">
        <strong>${formatNumber(total)} kg</strong>
        <span>Total registrado</span>
      </div>

      <div class="action-grid">
        <button class="btn red" type="button" data-action="clear-history">${icons.trash} Limpar histórico</button>
        <button class="btn green" type="button" data-action="open-weight-sheet">${icons.plus} Adicionar</button>
      </div>

      ${records.length ? records.map(renderRecordCard).join("") : renderEmpty("Nenhuma pesagem registrada para esta propriedade.")}
    </section>
  `;
}
