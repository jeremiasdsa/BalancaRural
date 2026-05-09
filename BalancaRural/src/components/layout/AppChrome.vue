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
  cloudConnected: {
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

defineEmits(["cycle-property", "logout", "navigate", "open-weight-sheet", "sync-cloud"]);
</script>

<template>
  <Topbar
    :cloud-connected="cloudConnected"
    :property-name="activePropertyName"
    @cycle-property="$emit('cycle-property')"
    @logout="$emit('logout')"
    @sync-cloud="$emit('sync-cloud')"
  />

  <main class="app-shell">
    <SyncStatus :enabled="cloudEnabled" :message="cloudMessage" />
    <slot></slot>
  </main>

  <button
    class="fab"
    type="button"
    aria-label="Adicionar pesagem"
    @click="$emit('open-weight-sheet')"
  >
    <slot name="fab">+</slot>
  </button>

  <BottomNav :route="route" @navigate="$emit('navigate', $event)" />

  <slot name="overlays"></slot>
</template>
