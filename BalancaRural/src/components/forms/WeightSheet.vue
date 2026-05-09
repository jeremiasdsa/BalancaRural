<script setup>
import { icons } from "../icons/icons.js";
import { AGE_CATEGORIES } from "../../features/weight-records/ageCategories.js";

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

defineEmits(["close", "submit"]);
</script>

<template>
  <div class="sheet-backdrop" @click.self="$emit('close')">
    <form class="sheet" @click.stop @submit="$emit('submit', $event)">
      <h2>{{ record ? "Editar pesagem" : "Adicionar pesagem" }}</h2>
      <p class="sheet-context">Propriedade: <strong>{{ activePropertyName || "Sem propriedade ativa" }}</strong></p>
      <div class="field">
        <label for="animalId">Código do Animal</label>
        <input id="animalId" name="animalId" :value="record?.animalId ?? ''" placeholder="Digite o código do animal" inputmode="numeric" autocomplete="off" />
      </div>
      <div class="field">
        <label for="sex">Sexo</label>
        <select id="sex" name="sex" :value="record?.sex ?? ''">
          <option value="">Não informado</option>
          <option value="M">Macho</option>
          <option value="F">Fêmea</option>
        </select>
      </div>
      <div class="field">
        <label for="ageCategory">Idade</label>
        <select id="ageCategory" name="ageCategory" :value="record?.ageCategory ?? ''">
          <option value="">Não informada</option>
          <option
            v-for="category in AGE_CATEGORIES"
            :key="category.value"
            :value="category.value"
          >
            {{ category.label }} - {{ category.description }}
          </option>
        </select>
      </div>
      <div class="field">
        <label for="weight">Peso</label>
        <input id="weight" name="weight" :value="record?.weight ?? ''" type="number" min="1" step="0.1" inputmode="decimal" placeholder="Peso em kg" />
      </div>
      <div class="field">
        <label for="info">Info</label>
        <textarea id="info" name="info" :value="record?.info ?? ''" placeholder="Observação livre"></textarea>
      </div>
      <div v-if="error" class="field-error">{{ error }}</div>
      <div class="row-actions" style="margin-top: 16px;">
        <button class="btn ghost" type="button" @click="$emit('close')">Cancelar</button>
        <button class="btn green" type="submit" v-html="`${icons.check} Confirmar`"></button>
      </div>
    </form>
  </div>
</template>
