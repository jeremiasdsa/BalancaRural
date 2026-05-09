<script setup>
import { icons } from "../icons/icons.js";

defineProps({
  cloudConnected: {
    type: Boolean,
    default: false
  },
  propertyName: {
    type: String,
    default: "Sem propriedade"
  }
});

defineEmits(["cycle-property", "logout", "sync-cloud"]);
</script>

<template>
  <header class="topbar">
    <div class="logo" aria-hidden="true">BR</div>
    <button class="property-switcher" type="button" @click="$emit('cycle-property')">
      <span class="property-title">{{ propertyName || "Sem propriedade" }}</span>
      <span aria-hidden="true">⌄</span>
    </button>
    <button
      v-if="cloudConnected"
      class="topbar-menu"
      type="button"
      @click="$emit('logout')"
      v-html="`${icons.logout} Sair`"
    ></button>
    <button
      v-else
      class="topbar-menu"
      type="button"
      @click="$emit('sync-cloud')"
      v-html="`${icons.cloud} Nuvem`"
    ></button>
  </header>
</template>
