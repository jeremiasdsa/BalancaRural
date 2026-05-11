<script setup>
import { onBeforeUnmount, ref, watch } from "vue";
import { icons } from "../icons/icons.js";
import { AGE_CATEGORIES } from "../../features/weight-records/ageCategories.js";
import { DISCARD_OPTIONS, EARRING_OPTIONS, VACCINE_OPTIONS } from "../../features/weight-records/managementInfo.js";

const props = defineProps({
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

const emit = defineEmits(["clear-error", "close", "submit"]);
const showError = ref(false);
let errorTimer = null;

function clearErrorTimer() {
  if (!errorTimer) return;
  window.clearTimeout(errorTimer);
  errorTimer = null;
}

function clearVisibleError() {
  clearErrorTimer();
  showError.value = false;
  if (props.error) emit("clear-error");
}

watch(
  () => props.error,
  (error) => {
    clearErrorTimer();
    showError.value = Boolean(error);
    if (!error) return;
    errorTimer = window.setTimeout(clearVisibleError, 4000);
  },
  { immediate: true }
);

onBeforeUnmount(clearErrorTimer);

function hasVaccine(value) {
  return Array.isArray(props.record?.vaccines) && props.record.vaccines.includes(value);
}
</script>

<template>
  <div class="weight-screen-backdrop" @click.self="$emit('close')">
    <form class="weight-screen" @click.stop @submit="$emit('submit', $event)">
      <div v-if="showError" class="weight-error-alert" role="alert">{{ error }}</div>

      <header class="weight-screen-header">
        <div>
          <h2>{{ record ? "Editar pesagem" : "Adicionar pesagem" }}</h2>
          <p>Propriedade: <strong>{{ activePropertyName || "Sem propriedade ativa" }}</strong></p>
        </div>
        <button class="btn ghost small" type="button" @click="$emit('close')">Cancelar</button>
      </header>

      <div class="weight-screen-body">
        <section class="weight-form-section">
          <h3>Animal</h3>
          <div class="field" :class="{ 'field-invalid': showError }">
            <label for="animalId">Código do Animal</label>
            <input id="animalId" name="animalId" :value="record?.animalId ?? ''" placeholder="Digite o código do animal" inputmode="numeric" autocomplete="off" @focus="clearVisibleError" @input="clearVisibleError" />
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
          <div class="field" :class="{ 'field-invalid': showError }">
            <label for="weight">Peso</label>
            <input id="weight" name="weight" :value="record?.weight ?? ''" type="number" min="1" step="0.1" inputmode="decimal" placeholder="Peso em kg" @focus="clearVisibleError" @input="clearVisibleError" />
          </div>
        </section>

        <section class="weight-form-section">
          <h3>Manejo</h3>
          <fieldset class="field segmented-field">
            <legend>Descarte</legend>
            <div class="segmented-control">
              <label
                v-for="option in DISCARD_OPTIONS"
                :key="option.value"
                class="segment-option"
              >
                <input type="radio" name="discard" :value="option.value" :checked="record?.discard === option.value" />
                <span>{{ option.label }}</span>
              </label>
            </div>
          </fieldset>
          <fieldset class="field segmented-field">
            <legend>Brinco</legend>
            <div class="segmented-control two">
              <label
                v-for="option in EARRING_OPTIONS"
                :key="option.value"
                class="segment-option"
              >
                <input type="radio" name="earring" :value="option.value" :checked="record?.earring === option.value" />
                <span>{{ option.label }}</span>
              </label>
            </div>
          </fieldset>
          <div class="field">
            <label for="iron">Ferro</label>
            <input id="iron" name="iron" :value="record?.iron ?? ''" placeholder="Siglas e letras" autocomplete="off" />
          </div>
        </section>

        <section class="weight-form-section">
          <h3>Sanidade</h3>
          <fieldset class="field fieldset">
            <legend>Vacinas</legend>
            <label
              v-for="option in VACCINE_OPTIONS"
              :key="option.value"
              class="check-option"
            >
              <input type="checkbox" name="vaccines" :value="option.value" :checked="hasVaccine(option.value)" />
              <span>{{ option.label }}</span>
            </label>
            <textarea id="vaccineNotes" name="vaccineNotes" :value="record?.vaccineNotes ?? ''" placeholder="Outra vacina ou observação"></textarea>
          </fieldset>
        </section>

        <section class="weight-form-section">
          <h3>Observações</h3>
          <div class="field">
            <label for="info">Info</label>
            <textarea id="info" name="info" :value="record?.info ?? ''" placeholder="Observação livre"></textarea>
          </div>
        </section>
      </div>

      <footer class="weight-screen-actions">
        <button class="btn ghost" type="button" @click="$emit('close')">Cancelar</button>
        <button class="btn green" type="submit" v-html="`${icons.check} Confirmar`"></button>
      </footer>
    </form>
  </div>
</template>
