import { setActivePropertyId } from "../data/repositories/propertiesRepository.js";
import { syncActiveProperty } from "../firebase/firestoreSync.js";
import {
  createDetailedPdfPreview,
  createSummaryPdfPreview,
  downloadPdfPreview as downloadReportPdfPreview,
  getSummaryScopedRecords
} from "../features/reports/reportExports.js";
import * as appActions from "./actionHandlers.js";
import * as appForms from "./appForms.js";
import { createAppSnapshot, getActiveProperty, getFilteredRecords } from "./appSnapshot.js";
import { runCloudSyncOperation } from "./cloudSync.js";
import { loadAppData, loadWeightRecords } from "./dataLoaders.js";
import { exposeDebugTools } from "./debugTools.js";
import { initializeSessionLifecycle } from "./sessionLifecycle.js";
import { createInitialState } from "./state.js";
import { clearVisibleData as clearVisibleStoresAndState } from "./visibleData.js";
import { registerPwa } from "../pwa/registerPwa.js";

let initialized = false;
let shellRender = null;
const state = createInitialState();

export function mountAppController(options = {}) {
  shellRender = options.onShellRender ?? null;
  if (initialized) {
    render();
    return;
  }

  initialized = true;
  init();
}

export function navigateRoute(route) {
  handleRouteChange(route);
}

export function updateFilter(filter, value) {
  handleFilterChange(filter, value);
}

export function updateSummaryAnimal(value) {
  handleSummaryAnimalChange(value);
}

export async function closeSheet() {
  appActions.closeSheet(getActionContext());
}

export async function closePdfPreview() {
  appActions.closePdfPreview(getActionContext());
}

export async function cycleActiveProperty() {
  await appActions.cycleActiveProperty(getActionContext());
}

export async function logout() {
  await appActions.logout(getActionContext());
}

export async function openWeightSheet() {
  appActions.openWeightSheet(getActionContext());
}

export async function clearHistory() {
  await appActions.clearHistory(getActionContext());
}

export async function createProperty() {
  appActions.createProperty(getActionContext());
}

export async function editProperty(id) {
  appActions.editProperty(getActionContext(), id);
}

export async function deleteProperty(id) {
  await appActions.deleteProperty(getActionContext(), id);
}

export async function selectProperty(id) {
  await appActions.selectProperty(getActionContext(), id);
}

export async function editRecord(id) {
  appActions.editRecord(getActionContext(), id);
}

export async function deleteRecord(id) {
  await appActions.deleteRecord(getActionContext(), id);
}

export async function deleteFilteredRecords() {
  await appActions.deleteFilteredRecords(getActionContext());
}

export async function exportDetailedCsv() {
  appActions.exportDetailedCsvAction(getActionContext());
}

export async function exportSummaryCsv() {
  appActions.exportSummaryCsvAction(getActionContext());
}

export async function openDetailedPdfPreview() {
  appActions.openDetailedPdfPreview(getActionContext());
}

export async function openSummaryPdfPreview() {
  appActions.openSummaryPdfPreview(getActionContext());
}

export async function downloadPdfPreview() {
  appActions.downloadPdfPreview(getActionContext());
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
  if (!shellRender) return;
  shellRender(createAppSnapshot(state));
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

function getActionContext() {
  return {
    clearVisibleData,
    cycleProperty,
    downloadCurrentPdfPreview,
    getFilteredRecords: () => getFilteredRecords(state),
    getOwnerId,
    openDetailedPdfPreview: createDetailedPdfPreviewState,
    openSummaryPdfPreview: createSummaryPdfPreviewState,
    refreshAll,
    refreshRecords,
    render,
    runCloudSync,
    state,
    toast
  };
}

export async function submitWeightForm(event) {
  await appForms.submitWeightForm(event, getActionContext());
}

export async function submitPropertyForm(event) {
  await appForms.submitPropertyForm(event, getActionContext());
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

function createDetailedPdfPreviewState() {
  state.pdfPreview = createDetailedPdfPreview({
    activeProperty: getActiveProperty(state),
    records: getFilteredRecords(state)
  });
  render();
}

function createSummaryPdfPreviewState() {
  state.pdfPreview = createSummaryPdfPreview({
    activeProperty: getActiveProperty(state),
    records: getSummaryScopedRecords(getFilteredRecords(state), state.summaryAnimal)
  });
  render();
}

function downloadCurrentPdfPreview() {
  downloadReportPdfPreview(state.pdfPreview);
}

function toast(message) {
  state.toast = message;
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => {
    state.toast = "";
    render();
  }, 1800);
}
