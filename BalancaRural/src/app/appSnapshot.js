import { icons } from "../components/icons/icons.js";
import { getSummaryScopedRecords } from "../features/reports/reportExports.js";
import { filterWeightRecords } from "../features/weight-records/recordFilters.js";
import { aggregateByAnimal, calculateSummary } from "../features/weight-records/weightStats.js";

export function createAppSnapshot(state) {
  if (state.auth.status !== "signed-in") {
    return {
      isSignedIn: false,
      auth: { ...state.auth }
    };
  }

  const activeProperty = getActiveProperty(state);
  const filteredRecords = getFilteredRecords(state);
  const summaryRecords = getSummaryScopedRecords(filteredRecords, state.summaryAnimal);

  return {
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
    sheet: state.sheet,
    summaryReportAggregates: aggregateByAnimal(summaryRecords),
    summaryReportAnimals: [...new Set(state.records.map((record) => record.animalId))].sort(),
    summaryReportFilters: state.filters,
    summaryReportSelectedAnimal: state.summaryAnimal,
    summaryReportSummary: calculateSummary(summaryRecords),
    toast: state.toast
  };
}

export function getActiveProperty(state) {
  return state.properties.find((property) => property.id === state.activePropertyId) ?? null;
}

export function getFilteredRecords(state) {
  return filterWeightRecords(state.records, state.filters);
}
