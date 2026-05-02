<script setup>
import { onMounted, ref } from "vue";
import { mountLegacyApp } from "./legacyApp.js";

const legacyRoot = ref(null);

onMounted(() => {
  mountLegacyApp(legacyRoot.value);
});
</script>

<template>
  <div ref="legacyRoot"></div>
</template>
