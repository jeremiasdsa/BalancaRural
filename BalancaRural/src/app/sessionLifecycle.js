import { observeAuthState, resolveOnlineAuthUser } from "../firebase/auth.js";
import { runCloudSyncWithStatus } from "./cloudSync.js";

const AUTH_RESTORE_ATTEMPTS = 5;
const AUTH_RESTORE_RETRY_DELAY_MS = 4000;

let onlineSyncInFlight = null;

export async function initializeSessionLifecycle({
  clearVisibleData,
  getOwnerId,
  refreshAll,
  render,
  state
}) {
  const handleAuthChange = createAuthChangeHandler({
    clearVisibleData,
    getOwnerId,
    refreshAll,
    render,
    state
  });

  const handleOnlineRequest = () => {
    if (onlineSyncInFlight || state.auth.status !== "signed-in") return;

    onlineSyncInFlight = handleOnline({
      getOwnerId,
      handleAuthChange,
      refreshAll,
      render,
      state
    }).finally(() => {
      onlineSyncInFlight = null;
    });
  };

  window.addEventListener("online", handleOnlineRequest);
  window.addEventListener("focus", () => {
    if (shouldRetryOnlineSync(state)) handleOnlineRequest();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && shouldRetryOnlineSync(state)) handleOnlineRequest();
  });
  window.addEventListener("offline", () => handleOffline({ render, state }));

  try {
    await observeAuthState(handleAuthChange);
  } catch (error) {
    console.warn("Falha ao inicializar autenticação.", error);
    await handleAuthChange(null);
  }
}

function createAuthChangeHandler({ clearVisibleData, getOwnerId, refreshAll, render, state }) {
  return async (user) => {
    const previousUserId = state.auth.user?.uid ?? null;

    if (!user) {
      state.auth = {
        ...state.auth,
        status: "signed-out",
        user: null,
        loading: false
      };
      state.cloud = {
        enabled: false,
        message: "Aguardando login."
      };
      await clearVisibleData();
      render();
      return;
    }

    if (previousUserId && previousUserId !== user.uid) {
      await clearVisibleData();
    }

    state.auth = {
      ...state.auth,
      status: "signed-in",
      user,
      error: "",
      message: "",
      loading: false
    };
    state.cloud = {
      enabled: false,
      message: navigator.onLine ? "Sincronizando Firebase..." : "Offline: usando dados locais."
    };
    await refreshAll();
    if (navigator.onLine) {
      state.cloud = await runCloudSyncWithStatus(getOwnerId());
      await refreshAll();
    }
  };
}

async function handleOnline({ getOwnerId, handleAuthChange, refreshAll, render, state }) {
  if (state.auth.status !== "signed-in") return;
  state.cloud = {
    enabled: false,
    message: state.auth.user?.isOfflineSession ? "Restaurando sessão Firebase..." : "Sincronizando Firebase..."
  };
  render();

  if (state.auth.user?.isOfflineSession) {
    const onlineUser = await restoreOnlineAuthUser({ render, state });
    if (!onlineUser) {
      state.cloud = {
        enabled: false,
        message: "Firebase ainda indisponível. Seus dados locais serão sincronizados quando a sessão voltar."
      };
      render();
      return;
    }
    await handleAuthChange(onlineUser);
    return;
  }

  state.cloud = await runCloudSyncWithStatus(getOwnerId());
  await refreshAll();
}

async function restoreOnlineAuthUser({ render, state }) {
  for (let attempt = 1; attempt <= AUTH_RESTORE_ATTEMPTS; attempt += 1) {
    const onlineUser = await resolveOnlineAuthUser();
    if (onlineUser) return onlineUser;

    if (!navigator.onLine) return null;
    if (attempt === AUTH_RESTORE_ATTEMPTS) break;

    state.cloud = {
      enabled: false,
      message: `Restaurando sessão Firebase... tentativa ${attempt + 1}/${AUTH_RESTORE_ATTEMPTS}`
    };
    render();
    await delay(AUTH_RESTORE_RETRY_DELAY_MS);
  }

  return null;
}

function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function shouldRetryOnlineSync(state) {
  return navigator.onLine && state.auth.status === "signed-in" && (!state.cloud.enabled || state.auth.user?.isOfflineSession);
}

function handleOffline({ render, state }) {
  if (state.auth.status !== "signed-in") return;
  state.cloud = {
    enabled: false,
    message: "Offline: alterações serão sincronizadas depois."
  };
  render();
}
