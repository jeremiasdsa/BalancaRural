<script setup>
defineProps({
  route: {
    type: String,
    default: "dashboard"
  }
});

defineEmits(["navigate"]);
</script>

<template>
  <nav class="bottom-nav" aria-label="Navegação principal">
    <button
      class="nav-btn"
      :class="{ active: route === 'properties' }"
      type="button"
      @click="$emit('navigate', 'properties')"
    >
      Propriedades
    </button>
    <span></span>
    <button
      class="nav-btn"
      :class="{ active: route.startsWith('reports') }"
      type="button"
      @click="$emit('navigate', 'reports-home')"
    >
      Relatórios
    </button>
  </nav>
</template>
