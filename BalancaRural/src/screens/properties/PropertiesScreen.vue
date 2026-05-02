<script setup>
import PropertyCard from "../../components/cards/PropertyCard.vue";
import { icons } from "../../components/icons/icons.js";

defineProps({
  activePropertyId: {
    type: String,
    default: null
  },
  properties: {
    type: Array,
    default: () => []
  }
});
</script>

<template>
  <section class="screen">
    <div class="screen-header">
      <div>
        <h1 class="screen-title">Propriedades</h1>
        <p class="screen-subtitle">Selecione onde as pesagens serão registradas.</p>
      </div>
      <button class="btn green small" type="button" data-action="create-property" v-html="`${icons.plus} Novo`"></button>
    </div>

    <PropertyCard
      v-for="(property, index) in properties"
      :key="property.id"
      :active-property-id="activePropertyId"
      :index="index"
      :property="property"
    />
  </section>
</template>
