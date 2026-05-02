<script setup>
import { icons } from "../icons/icons.js";

defineProps({
  activePropertyId: {
    type: String,
    default: null
  },
  index: {
    type: Number,
    required: true
  },
  property: {
    type: Object,
    required: true
  }
});

defineEmits(["delete-property", "edit-property", "select-property"]);
</script>

<template>
  <article class="card property-card" :class="{ active: property.id === activePropertyId }">
    <button
      class="card-main"
      type="button"
      :aria-label="`Selecionar ${property.name}`"
      @click="$emit('select-property', property.id)"
    >
      <span>
        <span class="entity-id">#{{ index + 1 }}{{ property.id === activePropertyId ? " · Ativa " : " " }}</span>
        <span class="entity-name">{{ property.name }}</span>
      </span>
    </button>
    <div class="row-actions">
      <button class="btn purple small" type="button" @click="$emit('edit-property', property.id)" v-html="`${icons.pencil} Editar`"></button>
      <button class="btn red small" type="button" @click="$emit('delete-property', property.id)" v-html="`${icons.trash} Excluir`"></button>
    </div>
  </article>
</template>
