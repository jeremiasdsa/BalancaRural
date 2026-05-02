import { observeAuthState, resolveOnlineAuthUser } from "../firebase/auth.js";
import { runCloudSyncWithStatus } from "./cloudSync.js";

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

  window.addEventListener("online", () =>
    handleOnline({
      getOwnerId,
      handleAuthChange,
      refreshAll,
      render,
      state
    })
  );
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
    const onlineUser = await resolveOnlineAuthUser();
    if (!onlineUser) {
      state.cloud = {
        enabled: false,
        message: "Sessão Firebase indisponível. Tente abrir o app com internet."
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

function handleOffline({ render, state }) {
  if (state.auth.status !== "signed-in") return;
  state.cloud = {
    enabled: false,
    message: "Offline: alterações serão sincronizadas depois."
  };
  render();
}
