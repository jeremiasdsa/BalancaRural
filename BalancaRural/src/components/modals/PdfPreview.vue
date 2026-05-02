<script setup>
import { icons } from "../icons/icons.js";

defineProps({
  pdfPreview: {
    type: Object,
    required: true
  }
});
</script>

<template>
  <div class="preview-backdrop">
    <section class="pdf-preview" role="dialog" aria-modal="true" aria-labelledby="pdf-preview-title">
      <header class="preview-header">
        <div>
          <h2 id="pdf-preview-title">{{ pdfPreview.report.title }}</h2>
          <p>{{ pdfPreview.report.subtitle || "Relatório" }}</p>
        </div>
        <button class="btn ghost small" type="button" data-action="close-pdf-preview">Fechar</button>
      </header>

      <div class="preview-actions">
        <button class="btn green" type="button" data-action="download-pdf-preview" v-html="`${icons.check} Baixar PDF`"></button>
      </div>

      <div class="preview-page">
        <h3>{{ pdfPreview.report.title }}</h3>
        <p>{{ pdfPreview.report.subtitle || "" }}</p>
        <div class="preview-summary">
          <div
            v-for="[label, value] in pdfPreview.report.summaryItems"
            :key="label"
          >
            <span>{{ label }}</span>
            <strong>{{ value }}</strong>
          </div>
        </div>
        <div class="preview-table-wrap">
          <table class="preview-table">
            <thead>
              <tr>
                <th
                  v-for="column in pdfPreview.report.columns"
                  :key="column.label"
                >
                  {{ column.label }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, rowIndex) in pdfPreview.report.rows"
                :key="rowIndex"
              >
                <td
                  v-for="(cell, cellIndex) in row"
                  :key="cellIndex"
                >
                  {{ cell }}
                </td>
              </tr>
              <tr v-if="!pdfPreview.report.rows.length">
                <td :colspan="pdfPreview.report.columns.length">Nenhum registro encontrado.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  </div>
</template>
