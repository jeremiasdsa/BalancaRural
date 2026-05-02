<script setup>
import { icons } from "../icons/icons.js";

defineProps({
  filters: {
    type: Object,
    required: true
  }
});

defineEmits(["filter-change"]);
</script>

<template>
  <details class="filters">
    <summary v-html="`${icons.filter} Filtros`"></summary>
    <div class="filters-panel">
      <div class="field">
        <label for="filter-animal">Código do Animal</label>
        <input
          id="filter-animal"
          :value="filters.animalId"
          placeholder="Digite o código do animal"
          @input="$emit('filter-change', 'animalId', $event.target.value)"
        />
      </div>
      <div class="field">
        <label for="filter-from">Data inicial</label>
        <input
          id="filter-from"
          type="date"
          :value="filters.from"
          @input="$emit('filter-change', 'from', $event.target.value)"
        />
      </div>
      <div class="field">
        <label for="filter-to">Data final</label>
        <input
          id="filter-to"
          type="date"
          :value="filters.to"
          @input="$emit('filter-change', 'to', $event.target.value)"
        />
      </div>
    </div>
  </details>
</template>
