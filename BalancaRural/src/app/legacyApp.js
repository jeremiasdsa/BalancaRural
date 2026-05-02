import {
  createProperty,
  ensureValidActiveProperty,
  getActivePropertyId,
  listProperties,
  removeProperty,
  setActivePropertyId,
  updateProperty
} from "../data/repositories/propertiesRepository.js";
import {
  clearWeightHistory,
  createWeightRecord,
  deleteWeightRecords,
  listAllWeightRecords,
  listWeightRecords,
  removeWeightRecord,
  updateWeightRecord
} from "../data/repositories/weightRecordsRepository.js";
import { downloadCsv, downloadPdfReport } from "../services/export/exporters.js";
import {
  initCloudSync,
  queuePendingCloudOperation,
  syncActiveProperty,
  syncProperty,
  syncPropertyDeletion,
  syncPropertyHistoryClear,
  syncWeightRecord,
  syncWeightRecordDeletion,
  syncWeightRecordsDeletion
} from "../firebase/firestoreSync.js";
import {
  aggregateByAnimal,
  calculateSummary,
  getSummaryItems
} from "../features/weight-records/weightStats.js";
import {
  createAccountWithEmail,
  getAuthErrorMessage,
  observeAuthState,
  resolveOnlineAuthUser,
  sendResetEmail,
  signInWithEmail,
  signOutUser
} from "../firebase/auth.js";
import { clearStore, STORES } from "../data/db/indexedDb.js";
import { renderPropertySheet } from "../components/forms/propertySheet.js";
import { renderWeightSheet } from "../components/forms/weightSheet.js";
import { renderAppChrome } from "../components/layout/appChrome.js";
import { renderPdfPreview } from "../components/modals/pdfPreview.js";
import { registerPwa } from "../pwa/registerPwa.js";
import { renderAuthScreen } from "../screens/auth/authScreen.js";
import { renderDashboardScreen } from "../screens/dashboard/dashboardScreen.js";
import { renderPropertiesScreen } from "../screens/properties/propertiesScreen.js";
import { renderDetailedReportScreen } from "../screens/reports/detailed/detailedReportScreen.js";
import { renderReportsHomeScreen } from "../screens/reports/home/reportsHomeScreen.js";
import { renderSummaryReportScreen } from "../screens/reports/summary/summaryReportScreen.js";
import { formatDateTime, formatNumber } from "../utils/format.js";
import { escapeHtml } from "../utils/html.js";

let app = null;
let initialized = false;

const state = {
  route: "dashboard",
  properties: [],
  activePropertyId: null,
  records: [],
  filters: {
    animalId: "",
    from: "",
    to: ""
  },
  summaryAnimal: "Todos",
  sheet: null,
  pdfPreview: null,
  toast: "",
  auth: {
    status: "loading",
    mode: "login",
    user: null,
    error: "",
    message: "",
    loading: false
  },
  cloud: {
    enabled: false,
    message: "Aguardando login."
  }
};

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
    bindAuthEvents();
    return;
  }

  const activeProperty = getActiveProperty();
  app.innerHTML = renderAppChrome({
    activeProperty,
    cloud: state.cloud,
    pdfPreviewContent: state.pdfPreview ? renderPdfPreview(state.pdfPreview) : "",
    route: state.route,
    routeContent: renderRoute(),
    sheetContent: state.sheet ? renderSheet() : "",
    toast: state.toast
  });

  bindEvents();
}

function renderRoute() {
  if (state.route === "properties") {
    return renderPropertiesScreen({
      activePropertyId: state.activePropertyId,
      properties: state.properties
    });
  }
  if (state.route === "reports-home") return renderReportsHomeScreen();
  if (state.route === "reports-detailed") return renderDetailedReport();
  if (state.route === "reports-summary") return renderSummaryReport();
  return renderDashboardScreen({
    activeProperty: getActiveProperty(),
    records: state.records
  });
}

function renderDetailedReport() {
  const filtered = getFilteredRecords();
  const summary = calculateSummary(filtered);
  return renderDetailedReportScreen({
    activeProperty: getActiveProperty(),
    filteredRecords: filtered,
    filters: state.filters,
    summary
  });
}

function renderSummaryReport() {
  const filtered = getFilteredRecords();
  const animals = [...new Set(state.records.map((record) => record.animalId))].sort();
  const scoped = getSummaryScopedRecords(filtered);
  const summary = calculateSummary(scoped);
  const aggregates = aggregateByAnimal(scoped);
  return renderSummaryReportScreen({
    activeProperty: getActiveProperty(),
    aggregates,
    animals,
    filters: state.filters,
    selectedAnimal: state.summaryAnimal,
    summary
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

function bindEvents() {
  app.querySelectorAll("[data-route]").forEach((button) => {
    button.addEventListener("click", () => {
      state.route = button.dataset.route;
      render();
    });
  });

  app.querySelectorAll("[data-action]").forEach((element) => {
    element.addEventListener("click", handleAction);
  });

  app.querySelectorAll("[data-filter]").forEach((input) => {
    input.addEventListener("input", () => {
      state.filters[input.dataset.filter] = input.value;
      render();
    });
  });

  const summarySelect = app.querySelector("[data-action='summary-animal']");
  if (summarySelect) {
    summarySelect.addEventListener("change", () => {
      state.summaryAnimal = summarySelect.value;
      render();
    });
  }

  const weightForm = app.querySelector("[data-form='weight']");
  if (weightForm) {
    weightForm.addEventListener("submit", handleWeightSubmit);
    weightForm.addEventListener("click", (event) => event.stopPropagation());
  }

  const propertyForm = app.querySelector("[data-form='property']");
  if (propertyForm) {
    propertyForm.addEventListener("submit", handlePropertySubmit);
    propertyForm.addEventListener("click", (event) => event.stopPropagation());
  }
}

function bindAuthEvents() {
  app.querySelectorAll("[data-auth-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.auth.mode = button.dataset.authMode;
      state.auth.error = "";
      state.auth.message = "";
      render();
    });
  });

  const authForm = app.querySelector("[data-form='auth']");
  if (authForm) {
    authForm.addEventListener("submit", handleAuthSubmit);
  }
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");

  if (!email) {
    state.auth.error = "Informe seu email.";
    render();
    return;
  }

  if (state.auth.mode !== "reset" && !password) {
    state.auth.error = "Informe sua senha.";
    render();
    return;
  }

  state.auth.loading = true;
  state.auth.error = "";
  state.auth.message = "";
  render();

  try {
    if (state.auth.mode === "login") {
      await signInWithEmail(email, password);
    } else if (state.auth.mode === "signup") {
      await createAccountWithEmail(email, password);
    } else {
      await sendResetEmail(email);
      state.auth.loading = false;
      state.auth.message = "Email de recuperação enviado.";
      render();
    }
  } catch (error) {
    state.auth.loading = false;
    state.auth.error = getAuthErrorMessage(error);
    render();
  }
}

async function handleAction(event) {
  const action = event.currentTarget.dataset.action;
  const id = event.currentTarget.dataset.id;

  if (action === "close-sheet") {
    state.sheet = null;
    render();
    return;
  }

  if (action === "close-pdf-preview") {
    state.pdfPreview = null;
    render();
    return;
  }

  event.stopPropagation();

  if (action === "logout") {
    await signOutUser();
    await clearVisibleData();
    return;
  }

  if (action === "cycle-property") {
    await cycleProperty();
  }

  if (action === "create-property") {
    state.sheet = { type: "property", property: null, error: "" };
    render();
  }

  if (action === "edit-property") {
    const property = state.properties.find((item) => item.id === id);
    state.sheet = { type: "property", property, error: "" };
    render();
  }

  if (action === "delete-property") {
    const property = state.properties.find((item) => item.id === id);
    if (confirm(`Excluir a propriedade "${property?.name}" e suas pesagens?`)) {
      await clearWeightHistory(id, getOwnerId());
      await removeProperty(id, getOwnerId());
      const synced = await runCloudSync((ownerId) => syncPropertyDeletion(ownerId, id));
      if (!synced) await queuePendingCloudOperation(getOwnerId(), { type: "propertyDeletion", propertyId: id });
      toast("Propriedade excluída.");
      await refreshAll();
    }
  }

  if (action === "select-property") {
    await setActivePropertyId(id, getOwnerId());
    await runCloudSync((ownerId) => syncActiveProperty(ownerId, id));
    state.route = "dashboard";
    toast("Propriedade ativa alterada.");
    await refreshAll();
  }

  if (action === "open-weight-sheet") {
    if (!state.activePropertyId) {
      toast("Crie uma propriedade antes de registrar pesagens.");
      return;
    }
    state.sheet = { type: "weight", record: null, error: "" };
    render();
  }

  if (action === "edit-record") {
    const record = state.records.find((item) => item.id === id);
    state.sheet = { type: "weight", record, error: "" };
    render();
  }

  if (action === "delete-record") {
    if (confirm("Excluir esta pesagem?")) {
      await removeWeightRecord(id);
      const synced = await runCloudSync((ownerId) => syncWeightRecordDeletion(ownerId, id));
      if (!synced) await queuePendingCloudOperation(getOwnerId(), { type: "weightRecordDeletion", recordId: id });
      toast("Pesagem excluída.");
      await refreshRecords();
      render();
    }
  }

  if (action === "clear-history") {
    if (state.records.length && confirm("Limpar todo o histórico desta propriedade?")) {
      await clearWeightHistory(state.activePropertyId, getOwnerId());
      const synced = await runCloudSync((ownerId) => syncPropertyHistoryClear(ownerId, state.activePropertyId));
      if (!synced) {
        await queuePendingCloudOperation(getOwnerId(), {
          type: "propertyHistoryClear",
          propertyId: state.activePropertyId
        });
      }
      toast("Histórico limpo.");
      await refreshRecords();
      render();
    }
  }

  if (action === "delete-filtered") {
    const filtered = getFilteredRecords();
    if (filtered.length && confirm("Excluir todos os registros filtrados?")) {
      const ids = filtered.map((record) => record.id);
      await deleteWeightRecords(ids);
      const synced = await runCloudSync((ownerId) => syncWeightRecordsDeletion(ownerId, ids));
      if (!synced) {
        await queuePendingCloudOperation(getOwnerId(), {
          type: "weightRecordsDeletion",
          recordIds: ids
        });
      }
      toast("Registros filtrados excluídos.");
      await refreshRecords();
      render();
    }
  }

  if (action === "export-detailed-csv") exportDetailedCsv();
  if (action === "export-summary-csv") exportSummaryCsv();
  if (action === "export-detailed-pdf") openDetailedPdfPreview();
  if (action === "export-summary-pdf") openSummaryPdfPreview();
  if (action === "download-pdf-preview") downloadCurrentPdfPreview();
}

async function handleWeightSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const animalId = String(form.get("animalId") ?? "").trim();
  const weight = Number(form.get("weight"));

  if (!animalId || !Number.isFinite(weight) || weight <= 0) {
    state.sheet.error = "Informe o código do animal e um peso válido.";
    render();
    return;
  }

  try {
    if (state.sheet.record) {
      const record = await updateWeightRecord(state.sheet.record.id, { animalId, weight }, getOwnerId());
      await runCloudSync((ownerId) => syncWeightRecord(ownerId, record));
      toast("Pesagem atualizada.");
    } else {
      const activePropertyId = await getActivePropertyId(getOwnerId());
      if (!activePropertyId) {
        state.sheet.error = "Selecione uma propriedade antes de salvar a pesagem.";
        render();
        return;
      }
      state.activePropertyId = activePropertyId;
      const record = await createWeightRecord({ propertyId: activePropertyId, animalId, weight, ownerId: getOwnerId() });
      await runCloudSync((ownerId) => syncWeightRecord(ownerId, record));
      toast("Pesagem adicionada.");
    }
  } catch (error) {
    state.sheet.error = error.message || "Não foi possível salvar a pesagem.";
    render();
    return;
  }

  state.sheet = null;
  await refreshRecords();
  render();
}

async function handlePropertySubmit(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const name = String(form.get("name") ?? "").trim();

  if (!name) {
    state.sheet.error = "Informe o nome da propriedade.";
    render();
    return;
  }

  try {
    if (state.sheet.property) {
      const property = await updateProperty(state.sheet.property.id, { name }, getOwnerId());
      await runCloudSync((ownerId) => syncProperty(ownerId, property));
      toast("Propriedade atualizada.");
    } else {
      const property = await createProperty(name, { activate: true, ownerId: getOwnerId() });
      state.activePropertyId = property.id;
      await runCloudSync(async (ownerId) => {
        await syncProperty(ownerId, property);
        await syncActiveProperty(ownerId, property.id);
      });
      state.route = "dashboard";
      toast("Propriedade criada e ativada.");
    }
  } catch (error) {
    state.sheet.error = error.message || "Não foi possível salvar a propriedade.";
    render();
    return;
  }

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
  await Promise.all([
    clearStore(STORES.properties),
    clearStore(STORES.weightRecords),
    clearStore(STORES.appState)
  ]);
  state.route = "dashboard";
  state.properties = [];
  state.activePropertyId = null;
  state.records = [];
  state.filters = {
    animalId: "",
    from: "",
    to: ""
  };
  state.summaryAnimal = "Todos";
  state.sheet = null;
  state.pdfPreview = null;
}

function getOwnerId() {
  return state.auth.user?.uid ?? null;
}

function getActiveProperty() {
  return state.properties.find((property) => property.id === state.activePropertyId) ?? null;
}

function getFilteredRecords() {
  return state.records.filter((record) => {
    const animalMatches = state.filters.animalId
      ? record.animalId.toLowerCase().includes(state.filters.animalId.toLowerCase())
      : true;
    const recordDate = record.timestamp.slice(0, 10);
    const fromMatches = state.filters.from ? recordDate >= state.filters.from : true;
    const toMatches = state.filters.to ? recordDate <= state.filters.to : true;
    return animalMatches && fromMatches && toMatches;
  });
}

function exportDetailedCsv() {
  const rows = [
    ["Animal", "Data e hora", "Peso kg"],
    ...getFilteredRecords().map((record) => [record.animalId, formatDateTime(record.timestamp), record.weight])
  ];
  downloadCsv("relatorio-detalhado.csv", rows);
}

function exportSummaryCsv() {
  const records = getSummaryScopedRecords(getFilteredRecords());
  const rows = [
    ["Animal", "Quantidade", "Ultimo peso kg", "Maior kg", "Menor kg", "Media kg"],
    ...aggregateByAnimal(records).map((item) => [
      item.animalId,
      item.quantity,
      item.lastWeight,
      item.max,
      item.min,
      item.average.toFixed(1)
    ])
  ];
  downloadCsv("relatorio-resumido.csv", rows);
}

function openDetailedPdfPreview() {
  state.pdfPreview = createDetailedPdfPreview();
  render();
}

function openSummaryPdfPreview() {
  state.pdfPreview = createSummaryPdfPreview();
  render();
}

function downloadCurrentPdfPreview() {
  if (!state.pdfPreview) return;
  downloadPdfReport(state.pdfPreview.filename, state.pdfPreview.report);
}

function createDetailedPdfPreview() {
  const records = getFilteredRecords();
  const summary = calculateSummary(records);
  return {
    filename: "relatorio-detalhado.pdf",
    report: {
      title: "Relatório Detalhado",
      subtitle: getActiveProperty()?.name ?? "",
      summaryItems: getSummaryItems(summary),
      columns: [
        { label: "Animal", width: 18 },
        { label: "Data e hora", width: 22 },
        { label: "Peso", width: 14 }
      ],
      rows: records.map((record) => [
        record.animalId,
        formatDateTime(record.timestamp),
        `${formatNumber(record.weight)} kg`
      ])
    }
  };
}

function createSummaryPdfPreview() {
  const records = getSummaryScopedRecords(getFilteredRecords());
  const aggregates = aggregateByAnimal(records);
  const summary = calculateSummary(records);
  return {
    filename: "relatorio-resumido.pdf",
    report: {
      title: "Relatório Resumido",
      subtitle: getActiveProperty()?.name ?? "",
      summaryItems: getSummaryItems(summary),
      columns: [
        { label: "Animal", width: 18 },
        { label: "Pesagens", width: 10 },
        { label: "Último peso", width: 14 },
        { label: "Média", width: 14 }
      ],
      rows: aggregates.map((item) => [
        item.animalId,
        item.quantity,
        `${formatNumber(item.lastWeight)} kg`,
        `${formatNumber(item.average)} kg`
      ])
    }
  };
}

function getSummaryScopedRecords(records) {
  return state.summaryAnimal === "Todos"
    ? records
    : records.filter((record) => record.animalId === state.summaryAnimal);
}

function toast(message) {
  state.toast = message;
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => {
    state.toast = "";
    render();
  }, 1800);
}
