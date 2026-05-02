<script setup>
import { icons } from "../icons/icons.js";

defineProps({
  activePropertyName: {
    type: String,
    default: "Sem propriedade ativa"
  },
  error: {
    type: String,
    default: ""
  },
  record: {
    type: Object,
    default: null
  }
});
</script>

<template>
  <div class="sheet-backdrop" data-action="close-sheet">
    <form class="sheet" data-form="weight">
      <h2>{{ record ? "Editar pesagem" : "Adicionar pesagem" }}</h2>
      <p class="sheet-context">Propriedade: <strong>{{ activePropertyName || "Sem propriedade ativa" }}</strong></p>
      <div class="field">
        <label for="animalId">Código do Animal</label>
        <input id="animalId" name="animalId" :value="record?.animalId ?? ''" placeholder="Digite o código do animal" inputmode="numeric" autocomplete="off" />
      </div>
      <div class="field">
        <label for="weight">Peso</label>
        <input id="weight" name="weight" :value="record?.weight ?? ''" type="number" min="1" step="0.1" inputmode="decimal" placeholder="Peso em kg" />
      </div>
      <div v-if="error" class="field-error">{{ error }}</div>
      <div class="row-actions" style="margin-top: 16px;">
        <button class="btn ghost" type="button" data-action="close-sheet">Cancelar</button>
        <button class="btn green" type="submit" v-html="`${icons.check} Confirmar`"></button>
      </div>
    </form>
  </div>
</template>
