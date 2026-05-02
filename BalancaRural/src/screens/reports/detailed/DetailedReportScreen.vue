<script setup>
import RecordCard from "../../../components/cards/RecordCard.vue";
import ReportFilters from "../../../components/reports/ReportFilters.vue";
import ReportSummary from "../../../components/reports/ReportSummary.vue";

defineProps({
  activePropertyName: {
    type: String,
    default: ""
  },
  filteredRecords: {
    type: Array,
    default: () => []
  },
  filters: {
    type: Object,
    required: true
  },
  summary: {
    type: Object,
    required: true
  }
});

defineEmits(["delete-filtered-records", "export-csv", "export-pdf", "filter-change"]);
</script>

<template>
  <section class="screen">
    <div class="screen-header">
      <div>
        <h1 class="screen-title">Relatório Detalhado</h1>
        <p class="screen-subtitle">{{ activePropertyName }}</p>
      </div>
    </div>
    <ReportFilters :filters="filters" @filter-change="(...args) => $emit('filter-change', ...args)" />
    <div class="row-actions" style="margin-top: 14px;">
      <button class="btn green small" type="button" @click="$emit('export-csv')">CSV</button>
      <button class="btn red small" type="button" @click="$emit('export-pdf')">PDF</button>
      <button class="btn red small" type="button" @click="$emit('delete-filtered-records')">Excluir tudo</button>
    </div>
    <ReportSummary :summary="summary" />
    <RecordCard
      v-for="record in filteredRecords"
      :key="record.id"
      :record="record"
    />
    <div v-if="!filteredRecords.length" class="empty-state">Nenhum registro encontrado com os filtros atuais.</div>
  </section>
</template>
