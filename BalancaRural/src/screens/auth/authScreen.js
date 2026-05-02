import { escapeHtml } from "../../utils/html.js";

export function renderAuthScreen(auth) {
  const isLoading = auth.status === "loading";
  const mode = auth.mode;
  const buttonLabels = {
    login: "Entrar",
    signup: "Criar conta",
    reset: "Enviar email"
  };

  return `
    <main class="auth-shell">
      <section class="auth-panel">
        <div class="auth-logo" aria-hidden="true">BR</div>
        ${
          isLoading
            ? `<div class="sync-status"><span></span>Carregando autenticação...</div>`
            : `
              <form data-form="auth" class="auth-form">
                <div class="field">
                  <label for="authEmail">Email</label>
                  <input id="authEmail" name="email" type="email" autocomplete="email" placeholder="seu@email.com" />
                </div>
                ${
                  mode !== "reset"
                    ? `<div class="field">
                        <label for="authPassword">Senha</label>
                        <input id="authPassword" name="password" type="password" autocomplete="${mode === "signup" ? "new-password" : "current-password"}" placeholder="Mínimo 6 caracteres" />
                      </div>`
                    : ""
                }
                ${auth.error ? `<div class="auth-error">${escapeHtml(auth.error)}</div>` : ""}
                ${auth.message ? `<div class="auth-message">${escapeHtml(auth.message)}</div>` : ""}
                <button class="btn green auth-submit" type="submit" ${auth.loading ? "disabled" : ""}>
                  ${auth.loading ? "Aguarde..." : buttonLabels[mode]}
                </button>
              </form>
              <div class="auth-actions">
                ${mode !== "login" ? `<button type="button" data-auth-mode="login">Entrar</button>` : ""}
                ${mode !== "signup" ? `<button type="button" data-auth-mode="signup">Criar conta</button>` : ""}
                ${mode !== "reset" ? `<button type="button" data-auth-mode="reset">Esqueci a senha</button>` : ""}
              </div>
              <p class="auth-note">Login, criação de conta e recuperação de senha precisam de internet. Depois de entrar neste dispositivo, o uso em campo continua offline.</p>
            `
        }
      </section>
    </main>
  `;
}
