import { computed, ref } from "vue";

const THEME_STORAGE_KEY = "balanca-rural-theme";
const DEFAULT_THEME = "light";
const theme = ref(DEFAULT_THEME);

function getStoredTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeTheme(nextTheme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  } catch {
    // Storage can be blocked in private contexts; the in-memory theme still works.
  }
}

function applyTheme(nextTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = nextTheme;
}

export function initTheme() {
  const storedTheme = getStoredTheme();
  theme.value = storedTheme === "dark" || storedTheme === "light" ? storedTheme : DEFAULT_THEME;
  applyTheme(theme.value);
}

export function useTheme() {
  const isDark = computed(() => theme.value === "dark");
  const nextThemeLabel = computed(() => (isDark.value ? "Usar tema claro" : "Usar tema escuro"));

  function toggleTheme() {
    theme.value = isDark.value ? "light" : "dark";
    applyTheme(theme.value);
    storeTheme(theme.value);
  }

  return {
    isDark,
    nextThemeLabel,
    theme,
    toggleTheme
  };
}
