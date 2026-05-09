<script setup>
import { computed } from "vue";
import { useTheme } from "../../app/theme.js";
import { icons } from "../icons/icons.js";

defineProps({
  cloudConnected: {
    type: Boolean,
    default: false
  },
  propertyName: {
    type: String,
    default: "Sem propriedade"
  }
});

defineEmits(["cycle-property", "logout", "sync-cloud"]);

const { isDark, nextThemeLabel, toggleTheme } = useTheme();
const themeIcon = computed(() => (isDark.value ? icons.sun : icons.moon));
</script>

<template>
  <header class="topbar">
    <div class="logo" aria-hidden="true">BR</div>
    <button class="property-switcher" type="button" @click="$emit('cycle-property')">
      <span class="property-title">{{ propertyName || "Sem propriedade" }}</span>
      <span aria-hidden="true">⌄</span>
    </button>
    <button
      class="topbar-icon"
      type="button"
      :aria-label="nextThemeLabel"
      :title="nextThemeLabel"
      @click="toggleTheme"
      v-html="themeIcon"
    ></button>
    <button
      v-if="cloudConnected"
      class="topbar-menu"
      type="button"
      @click="$emit('logout')"
      v-html="`${icons.logout} Sair`"
    ></button>
    <button
      v-else
      class="topbar-menu"
      type="button"
      @click="$emit('sync-cloud')"
      v-html="`${icons.cloud} Nuvem`"
    ></button>
  </header>
</template>
