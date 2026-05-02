<script setup>
import AggregateCard from "../../../components/reports/AggregateCard.vue";
import ReportFilters from "../../../components/reports/ReportFilters.vue";
import ReportSummary from "../../../components/reports/ReportSummary.vue";

defineProps({
  activePropertyName: {
    type: String,
    default: ""
  },
  aggregates: {
    type: Array,
    default: () => []
  },
  animals: {
    type: Array,
    default: () => []
  },
  filters: {
    type: Object,
    required: true
  },
  selectedAnimal: {
    type: String,
    default: "Todos"
  },
  summary: {
    type: Object,
    required: true
  }
});
</script>

<template>
  <section class="screen">
    <h1 class="screen-title">Relatório Resumido</h1>
    <p class="screen-subtitle">{{ activePropertyName }}</p>
    <div class="field" style="margin-top: 14px;">
      <label for="summary-animal">Animal</label>
      <select id="summary-animal" data-action="summary-animal" :value="selectedAnimal">
        <option>Todos</option>
        <option
          v-for="animal in animals"
          :key="animal"
          :value="animal"
        >
          {{ animal }}
        </option>
      </select>
    </div>
    <ReportFilters :filters="filters" />
    <div class="row-actions" style="margin-top: 14px;">
      <button class="btn green small" type="button" data-action="export-summary-csv">CSV</button>
      <button class="btn red small" type="button" data-action="export-summary-pdf">PDF</button>
    </div>
    <ReportSummary :summary="summary" />
    <AggregateCard
      v-for="item in aggregates"
      :key="item.animalId"
      :item="item"
    />
    <div v-if="!aggregates.length" class="empty-state">Nenhum dado agregado encontrado.</div>
  </section>
</template>
