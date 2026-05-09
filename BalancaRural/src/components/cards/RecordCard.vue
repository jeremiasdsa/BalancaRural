<script setup>
import { ref } from "vue";
import { icons } from "../icons/icons.js";
import { formatDateTime, formatNumber } from "../../utils/format.js";
import { formatAgeCategory } from "../../features/weight-records/ageCategories.js";
import { formatSex, normalizeSex } from "../../features/weight-records/weightStats.js";

const props = defineProps({
  record: {
    type: Object,
    required: true
  },
  initialExpanded: {
    type: Boolean,
    default: true
  },
  variant: {
    type: String,
    default: "default"
  }
});

defineEmits(["delete-record", "edit-record"]);

const expanded = ref(props.initialExpanded);

function toggleExpanded() {
  if (props.variant !== "dashboard") return;
  expanded.value = !expanded.value;
}
</script>

<template>
  <article class="card record-card" :class="[`record-card-${variant}`, { collapsed: variant === 'dashboard' && !expanded }]">
    <div v-if="variant === 'dashboard'" class="record-dashboard-top">
      <div class="record-highlight">
        <span>Identificador</span>
        <strong>{{ record.animalId }}</strong>
      </div>

      <div class="record-dashboard-weight">
        <span>Peso</span>
        <strong>{{ formatNumber(record.weight) }} kg</strong>
      </div>

      <div class="record-dashboard-sex" :class="normalizeSex(record.sex) === 'F' ? 'female' : normalizeSex(record.sex) === 'M' ? 'male' : ''">
        <span class="sex-symbol">{{ normalizeSex(record.sex) === "F" ? "♀" : normalizeSex(record.sex) === "M" ? "♂" : "-" }}</span>
        <strong>{{ formatSex(record.sex) || "Sexo não informado" }}</strong>
      </div>

      <button
        class="record-toggle"
        type="button"
        :aria-expanded="expanded"
        aria-label="Expandir registro"
        @click="toggleExpanded"
        v-html="expanded ? icons.chevronUp : icons.chevronDown"
      ></button>
    </div>

    <div v-else class="record-card-top">
      <div class="record-highlight">
        <span>Identificador</span>
        <strong>{{ record.animalId }}</strong>
      </div>
      <div class="record-meta">
        <span>{{ formatDateTime(record.timestamp) }}</span>
        <span>{{ formatSex(record.sex) || "Sexo não informado" }}</span>
        <span>{{ formatAgeCategory(record.ageCategory) || "Idade não informada" }}</span>
      </div>
      <div class="record-highlight weight">
        <span>Peso</span>
        <strong>{{ formatNumber(record.weight) }} kg</strong>
      </div>
    </div>

    <template v-if="variant !== 'dashboard' || expanded">
      <div v-if="variant === 'dashboard'" class="record-dashboard-details">
        <div class="record-detail-line">
          <span v-html="icons.calendar"></span>
          <strong>{{ formatDateTime(record.timestamp) }}</strong>
        </div>
        <div class="record-detail-line">
          <span v-html="icons.target"></span>
          <strong>{{ formatAgeCategory(record.ageCategory) || "Idade não informada" }}</strong>
        </div>
        <div class="record-detail-line note-line">
          <span v-html="icons.file"></span>
          <div>
            <strong>Observação</strong>
            <p>{{ record.info || "Sem observação informada." }}</p>
          </div>
        </div>
      </div>

      <div v-else-if="record.info" class="record-note">
        <strong>Observação</strong>
        <p>{{ record.info }}</p>
      </div>

      <div class="record-actions">
        <button class="btn red small" type="button" @click="$emit('delete-record', record.id)" v-html="`${icons.trash} Excluir`"></button>
        <button class="btn yellow small" type="button" @click="$emit('edit-record', record.id)" v-html="`${icons.pencil} Editar`"></button>
      </div>
    </template>
  </article>
</template>
