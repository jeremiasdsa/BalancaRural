<script setup>
import BottomNav from "../navigation/BottomNav.vue";
import Topbar from "../navigation/Topbar.vue";
import SyncStatus from "./SyncStatus.vue";

defineProps({
  activePropertyName: {
    type: String,
    default: "Sem propriedade"
  },
  cloudEnabled: {
    type: Boolean,
    default: false
  },
  cloudMessage: {
    type: String,
    default: ""
  },
  route: {
    type: String,
    default: "dashboard"
  }
});

defineEmits(["cycle-property", "logout", "navigate", "open-weight-sheet"]);
</script>

<template>
  <Topbar
    :property-name="activePropertyName"
    @cycle-property="$emit('cycle-property')"
    @logout="$emit('logout')"
  />

  <main class="app-shell">
    <SyncStatus :enabled="cloudEnabled" :message="cloudMessage" />
    <slot></slot>
  </main>

  <button
    class="fab"
    data-action="open-weight-sheet"
    type="button"
    aria-label="Adicionar pesagem"
    @click="$emit('open-weight-sheet')"
  >
    <slot name="fab">+</slot>
  </button>

  <BottomNav :route="route" @navigate="$emit('navigate', $event)" />

  <slot name="overlays"></slot>
</template>
