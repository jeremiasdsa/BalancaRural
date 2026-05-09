import {
  removeProperty,
  setActivePropertyId
} from "../data/repositories/propertiesRepository.js";
import {
  clearWeightHistory,
  deleteWeightRecords,
  removeWeightRecord
} from "../data/repositories/weightRecordsRepository.js";
import { signOutUser } from "../firebase/auth.js";
import {
  queuePendingCloudOperation,
  syncActiveProperty,
  syncPropertyDeletion,
  syncPropertyHistoryClear,
  syncWeightRecordDeletion,
  syncWeightRecordsDeletion
} from "../firebase/firestoreSync.js";
import {
  exportDetailedCsv,
  exportSummaryCsv,
  getSummaryScopedRecords
} from "../features/reports/reportExports.js";

export function closeSheet({ render, state }) {
  state.sheet = null;
  render();
}

export function closePdfPreview({ render, state }) {
  state.pdfPreview = null;
  render();
}

export async function logout() {
  await signOutUser();
}

export async function cycleActiveProperty({ cycleProperty }) {
  await cycleProperty();
}

export function createProperty({ render, state }) {
  state.sheet = { type: "property", property: null, error: "" };
  render();
}

export function editProperty({ render, state }, id) {
  const property = state.properties.find((item) => item.id === id);
  state.sheet = { type: "property", property, error: "" };
  render();
}

export async function deleteProperty(context, id) {
  const { getOwnerId, refreshAll, runCloudSync, state, toast } = context;
  const property = state.properties.find((item) => item.id === id);

  if (!confirm(`Excluir a propriedade "${property?.name}" e suas pesagens?`)) return;

  await clearWeightHistory(id, getOwnerId());
  await removeProperty(id, getOwnerId());
  const synced = await runCloudSync((ownerId) => syncPropertyDeletion(ownerId, id));
  if (!synced) await queuePendingCloudOperation(getOwnerId(), { type: "propertyDeletion", propertyId: id });
  toast("Propriedade excluída.");
  await refreshAll();
}

export async function selectProperty({ getOwnerId, refreshAll, runCloudSync, state, toast }, id) {
  await setActivePropertyId(id, getOwnerId());
  await runCloudSync((ownerId) => syncActiveProperty(ownerId, id));
  state.route = "dashboard";
  toast("Propriedade ativa alterada.");
  await refreshAll();
}

export function openWeightSheet({ render, state, toast }) {
  if (!state.activePropertyId) {
    toast("Crie uma propriedade antes de registrar pesagens.");
    return;
  }

  state.sheet = { type: "weight", record: null, error: "" };
  render();
}

export function editRecord({ render, state }, id) {
  const record = state.records.find((item) => item.id === id);
  state.sheet = { type: "weight", record, error: "" };
  render();
}

export async function deleteRecord({ getOwnerId, refreshRecords, render, runCloudSync, toast }, id) {
  if (!confirm("Excluir esta pesagem?")) return;

  await removeWeightRecord(id);
  const synced = await runCloudSync((ownerId) => syncWeightRecordDeletion(ownerId, id));
  if (!synced) await queuePendingCloudOperation(getOwnerId(), { type: "weightRecordDeletion", recordId: id });
  toast("Pesagem excluída.");
  await refreshRecords();
  render();
}

export async function clearHistory({ getOwnerId, refreshRecords, render, runCloudSync, state, toast }) {
  if (!state.records.length || !confirm("Limpar todo o histórico desta propriedade?")) return;

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

export async function deleteFilteredRecords(context) {
  const { getFilteredRecords, getOwnerId, refreshRecords, render, runCloudSync, toast } = context;
  const filtered = getFilteredRecords();

  if (!filtered.length || !confirm("Excluir todos os registros filtrados?")) return;

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

export function exportDetailedCsvAction({ getFilteredRecords }) {
  exportDetailedCsv(getFilteredRecords());
}

export function exportSummaryCsvAction({ getFilteredRecords, state }) {
  exportSummaryCsv(getSummaryScopedRecords(getFilteredRecords(), state.summaryAnimal));
}

export function openDetailedPdfPreview({ openDetailedPdfPreview: openPreview }) {
  openPreview();
}

export function openSummaryPdfPreview({ openSummaryPdfPreview: openPreview }) {
  openPreview();
}

export function downloadPdfPreview({ downloadCurrentPdfPreview }) {
  downloadCurrentPdfPreview();
}
