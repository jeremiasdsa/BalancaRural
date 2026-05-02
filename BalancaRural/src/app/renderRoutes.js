import { renderDashboardScreen } from "../screens/dashboard/dashboardScreen.js";
import { renderPropertiesScreen } from "../screens/properties/propertiesScreen.js";
import { renderDetailedReportScreen } from "../screens/reports/detailed/detailedReportScreen.js";
import { renderReportsHomeScreen } from "../screens/reports/home/reportsHomeScreen.js";
import { renderSummaryReportScreen } from "../screens/reports/summary/summaryReportScreen.js";
import { getSummaryScopedRecords } from "../features/reports/reportExports.js";
import { aggregateByAnimal, calculateSummary } from "../features/weight-records/weightStats.js";

export function renderRoute({ activeProperty, filteredRecords, state }) {
  if (state.route === "properties") {
    return renderPropertiesScreen({
      activePropertyId: state.activePropertyId,
      properties: state.properties
    });
  }

  if (state.route === "reports-home") {
    return renderReportsHomeScreen();
  }

  if (state.route === "reports-detailed") {
    return renderDetailedReportScreen({
      activeProperty,
      filteredRecords,
      filters: state.filters,
      summary: calculateSummary(filteredRecords)
    });
  }

  if (state.route === "reports-summary") {
    const animals = [...new Set(state.records.map((record) => record.animalId))].sort();
    const scoped = getSummaryScopedRecords(filteredRecords, state.summaryAnimal);

    return renderSummaryReportScreen({
      activeProperty,
      aggregates: aggregateByAnimal(scoped),
      animals,
      filters: state.filters,
      selectedAnimal: state.summaryAnimal,
      summary: calculateSummary(scoped)
    });
  }

  return renderDashboardScreen({
    activeProperty,
    records: state.records
  });
}
