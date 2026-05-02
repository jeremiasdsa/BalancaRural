<script setup>
import { icons } from "../icons/icons.js";

defineProps({
  error: {
    type: String,
    default: ""
  },
  property: {
    type: Object,
    default: null
  }
});
</script>

<template>
  <div class="sheet-backdrop" data-action="close-sheet">
    <form class="sheet" data-form="property">
      <h2>{{ property ? "Editar propriedade" : "Nova propriedade" }}</h2>
      <div class="field">
        <label for="propertyName">Nome da propriedade</label>
        <input id="propertyName" name="name" :value="property?.name ?? ''" placeholder="Ex.: Fazenda Santa Clara" autocomplete="off" />
      </div>
      <div v-if="error" class="field-error">{{ error }}</div>
      <div class="row-actions" style="margin-top: 16px;">
        <button class="btn ghost" type="button" data-action="close-sheet">Cancelar</button>
        <button class="btn green" type="submit" v-html="`${icons.check} Confirmar`"></button>
      </div>
    </form>
  </div>
</template>
