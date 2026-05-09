<script setup>
import { onMounted, reactive, ref } from "vue";
import ToastMessage from "../components/feedback/ToastMessage.vue";
import PropertySheet from "../components/forms/PropertySheet.vue";
import WeightSheet from "../components/forms/WeightSheet.vue";
import AppChrome from "../components/layout/AppChrome.vue";
import PdfPreview from "../components/modals/PdfPreview.vue";
import AuthScreen from "../screens/auth/AuthScreen.vue";
import DashboardScreen from "../screens/dashboard/DashboardScreen.vue";
import DetailedReportScreen from "../screens/reports/detailed/DetailedReportScreen.vue";
import PropertiesScreen from "../screens/properties/PropertiesScreen.vue";
import ReportsHomeScreen from "../screens/reports/home/ReportsHomeScreen.vue";
import SummaryReportScreen from "../screens/reports/summary/SummaryReportScreen.vue";
import { submitAuthForm } from "../features/auth/authForm.js";
import {
  clearHistory,
  closePdfPreview,
  closeSheet,
  createProperty,
  cycleActiveProperty,
  deleteFilteredRecords,
  deleteProperty,
  deleteRecord,
  downloadPdfPreview,
  editProperty,
  editRecord,
  exportDetailedCsv,
  exportSummaryCsv,
  logout,
  mountAppController,
  navigateRoute,
  openDetailedPdfPreview,
  openSummaryPdfPreview,
  openWeightSheet,
  selectProperty,
  submitPropertyForm,
  submitWeightForm,
  updateFilter,
  updateSummaryAnimal
} from "./appController.js";

const isSignedIn = ref(false);
const syncAuthOpen = ref(false);
const authState = reactive({
  status: "loading",
  mode: "login",
  loading: false,
  error: "",
  message: ""
});
const snapshot = ref({});

function applySnapshot(nextSnapshot) {
  if (!nextSnapshot.isSignedIn) {
    const wasSignedIn = isSignedIn.value;
    isSignedIn.value = false;
    authState.status = nextSnapshot.auth.status;
    authState.loading = false;
    if (wasSignedIn) {
      authState.mode = "login";
      authState.error = "";
      authState.message = "";
    }
    return;
  }

  isSignedIn.value = true;
  snapshot.value = nextSnapshot;
  if (nextSnapshot.cloudConnected) {
    syncAuthOpen.value = false;
    authState.loading = false;
    authState.error = "";
    authState.message = "";
  }
}

function handleAuthModeChange(mode) {
  authState.mode = mode;
  authState.error = "";
  authState.message = "";
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  const mode = authState.mode;
  authState.loading = true;
  authState.error = "";
  authState.message = "";

  const result = await submitAuthForm({
    formData: new FormData(event.currentTarget),
    mode
  });

  if (result.ok && mode !== "reset") return;

  authState.loading = false;
  authState.error = result.ok ? "" : result.error;
  authState.message = result.message ?? "";
}

function openCloudSync() {
  authState.status = "signed-out";
  authState.mode = "login";
  authState.loading = false;
  authState.error = "";
  authState.message = "";
  syncAuthOpen.value = true;
}

function closeCloudSync() {
  if (authState.loading) return;
  syncAuthOpen.value = false;
  authState.error = "";
  authState.message = "";
}

onMounted(() => {
  mountAppController({ onShellRender: applySnapshot });
});
</script>

<template>
  <div v-if="isSignedIn">
    <AppChrome
      :active-property-name="snapshot.activePropertyName"
      :cloud-enabled="snapshot.cloudEnabled"
      :cloud-connected="snapshot.cloudConnected"
      :cloud-message="snapshot.cloudMessage"
      :route="snapshot.route"
      @cycle-property="cycleActiveProperty"
      @logout="logout"
      @navigate="navigateRoute"
      @open-weight-sheet="openWeightSheet"
      @sync-cloud="openCloudSync"
    >
      <DashboardScreen
        v-if="snapshot.route === 'dashboard'"
        :active-property-name="snapshot.activePropertyName"
        :records="snapshot.dashboardRecords"
        @clear-history="clearHistory"
        @delete-record="deleteRecord"
        @edit-record="editRecord"
        @open-weight-sheet="openWeightSheet"
      />
      <PropertiesScreen
        v-else-if="snapshot.route === 'properties'"
        :active-property-id="snapshot.activePropertyId"
        :properties="snapshot.properties"
        @create-property="createProperty"
        @delete-property="deleteProperty"
        @edit-property="editProperty"
        @select-property="selectProperty"
      />
      <ReportsHomeScreen v-else-if="snapshot.route === 'reports-home'" @navigate="navigateRoute" />
      <DetailedReportScreen
        v-else-if="snapshot.route === 'reports-detailed'"
        :active-property-name="snapshot.activePropertyName"
        :filtered-records="snapshot.detailedReportRecords"
        :filters="snapshot.detailedReportFilters"
        :summary="snapshot.detailedReportSummary"
        @delete-filtered-records="deleteFilteredRecords"
        @delete-record="deleteRecord"
        @edit-record="editRecord"
        @export-csv="exportDetailedCsv"
        @export-pdf="openDetailedPdfPreview"
        @filter-change="updateFilter"
      />
      <SummaryReportScreen
        v-else-if="snapshot.route === 'reports-summary'"
        :active-property-name="snapshot.activePropertyName"
        :aggregates="snapshot.summaryReportAggregates"
        :animals="snapshot.summaryReportAnimals"
        :filters="snapshot.summaryReportFilters"
        :selected-animal="snapshot.summaryReportSelectedAnimal"
        :summary="snapshot.summaryReportSummary"
        @export-csv="exportSummaryCsv"
        @export-pdf="openSummaryPdfPreview"
        @filter-change="updateFilter"
        @summary-animal-change="updateSummaryAnimal"
      />
      <template #fab>
        <span v-html="snapshot.fabContent"></span>
      </template>
      <template #overlays>
        <WeightSheet
          v-if="snapshot.sheet?.type === 'weight'"
          :active-property-name="snapshot.activePropertyName"
          :error="snapshot.sheet.error"
          :record="snapshot.sheet.record"
          @close="closeSheet"
          @submit="submitWeightForm"
        />
        <PropertySheet
          v-if="snapshot.sheet?.type === 'property'"
          :error="snapshot.sheet.error"
          :property="snapshot.sheet.property"
          @close="closeSheet"
          @submit="submitPropertyForm"
        />
        <PdfPreview
          v-if="snapshot.pdfPreview"
          :pdf-preview="snapshot.pdfPreview"
          @close="closePdfPreview"
          @download="downloadPdfPreview"
        />
        <ToastMessage :message="snapshot.toast" />
        <div v-if="syncAuthOpen" class="auth-modal-backdrop" @click.self="closeCloudSync">
          <AuthScreen
            :auth="authState"
            variant="modal"
            @submit="handleAuthSubmit"
            @mode-change="handleAuthModeChange"
            @close="closeCloudSync"
          />
        </div>
      </template>
    </AppChrome>
  </div>
  <div v-else>
    <AuthScreen
      :auth="authState"
      @submit="handleAuthSubmit"
      @mode-change="handleAuthModeChange"
    />
  </div>
</template>
