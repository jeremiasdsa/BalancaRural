import { createLocalUser } from "./localIdentity.js";

export function createInitialState() {
  return {
    route: "dashboard",
    properties: [],
    activePropertyId: null,
    records: [],
    filters: createInitialFilters(),
    summaryAnimal: "Todos",
    sheet: null,
    pdfPreview: null,
    toast: "",
    auth: {
      status: "signed-in",
      mode: "login",
      user: createLocalUser(),
      error: "",
      message: "",
      loading: false
    },
    cloud: {
      enabled: false,
      message: "Dados locais neste aparelho."
    }
  };
}

export function createInitialFilters() {
  return {
    animalId: "",
    from: "",
    to: ""
  };
}

export function resetVisibleState(state) {
  state.route = "dashboard";
  state.properties = [];
  state.activePropertyId = null;
  state.records = [];
  state.filters = createInitialFilters();
  state.summaryAnimal = "Todos";
  state.sheet = null;
  state.pdfPreview = null;
}
