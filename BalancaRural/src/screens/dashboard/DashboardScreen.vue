<script setup>
import RecordCard from "../../components/cards/RecordCard.vue";
import { icons } from "../../components/icons/icons.js";
import { formatNumber } from "../../utils/format.js";

const props = defineProps({
  activePropertyName: {
    type: String,
    default: "Crie uma propriedade"
  },
  records: {
    type: Array,
    default: () => []
  }
});
</script>

<template>
  <section class="screen">
    <div class="screen-header">
      <div>
        <h1 class="screen-title">Pesagens</h1>
        <p class="screen-subtitle">{{ activePropertyName || "Crie uma propriedade" }}</p>
      </div>
    </div>

    <div class="dashboard-total">
      <strong>{{ formatNumber(records.reduce((sum, record) => sum + record.weight, 0)) }} kg</strong>
      <span>Total registrado</span>
    </div>

    <div class="action-grid">
      <button class="btn red" type="button" data-action="clear-history" v-html="`${icons.trash} Limpar histórico`"></button>
      <button class="btn green" type="button" data-action="open-weight-sheet" v-html="`${icons.plus} Adicionar`"></button>
    </div>

    <RecordCard
      v-for="record in records"
      :key="record.id"
      :record="record"
    />
    <div v-if="!records.length" class="empty-state">Nenhuma pesagem registrada para esta propriedade.</div>
  </section>
</template>
