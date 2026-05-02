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

export async function handleLegacyAction(event, context) {
  const action = event.currentTarget.dataset.action;
  const id = event.currentTarget.dataset.id;
  const {
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
  } = context;

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

  if (action === "export-detailed-csv") exportDetailedCsv(getFilteredRecords());
  if (action === "export-summary-csv") exportSummaryCsv(getSummaryScopedRecords(getFilteredRecords(), state.summaryAnimal));
  if (action === "export-detailed-pdf") openDetailedPdfPreview();
  if (action === "export-summary-pdf") openSummaryPdfPreview();
  if (action === "download-pdf-preview") downloadCurrentPdfPreview();
}
