import {
  ensureValidActiveProperty,
  getActivePropertyId,
  listProperties,
  setActivePropertyId
} from "../data/repositories/propertiesRepository.js";
import { bindAppEvents, bindAuthEvents } from "./eventBindings.js";
import {
  listAllWeightRecords,
  listWeightRecords
} from "../data/repositories/weightRecordsRepository.js";
import {
  initCloudSync,
  syncActiveProperty,
  syncProperty,
  syncWeightRecord
} from "../firebase/firestoreSync.js";
import {
  createDetailedPdfPreview,
  createSummaryPdfPreview,
  downloadPdfPreview,
  getSummaryScopedRecords
} from "../features/reports/reportExports.js";
import { observeAuthState, resolveOnlineAuthUser } from "../firebase/auth.js";
import { submitAuthForm } from "../features/auth/authForm.js";
import { savePropertyForm } from "../features/properties/propertyForm.js";
import { saveWeightRecordForm } from "../features/weight-records/weightRecordForm.js";
import { handleLegacyAction } from "./actionHandlers.js";
import { renderRoute } from "./renderRoutes.js";
import { createInitialState } from "./state.js";
import { clearVisibleData as clearVisibleStoresAndState } from "./visibleData.js";
import { renderPropertySheet } from "../components/forms/propertySheet.js";
import { renderWeightSheet } from "../components/forms/weightSheet.js";
import { renderAppChrome } from "../components/layout/appChrome.js";
import { renderPdfPreview } from "../components/modals/pdfPreview.js";
import { registerPwa } from "../pwa/registerPwa.js";
import { renderAuthScreen } from "../screens/auth/authScreen.js";
import { escapeHtml } from "../utils/html.js";
import { filterWeightRecords } from "../features/weight-records/recordFilters.js";

let app = null;
let initialized = false;
const state = createInitialState();

export function mountLegacyApp(rootElement) {
  app = rootElement;
  if (initialized) {
    render();
    return;
  }

  initialized = true;
  init();
}

async function init() {
  render();
  registerPwa();
  exposeDebugTools();
  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
  try {
    await observeAuthState(handleAuthChange);
  } catch (error) {
    console.warn("Falha ao inicializar autenticação.", error);
    await handleAuthChange(null);
  }
}

async function handleOnline() {
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

  state.cloud = await runCloudSyncWithStatus();
  await refreshAll();
}

function handleOffline() {
  if (state.auth.status !== "signed-in") return;
  state.cloud = {
    enabled: false,
    message: "Offline: alterações serão sincronizadas depois."
  };
  render();
}

async function handleAuthChange(user) {
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
    state.cloud = await runCloudSyncWithStatus();
    await refreshAll();
  }
}

async function runCloudSyncWithStatus() {
  return Promise.race([
    initCloudSync(getOwnerId()),
    new Promise((resolve) => {
      window.setTimeout(() => resolve({
        enabled: false,
        message: "Firebase demorou para responder. Dados locais preservados."
      }), 15000);
    })
  ]);
}

async function refreshAll() {
  const ownerId = getOwnerId();
  await ensureValidActiveProperty(ownerId);
  state.properties = await listProperties(ownerId);
  state.activePropertyId = await getActivePropertyId(ownerId);
  if (!state.activePropertyId && state.properties[0]) {
    state.activePropertyId = state.properties[0].id;
    await setActivePropertyId(state.activePropertyId, ownerId);
  }
  await refreshRecords();
  render();
}

async function refreshRecords() {
  const ownerId = getOwnerId();
  state.records = state.activePropertyId ? await listWeightRecords(state.activePropertyId, ownerId) : [];
}

function render() {
  if (state.auth.status !== "signed-in") {
    app.innerHTML = renderAuthScreen(state.auth);
    bindAuthEvents(app, {
      onAuthModeChange: handleAuthModeChange,
      onAuthSubmit: handleAuthSubmit
    });
    return;
  }

  const activeProperty = getActiveProperty();
  app.innerHTML = renderAppChrome({
    activeProperty,
    cloud: state.cloud,
    pdfPreviewContent: state.pdfPreview ? renderPdfPreview(state.pdfPreview) : "",
    route: state.route,
    routeContent: renderRoute({
      activeProperty,
      filteredRecords: getFilteredRecords(),
      state
    }),
    sheetContent: state.sheet ? renderSheet() : "",
    toast: state.toast
  });

  bindAppEvents(app, {
    onAction: handleAction,
    onFilterChange: handleFilterChange,
    onPropertySubmit: handlePropertySubmit,
    onRouteChange: handleRouteChange,
    onSummaryAnimalChange: handleSummaryAnimalChange,
    onWeightSubmit: handleWeightSubmit
  });
}

function renderSheet() {
  if (state.sheet.type === "weight") {
    return renderWeightSheet({
      activeProperty: getActiveProperty(),
      error: state.sheet.error,
      record: state.sheet.record
    });
  }
  if (state.sheet.type === "property") {
    return renderPropertySheet({
      error: state.sheet.error,
      property: state.sheet.property
    });
  }
  return "";
}

function handleAuthModeChange(authMode) {
  state.auth.mode = authMode;
  state.auth.error = "";
  state.auth.message = "";
  render();
}

async function handleAuthSubmit(event) {
  event.preventDefault();

  state.auth.loading = true;
  state.auth.error = "";
  state.auth.message = "";
  render();

  const result = await submitAuthForm({
    formData: new FormData(event.currentTarget),
    mode: state.auth.mode
  });

  state.auth.loading = false;
  state.auth.error = result.ok ? "" : result.error;
  state.auth.message = result.message ?? "";
  render();
}

function handleRouteChange(route) {
  state.route = route;
  render();
}

function handleFilterChange(filter, value) {
  state.filters[filter] = value;
  render();
}

function handleSummaryAnimalChange(value) {
  state.summaryAnimal = value;
  render();
}

async function handleAction(event) {
  await handleLegacyAction(event, {
    clearVisibleData,
    cycleProperty,
    downloadCurrentPdfPreview,
    getFilteredRecords,
    getOwnerId,
    openDetailedPdfPreview,
    openSummaryPdfPreview,
    refreshAll,
    refreshRecords,
    render,
    runCloudSync,
    state,
    toast
  });
}

async function handleWeightSubmit(event) {
  event.preventDefault();

  const result = await saveWeightRecordForm({
    existingRecord: state.sheet.record,
    formData: new FormData(event.currentTarget),
    ownerId: getOwnerId(),
    syncRecord: (record) => runCloudSync((ownerId) => syncWeightRecord(ownerId, record))
  });

  if (!result.ok) {
    state.sheet.error = result.error;
    render();
    return;
  }

  if (result.activePropertyId) {
    state.activePropertyId = result.activePropertyId;
  }

  toast(result.message);
  state.sheet = null;
  await refreshRecords();
  render();
}

async function handlePropertySubmit(event) {
  event.preventDefault();

  const result = await savePropertyForm({
    existingProperty: state.sheet.property,
    formData: new FormData(event.currentTarget),
    ownerId: getOwnerId(),
    syncNewProperty: (property) =>
      runCloudSync(async (ownerId) => {
        await syncProperty(ownerId, property);
        await syncActiveProperty(ownerId, property.id);
      }),
    syncPropertyChange: (property) => runCloudSync((ownerId) => syncProperty(ownerId, property))
  });

  if (!result.ok) {
    state.sheet.error = result.error;
    render();
    return;
  }

  if (result.activePropertyId) {
    state.activePropertyId = result.activePropertyId;
  }
  if (result.route) {
    state.route = result.route;
  }

  toast(result.message);
  state.sheet = null;
  await refreshAll();
}

function exposeDebugTools() {
  globalThis.balancaRuralDebug = async () => {
    const ownerId = getOwnerId();
    const [properties, activePropertyId, records] = await Promise.all([
      listProperties(ownerId),
      getActivePropertyId(ownerId),
      listAllWeightRecords(ownerId)
    ]);

    return {
      ownerId,
      activePropertyId,
      properties,
      records,
      recordsByProperty: records.reduce((groups, record) => {
        groups[record.propertyId] = groups[record.propertyId] || [];
        groups[record.propertyId].push(record);
        return groups;
      }, {})
    };
  };
}

async function cycleProperty() {
  if (!state.properties.length) return;

  const currentIndex = state.properties.findIndex((property) => property.id === state.activePropertyId);
  const next = state.properties[(currentIndex + 1) % state.properties.length];
  await setActivePropertyId(next.id, getOwnerId());
  await runCloudSync((ownerId) => syncActiveProperty(ownerId, next.id));
  toast(`Propriedade ativa: ${next.name}`);
  await refreshAll();
}

async function runCloudSync(operation) {
  const ownerId = getOwnerId();
  if (!ownerId || !state.cloud.enabled) return false;

  try {
    await operation(ownerId);
    return true;
  } catch (error) {
    console.warn("Falha ao sincronizar com Firebase", error);
    state.cloud = {
      enabled: false,
      message: "Firebase indisponível."
    };
    return false;
  }
}

async function clearVisibleData() {
  await clearVisibleStoresAndState(state);
}

function getOwnerId() {
  return state.auth.user?.uid ?? null;
}

function getActiveProperty() {
  return state.properties.find((property) => property.id === state.activePropertyId) ?? null;
}

function getFilteredRecords() {
  return filterWeightRecords(state.records, state.filters);
}

function openDetailedPdfPreview() {
  state.pdfPreview = createDetailedPdfPreview({
    activeProperty: getActiveProperty(),
    records: getFilteredRecords()
  });
  render();
}

function openSummaryPdfPreview() {
  state.pdfPreview = createSummaryPdfPreview({
    activeProperty: getActiveProperty(),
    records: getSummaryScopedRecords(getFilteredRecords(), state.summaryAnimal)
  });
  render();
}

function downloadCurrentPdfPreview() {
  downloadPdfPreview(state.pdfPreview);
}

function toast(message) {
  state.toast = message;
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => {
    state.toast = "";
    render();
  }, 1800);
}
