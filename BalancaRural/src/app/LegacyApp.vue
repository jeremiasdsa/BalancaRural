<script setup>
import { nextTick, onMounted, ref } from "vue";
import AppChrome from "../components/layout/AppChrome.vue";
import { bindLegacyAuthEvents, bindLegacyShellEvents, mountLegacyApp } from "./legacyApp.js";

const authRoot = ref(null);
const shellRoot = ref(null);
const snapshot = ref({
  isSignedIn: false,
  authContent: ""
});

function applySnapshot(nextSnapshot) {
  snapshot.value = nextSnapshot;
  nextTick(() => {
    if (snapshot.value.isSignedIn) {
      bindLegacyShellEvents(shellRoot.value);
    } else {
      bindLegacyAuthEvents(authRoot.value);
    }
  });
}

onMounted(() => {
  mountLegacyApp(authRoot.value, {
    onShellRender: applySnapshot
  });
});
</script>

<template>
  <div v-if="snapshot.isSignedIn" ref="shellRoot">
    <AppChrome
      :active-property-name="snapshot.activePropertyName"
      :cloud-enabled="snapshot.cloudEnabled"
      :cloud-message="snapshot.cloudMessage"
      :route="snapshot.route"
    >
      <div v-html="snapshot.routeContent"></div>
      <template #fab>
        <span v-html="snapshot.fabContent"></span>
      </template>
      <template #overlays>
        <div v-html="snapshot.overlayContent"></div>
      </template>
    </AppChrome>
  </div>
  <div v-else ref="authRoot" v-html="snapshot.authContent"></div>
</template>
