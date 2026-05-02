<script setup>
import { formatNumber } from "../../utils/format.js";

defineProps({
  summary: {
    type: Object,
    required: true
  }
});

function formatWeight(value) {
  return `${formatNumber(value)} kg`;
}
</script>

<template>
  <div class="report-summary">
    <div class="summary-overview">
      <div class="summary-kpi">
        <span>Total de animais</span>
        <strong>{{ summary.quantity }}</strong>
      </div>
      <div class="summary-kpi">
        <span>Peso total</span>
        <strong>{{ formatWeight(summary.total) }}</strong>
      </div>
      <div class="summary-kpi">
        <span>Média geral</span>
        <strong>{{ formatWeight(summary.average) }}</strong>
      </div>
    </div>

    <h2 class="summary-section-title">Distribuição por sexo</h2>
    <div class="sex-summary-grid">
      <article class="sex-summary-card male">
        <header>
          <span class="sex-icon">M</span>
          <strong>Machos</strong>
          <em>{{ summary.male.quantity }}</em>
        </header>
        <dl>
          <div><dt>Quantidade</dt><dd>{{ summary.male.quantity }}</dd></div>
          <div><dt>Peso total</dt><dd>{{ formatWeight(summary.male.total) }}</dd></div>
          <div><dt>Média</dt><dd>{{ formatWeight(summary.male.average) }}</dd></div>
        </dl>
      </article>

      <article class="sex-summary-card female">
        <header>
          <span class="sex-icon">F</span>
          <strong>Fêmeas</strong>
          <em>{{ summary.female.quantity }}</em>
        </header>
        <dl>
          <div><dt>Quantidade</dt><dd>{{ summary.female.quantity }}</dd></div>
          <div><dt>Peso total</dt><dd>{{ formatWeight(summary.female.total) }}</dd></div>
          <div><dt>Média</dt><dd>{{ formatWeight(summary.female.average) }}</dd></div>
        </dl>
      </article>
    </div>

    <h2 class="summary-section-title">Estatísticas de peso</h2>
    <article class="weight-stats-card">
      <div class="weight-stats-main">
        <div>
          <span>Menor peso</span>
          <strong>{{ formatWeight(summary.min) }}</strong>
        </div>
        <div>
          <span>Maior peso</span>
          <strong>{{ formatWeight(summary.max) }}</strong>
        </div>
      </div>
      <div class="weight-stats-by-sex">
        <div>
          <strong>Machos</strong>
          <span>Menor: {{ formatWeight(summary.male.min) }}</span>
          <span>Maior: {{ formatWeight(summary.male.max) }}</span>
        </div>
        <div>
          <strong>Fêmeas</strong>
          <span>Menor: {{ formatWeight(summary.female.min) }}</span>
          <span>Maior: {{ formatWeight(summary.female.max) }}</span>
        </div>
      </div>
    </article>
  </div>
</template>
