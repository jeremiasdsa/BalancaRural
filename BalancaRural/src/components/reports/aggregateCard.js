import { formatNumber } from "../../utils/format.js";
import { escapeHtml } from "../../utils/html.js";

export function renderAggregateCard(item) {
  return `
    <article class="card aggregate-card">
      <div class="card-main">
        <div>
          <div class="entity-id">Animal</div>
          <div class="entity-name">${escapeHtml(item.animalId)}</div>
        </div>
        <div class="weight-value">${formatNumber(item.lastWeight)} kg</div>
      </div>
      <div class="summary-grid">
        <div class="summary-item"><span>Pesagens</span><strong>${item.quantity}</strong></div>
        <div class="summary-item"><span>Média</span><strong>${formatNumber(item.average)} kg</strong></div>
        <div class="summary-item"><span>Maior</span><strong>${formatNumber(item.max)} kg</strong></div>
        <div class="summary-item"><span>Menor</span><strong>${formatNumber(item.min)} kg</strong></div>
      </div>
    </article>
  `;
}
