import { bindAppEvents, bindAuthEvents } from "./eventBindings.js";
import { setActivePropertyId } from "../data/repositories/propertiesRepository.js";
import {
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
import { submitAuthForm } from "../features/auth/authForm.js";
import { savePropertyForm } from "../features/properties/propertyForm.js";
import { saveWeightRecordForm } from "../features/weight-records/weightRecordForm.js";
import { aggregateByAnimal, calculateSummary } from "../features/weight-records/weightStats.js";
import { handleLegacyAction } from "./actionHandlers.js";
import { runCloudSyncOperation } from "./cloudSync.js";
import { loadAppData, loadWeightRecords } from "./dataLoaders.js";
import { exposeDebugTools } from "./debugTools.js";
import { renderRoute } from "./renderRoutes.js";
import { initializeSessionLifecycle } from "./sessionLifecycle.js";
import { createInitialState } from "./state.js";
import { clearVisibleData as clearVisibleStoresAndState } from "./visibleData.js";
import { icons } from "../components/icons/icons.js";
import { renderPropertySheet } from "../components/forms/propertySheet.js";
import { renderWeightSheet } from "../components/forms/weightSheet.js";
import { renderAppChrome } from "../components/layout/appChrome.js";
import { renderPdfPreview } from "../components/modals/pdfPreview.js";
import { registerPwa } from "../pwa/registerPwa.js";
import { renderAuthScreen } from "../screens/auth/authScreen.js";
import { filterWeightRecords } from "../features/weight-records/recordFilters.js";

let app = null;
let initialized = false;
let shellRender = null;
const state = createInitialState();

export function mountLegacyApp(rootElement, options = {}) {
  app = rootElement;
  shellRender = options.onShellRender ?? null;
  if (initialized) {
    render();
    return;
  }

  initialized = true;
  init();
}

export function bindLegacyAuthEvents(rootElement) {
  bindAuthEvents(rootElement, {
    onAuthModeChange: handleAuthModeChange,
    onAuthSubmit: handleAuthSubmit
  });
}

export function bindLegacyShellEvents(rootElement) {
  bindAppEvents(rootElement, {
    onAction: handleAction,
    onFilterChange: handleFilterChange,
    onPropertySubmit: handlePropertySubmit,
    onRouteChange: handleRouteChange,
    onSummaryAnimalChange: handleSummaryAnimalChange,
    onWeightSubmit: handleWeightSubmit
  });
}

async function init() {
  render();
  registerPwa();
  exposeDebugTools(getOwnerId);
  await initializeSessionLifecycle({
    clearVisibleData,
    getOwnerId,
    refreshAll,
    render,
    state
  });
}

async function refreshAll() {
  const ownerId = getOwnerId();
  const data = await loadAppData(ownerId);
  state.properties = data.properties;
  state.activePropertyId = data.activePropertyId;
  state.records = data.records;
  render();
}

async function refreshRecords() {
  const ownerId = getOwnerId();
  state.records = await loadWeightRecords(state.activePropertyId, ownerId);
}

function render() {
  if (state.auth.status !== "signed-in") {
    if (shellRender) {
      shellRender({
        isSignedIn: false,
        auth: { ...state.auth }
      });
      return;
    }

    app.innerHTML = renderAuthScreen(state.auth);
    bindLegacyAuthEvents(app);
    return;
  }

  const activeProperty = getActiveProperty();
  const filteredRecords = getFilteredRecords();
  const summaryRecords = getSummaryScopedRecords(filteredRecords, state.summaryAnimal);
  const routeContent = renderRoute({
    activeProperty,
    filteredRecords,
    state
  });
  if (shellRender) {
    shellRender({
      isSignedIn: true,
      activePropertyName: activeProperty?.name ?? "Sem propriedade",
      cloudEnabled: state.cloud.enabled,
      cloudMessage: state.cloud.message,
      activePropertyId: state.activePropertyId,
      dashboardRecords: state.records,
      detailedReportFilters: state.filters,
      detailedReportRecords: filteredRecords,
      detailedReportSummary: calculateSummary(filteredRecords),
      fabContent: icons.target,
      pdfPreview: state.pdfPreview,
      properties: state.properties,
      route: state.route,
      routeContent,
      sheet: state.sheet,
      summaryReportAggregates: aggregateByAnimal(summaryRecords),
      summaryReportAnimals: [...new Set(state.records.map((record) => record.animalId))].sort(),
      summaryReportFilters: state.filters,
      summaryReportSelectedAnimal: state.summaryAnimal,
      summaryReportSummary: calculateSummary(summaryRecords),
      toast: state.toast
    });
    return;
  }

  app.innerHTML = renderAppChrome({
    activeProperty,
    cloud: state.cloud,
    pdfPreviewContent: state.pdfPreview ? renderPdfPreview(state.pdfPreview) : "",
    route: state.route,
    routeContent,
    sheetContent: state.sheet ? renderSheet() : "",
    toast: state.toast
  });

  bindLegacyShellEvents(app);
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
  return runCloudSyncOperation({
    cloud: state.cloud,
    getOwnerId,
    onCloudUnavailable: () => {
      state.cloud = {
        enabled: false,
        message: "Firebase indisponível."
      };
    },
    operation
  });
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
