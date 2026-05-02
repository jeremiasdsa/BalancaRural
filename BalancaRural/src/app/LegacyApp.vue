<script setup>
import { nextTick, onMounted, reactive, ref } from "vue";
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
import { bindLegacyShellEvents, mountLegacyApp } from "./legacyApp.js";

const shellRoot = ref(null);
const isSignedIn = ref(false);
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
  nextTick(() => bindLegacyShellEvents(shellRoot.value));
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

onMounted(() => {
  mountLegacyApp({ onShellRender: applySnapshot });
});
</script>

<template>
  <div v-if="isSignedIn" ref="shellRoot">
    <AppChrome
      :active-property-name="snapshot.activePropertyName"
      :cloud-enabled="snapshot.cloudEnabled"
      :cloud-message="snapshot.cloudMessage"
      :route="snapshot.route"
    >
      <DashboardScreen
        v-if="snapshot.route === 'dashboard'"
        :active-property-name="snapshot.activePropertyName"
        :records="snapshot.dashboardRecords"
      />
      <PropertiesScreen
        v-else-if="snapshot.route === 'properties'"
        :active-property-id="snapshot.activePropertyId"
        :properties="snapshot.properties"
      />
      <ReportsHomeScreen v-else-if="snapshot.route === 'reports-home'" />
      <DetailedReportScreen
        v-else-if="snapshot.route === 'reports-detailed'"
        :active-property-name="snapshot.activePropertyName"
        :filtered-records="snapshot.detailedReportRecords"
        :filters="snapshot.detailedReportFilters"
        :summary="snapshot.detailedReportSummary"
      />
      <SummaryReportScreen
        v-else-if="snapshot.route === 'reports-summary'"
        :active-property-name="snapshot.activePropertyName"
        :aggregates="snapshot.summaryReportAggregates"
        :animals="snapshot.summaryReportAnimals"
        :filters="snapshot.summaryReportFilters"
        :selected-animal="snapshot.summaryReportSelectedAnimal"
        :summary="snapshot.summaryReportSummary"
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
        />
        <PropertySheet
          v-if="snapshot.sheet?.type === 'property'"
          :error="snapshot.sheet.error"
          :property="snapshot.sheet.property"
        />
        <PdfPreview
          v-if="snapshot.pdfPreview"
          :pdf-preview="snapshot.pdfPreview"
        />
        <ToastMessage :message="snapshot.toast" />
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
