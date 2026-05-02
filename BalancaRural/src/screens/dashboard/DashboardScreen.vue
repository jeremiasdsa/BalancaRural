<script setup>
import RecordCard from "../../components/cards/RecordCard.vue";
import { icons } from "../../components/icons/icons.js";
import { formatNumber } from "../../utils/format.js";
import { computed } from "vue";

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

defineEmits(["clear-history", "delete-record", "edit-record", "open-weight-sheet"]);

const totalWeight = computed(() => props.records.reduce((sum, record) => sum + record.weight, 0));
const animalCount = computed(() => new Set(props.records.map((record) => record.animalId)).size);
</script>

<template>
  <section class="screen">
    <div class="screen-header">
      <div>
        <h1 class="screen-title">Pesagens</h1>
        <p class="screen-subtitle">{{ activePropertyName || "Crie uma propriedade" }}</p>
      </div>
    </div>

    <div class="dashboard-total-card">
      <div class="dashboard-total-icon" v-html="icons.scale"></div>
      <div class="dashboard-total-main">
        <span>Total registrado</span>
        <strong>{{ formatNumber(totalWeight) }} kg</strong>
      </div>
      <div class="dashboard-total-count">
        <span v-html="icons.chart"></span>
        <strong>{{ animalCount }}</strong>
        <em>{{ animalCount === 1 ? "animal" : "animais" }}</em>
      </div>
    </div>

    <div class="action-grid">
      <button class="btn red" type="button" @click="$emit('clear-history')" v-html="`${icons.trash} Limpar histórico`"></button>
      <button class="btn green" type="button" @click="$emit('open-weight-sheet')" v-html="`${icons.plus} Adicionar pesagem`"></button>
    </div>

    <div class="records-section-header">
      <h2 v-html="`${icons.clipboard} Animais registrados`"></h2>
      <span>{{ records.length }} {{ records.length === 1 ? "registro" : "registros" }}</span>
    </div>

    <RecordCard
      v-for="(record, index) in records"
      :key="record.id"
      variant="dashboard"
      :initial-expanded="index === 0"
      :record="record"
      @delete-record="$emit('delete-record', $event)"
      @edit-record="$emit('edit-record', $event)"
    />
    <div v-if="!records.length" class="empty-state">Nenhuma pesagem registrada para esta propriedade.</div>
  </section>
</template>
