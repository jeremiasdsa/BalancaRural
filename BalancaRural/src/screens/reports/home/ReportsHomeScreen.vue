<script setup>
import { icons } from "../../../components/icons/icons.js";
</script>

<template>
  <section class="screen">
    <h1 class="screen-title">Relatórios</h1>
    <p class="screen-subtitle">Consulte, filtre e exporte as pesagens da propriedade ativa.</p>
    <div class="report-buttons">
      <button class="report-link blue" type="button" data-route="reports-detailed" v-html="`Detalhado ${icons.arrow}`"></button>
      <button class="report-link green" type="button" data-route="reports-summary" v-html="`Resumido ${icons.arrow}`"></button>
    </div>
  </section>
</template>
