<script setup>
import { formatNumber } from "../../utils/format.js";

defineProps({
  summary: {
    type: Object,
    required: true
  }
});
</script>

<template>
  <div class="summary-grid">
    <div class="summary-item"><span>Quantidade</span><strong>{{ summary.quantity }}</strong></div>
    <div class="summary-item"><span>Maior peso</span><strong>{{ formatNumber(summary.max) }} kg</strong></div>
    <div class="summary-item"><span>Menor peso</span><strong>{{ formatNumber(summary.min) }} kg</strong></div>
    <div class="summary-item"><span>Média</span><strong>{{ formatNumber(summary.average) }} kg</strong></div>
    <div class="summary-item"><span>Total</span><strong>{{ formatNumber(summary.total) }} kg</strong></div>
  </div>
</template>
