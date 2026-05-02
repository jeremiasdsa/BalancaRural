<script setup>
import { icons } from "../icons/icons.js";
import { formatDateTime, formatNumber } from "../../utils/format.js";

defineProps({
  record: {
    type: Object,
    required: true
  }
});

defineEmits(["delete-record", "edit-record"]);
</script>

<template>
  <article class="card record-card">
    <div class="card-main">
      <div>
        <div class="animal-id">{{ record.animalId }}</div>
        <div class="record-date">{{ formatDateTime(record.timestamp) }}</div>
      </div>
      <div class="weight-value">{{ formatNumber(record.weight) }} kg</div>
    </div>
    <div class="row-actions">
      <button class="btn red small" type="button" @click="$emit('delete-record', record.id)" v-html="`${icons.trash} Excluir`"></button>
      <button class="btn yellow small" type="button" @click="$emit('edit-record', record.id)" v-html="`${icons.pencil} Editar`"></button>
    </div>
  </article>
</template>
