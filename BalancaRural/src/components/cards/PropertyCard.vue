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
</script>

<template>
  <article class="card property-card" :class="{ active: property.id === activePropertyId }">
    <button
      class="card-main"
      type="button"
      data-action="select-property"
      :data-id="property.id"
      :aria-label="`Selecionar ${property.name}`"
    >
      <span>
        <span class="entity-id">#{{ index + 1 }}{{ property.id === activePropertyId ? " · Ativa" : "" }}</span>
        <span class="entity-name">{{ property.name }}</span>
      </span>
    </button>
    <div class="row-actions">
      <button class="btn purple small" type="button" data-action="edit-property" :data-id="property.id" v-html="`${icons.pencil} Editar`"></button>
      <button class="btn red small" type="button" data-action="delete-property" :data-id="property.id" v-html="`${icons.trash} Excluir`"></button>
    </div>
  </article>
</template>
