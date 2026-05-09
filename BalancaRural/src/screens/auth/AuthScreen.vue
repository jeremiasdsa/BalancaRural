<script setup>
import { computed } from "vue";
import { useTheme } from "../../app/theme.js";
import { icons } from "../../components/icons/icons.js";

defineProps({
  auth: {
    type: Object,
    required: true
  },
  variant: {
    type: String,
    default: "screen"
  }
});

const emit = defineEmits(["submit", "mode-change", "close"]);
const { isDark, nextThemeLabel, toggleTheme } = useTheme();
const themeIcon = computed(() => (isDark.value ? icons.sun : icons.moon));

const buttonLabels = {
  login: "Entrar",
  signup: "Criar conta",
  reset: "Enviar email"
};
</script>

<template>
  <main class="auth-shell" :class="{ 'auth-shell-modal': variant === 'modal' }">
    <section class="auth-panel">
      <button v-if="variant === 'modal'" class="auth-close" type="button" aria-label="Fechar" @click="emit('close')">x</button>
      <button
        class="theme-toggle auth-theme-toggle"
        type="button"
        :aria-label="nextThemeLabel"
        :title="nextThemeLabel"
        @click="toggleTheme"
      >
        <span v-html="themeIcon"></span>
        <span>{{ isDark ? "Claro" : "Escuro" }}</span>
      </button>
      <div class="auth-logo" aria-hidden="true">BR</div>
      <div v-if="auth.status === 'loading'" class="sync-status">
        <span></span>
        Carregando autenticação...
      </div>
      <template v-else>
        <form class="auth-form" @submit="emit('submit', $event)">
          <div class="field">
            <label for="authEmail">Email</label>
            <input id="authEmail" name="email" type="email" autocomplete="email" placeholder="seu@email.com" />
          </div>
          <div v-if="auth.mode !== 'reset'" class="field">
            <label for="authPassword">Senha</label>
            <input
              id="authPassword"
              name="password"
              type="password"
              :autocomplete="auth.mode === 'signup' ? 'new-password' : 'current-password'"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div v-if="auth.error" class="auth-error">{{ auth.error }}</div>
          <div v-if="auth.message" class="auth-message">{{ auth.message }}</div>
          <button class="btn green auth-submit" type="submit" :disabled="auth.loading">
            {{ auth.loading ? "Aguarde..." : buttonLabels[auth.mode] }}
          </button>
        </form>
        <div class="auth-actions">
          <button v-if="auth.mode !== 'login'" type="button" @click="emit('mode-change', 'login')">Entrar</button>
          <button v-if="auth.mode !== 'signup'" type="button" @click="emit('mode-change', 'signup')">Criar conta</button>
          <button v-if="auth.mode !== 'reset'" type="button" @click="emit('mode-change', 'reset')">Esqueci a senha</button>
        </div>
        <p class="auth-note">Login, criação de conta e recuperação de senha precisam de internet. Depois de conectar, seus dados locais serão mesclados com a nuvem.</p>
        <p class="auth-note"> V.0.9</p>
      </template>
    </section>
  </main>
</template>
