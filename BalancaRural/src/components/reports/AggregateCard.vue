<script setup>
import { formatNumber } from "../../utils/format.js";

defineProps({
  item: {
    type: Object,
    required: true
  }
});
</script>

<template>
  <article class="card aggregate-card">
    <div class="card-main">
      <div>
        <div class="entity-id">Animal</div>
        <div class="entity-name">{{ item.animalId }}</div>
        <div class="record-date">{{ item.ageCategoryLabel || "Idade não informada" }}</div>
      </div>
      <div class="weight-value">{{ formatNumber(item.lastWeight) }} kg</div>
    </div>
    <div class="summary-grid">
      <div class="summary-item"><span>Pesagens</span><strong>{{ item.quantity }}</strong></div>
      <div class="summary-item"><span>Média</span><strong>{{ formatNumber(item.average) }} kg</strong></div>
      <div class="summary-item"><span>Maior</span><strong>{{ formatNumber(item.max) }} kg</strong></div>
      <div class="summary-item"><span>Menor</span><strong>{{ formatNumber(item.min) }} kg</strong></div>
    </div>
  </article>
</template>
