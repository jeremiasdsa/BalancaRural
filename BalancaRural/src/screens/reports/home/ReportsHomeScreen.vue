<script setup>
import { icons } from "../../../components/icons/icons.js";

defineEmits(["navigate"]);
</script>

<template>
  <section class="screen">
    <h1 class="screen-title">Relatórios</h1>
    <p class="screen-subtitle">Consulte, filtre e exporte as pesagens da propriedade ativa.</p>
    <div class="report-buttons">
      <button class="report-link blue" type="button" @click="$emit('navigate', 'reports-detailed')" v-html="`Detalhado ${icons.arrow}`"></button>
      <button class="report-link green" type="button" @click="$emit('navigate', 'reports-summary')" v-html="`Resumido ${icons.arrow}`"></button>
    </div>
  </section>
</template>
