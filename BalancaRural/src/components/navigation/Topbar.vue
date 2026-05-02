<script setup>
defineProps({
  propertyName: {
    type: String,
    default: "Sem propriedade"
  }
});

defineEmits(["cycle-property", "logout"]);
</script>

<template>
  <header class="topbar">
    <div class="logo" aria-hidden="true">BR</div>
    <button class="property-switcher" data-action="cycle-property" type="button" @click="$emit('cycle-property')">
      <span class="property-title">{{ propertyName || "Sem propriedade" }}</span>
      <span aria-hidden="true">⌄</span>
    </button>
    <button class="topbar-menu" data-action="logout" type="button" @click="$emit('logout')">Sair</button>
  </header>
</template>
