import {
  createProperty,
  ensureInitialProperty,
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
import { downloadCsv, printReport } from "../services/export/exporters.js";
import {
  initCloudSync,
  syncActiveProperty,
  syncProperty,
  syncPropertyDeletion,
  syncPropertyHistoryClear,
  syncWeightRecord,
  syncWeightRecordDeletion,
  syncWeightRecordsDeletion
} from "../firebase/firestoreSync.js";

const app = document.querySelector("#app");

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
  toast: "",
  cloud: {
    enabled: false,
    message: "Firebase não configurado."
  }
};

const icons = {
  plus: svg("M12 5v14M5 12h14"),
  trash: svg("M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15"),
  pencil: svg("M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z"),
  check: svg("M20 6 9 17l-5-5"),
  filter: svg("M4 5h16l-6 7v5l-4 2v-7L4 5Z"),
  arrow: svg("M9 18l6-6-6-6"),
  target: svg("M12 3v3M12 18v3M3 12h3M18 12h3M7.8 7.8l2.1 2.1M16.2 7.8l-2.1 2.1M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z")
};

init();

async function init() {
  await ensureInitialProperty();
  state.properties = await listProperties();
  state.activePropertyId = await getActivePropertyId();
  if (!state.activePropertyId && state.properties[0]) {
    state.activePropertyId = state.properties[0].id;
    await setActivePropertyId(state.activePropertyId);
  }
  await refreshRecords();
  render();
  registerPwa();
  exposeDebugTools();
  state.cloud = await initCloudSync();
  await refreshAll();
}

async function refreshAll() {
  state.properties = await listProperties();
  state.activePropertyId = await getActivePropertyId();
  await refreshRecords();
  render();
}

async function refreshRecords() {
  state.records = state.activePropertyId ? await listWeightRecords(state.activePropertyId) : [];
}

function render() {
  const activeProperty = getActiveProperty();
  app.innerHTML = `
    <header class="topbar">
      <div class="logo" aria-hidden="true">BR</div>
      <button class="property-switcher" data-action="cycle-property" type="button">
        <span class="property-title">${escapeHtml(activeProperty?.name ?? "Sem propriedade")}</span>
        <span aria-hidden="true">⌄</span>
      </button>
      <button class="topbar-menu" type="button" data-action="go-properties" aria-label="Abrir propriedades">⋯</button>
    </header>

    <main class="app-shell">
      ${renderSyncStatus()}
      ${renderRoute()}
    </main>

    <button class="fab" type="button" data-action="open-weight-sheet" aria-label="Adicionar pesagem">${icons.target}</button>

    <nav class="bottom-nav" aria-label="Navegação principal">
      <button class="nav-btn ${state.route === "properties" ? "active" : ""}" type="button" data-route="properties">Propriedades</button>
      <span></span>
      <button class="nav-btn ${state.route.startsWith("reports") ? "active" : ""}" type="button" data-route="reports-home">Relatórios</button>
    </nav>

    ${state.sheet ? renderSheet() : ""}
    ${state.toast ? `<div class="toast">${escapeHtml(state.toast)}</div>` : ""}
  `;

  bindEvents();
}

function renderSyncStatus() {
  const modifier = state.cloud.enabled ? "online" : "offline";
  return `
    <div class="sync-status ${modifier}">
      <span></span>
      ${escapeHtml(state.cloud.message)}
    </div>
  `;
}

function renderRoute() {
  if (state.route === "properties") return renderPropertiesScreen();
  if (state.route === "reports-home") return renderReportsHome();
  if (state.route === "reports-detailed") return renderDetailedReport();
  if (state.route === "reports-summary") return renderSummaryReport();
  return renderDashboard();
}

function renderDashboard() {
  const activeProperty = getActiveProperty();
  const total = state.records.reduce((sum, record) => sum + record.weight, 0);

  return `
    <section class="screen">
      <div class="screen-header">
        <div>
          <h1 class="screen-title">Pesagens</h1>
          <p class="screen-subtitle">${escapeHtml(activeProperty?.name ?? "Crie uma propriedade")}</p>
        </div>
      </div>

      <div class="dashboard-total">
        <strong>${formatNumber(total)} kg</strong>
        <span>Total registrado</span>
      </div>

      <div class="action-grid">
        <button class="btn red" type="button" data-action="clear-history">${icons.trash} Limpar histórico</button>
        <button class="btn green" type="button" data-action="open-weight-sheet">${icons.plus} Adicionar</button>
      </div>

      ${state.records.length ? state.records.map(renderRecordCard).join("") : renderEmpty("Nenhuma pesagem registrada para esta propriedade.")}
    </section>
  `;
}

function renderPropertiesScreen() {
  return `
    <section class="screen">
      <div class="screen-header">
        <div>
          <h1 class="screen-title">Propriedades</h1>
          <p class="screen-subtitle">Selecione onde as pesagens serão registradas.</p>
        </div>
        <button class="btn green small" type="button" data-action="create-property">${icons.plus} Novo</button>
      </div>

      ${state.properties.map(renderPropertyCard).join("")}
    </section>
  `;
}

function renderPropertyCard(property, index) {
  const isActive = property.id === state.activePropertyId;
  return `
    <article class="card property-card ${isActive ? "active" : ""}">
      <button class="card-main" type="button" data-action="select-property" data-id="${property.id}" aria-label="Selecionar ${escapeHtml(property.name)}">
        <span>
          <span class="entity-id">#${index + 1}${isActive ? " · Ativa" : ""}</span>
          <span class="entity-name">${escapeHtml(property.name)}</span>
        </span>
      </button>
      <div class="row-actions">
        <button class="btn purple small" type="button" data-action="edit-property" data-id="${property.id}">${icons.pencil} Editar</button>
        <button class="btn red small" type="button" data-action="delete-property" data-id="${property.id}">${icons.trash} Excluir</button>
      </div>
    </article>
  `;
}

function renderRecordCard(record) {
  return `
    <article class="card record-card">
      <div class="card-main">
        <div>
          <div class="animal-id">${escapeHtml(record.animalId)}</div>
          <div class="record-date">${formatDateTime(record.timestamp)}</div>
        </div>
        <div class="weight-value">${formatNumber(record.weight)} kg</div>
      </div>
      <div class="row-actions">
        <button class="btn red small" type="button" data-action="delete-record" data-id="${record.id}">${icons.trash} Excluir</button>
        <button class="btn yellow small" type="button" data-action="edit-record" data-id="${record.id}">${icons.pencil} Editar</button>
      </div>
    </article>
  `;
}

function renderReportsHome() {
  return `
    <section class="screen">
      <h1 class="screen-title">Relatórios</h1>
      <p class="screen-subtitle">Consulte, filtre e exporte as pesagens da propriedade ativa.</p>
      <div class="report-buttons">
        <button class="report-link blue" type="button" data-route="reports-detailed">Detalhado ${icons.arrow}</button>
        <button class="report-link green" type="button" data-route="reports-summary">Resumido ${icons.arrow}</button>
      </div>
    </section>
  `;
}

function renderDetailedReport() {
  const filtered = getFilteredRecords();
  const summary = calculateSummary(filtered);

  return `
    <section class="screen">
      <div class="screen-header">
        <div>
          <h1 class="screen-title">Relatório Detalhado</h1>
          <p class="screen-subtitle">${escapeHtml(getActiveProperty()?.name ?? "")}</p>
        </div>
      </div>
      ${renderFilters()}
      <div class="row-actions" style="margin-top: 14px;">
        <button class="btn green small" type="button" data-action="export-detailed-csv">CSV</button>
        <button class="btn red small" type="button" data-action="export-detailed-pdf">PDF</button>
        <button class="btn red small" type="button" data-action="delete-filtered">Excluir tudo</button>
      </div>
      ${renderSummary(summary)}
      ${filtered.length ? filtered.map(renderRecordCard).join("") : renderEmpty("Nenhum registro encontrado com os filtros atuais.")}
    </section>
  `;
}

function renderSummaryReport() {
  const filtered = getFilteredRecords();
  const animals = [...new Set(state.records.map((record) => record.animalId))].sort();
  const scoped = state.summaryAnimal === "Todos" ? filtered : filtered.filter((record) => record.animalId === state.summaryAnimal);
  const summary = calculateSummary(scoped);
  const aggregates = aggregateByAnimal(scoped);

  return `
    <section class="screen">
      <h1 class="screen-title">Relatório Resumido</h1>
      <p class="screen-subtitle">${escapeHtml(getActiveProperty()?.name ?? "")}</p>
      <div class="field" style="margin-top: 14px;">
        <label for="summary-animal">Animal</label>
        <select id="summary-animal" data-action="summary-animal">
          <option ${state.summaryAnimal === "Todos" ? "selected" : ""}>Todos</option>
          ${animals.map((animal) => `<option ${state.summaryAnimal === animal ? "selected" : ""}>${escapeHtml(animal)}</option>`).join("")}
        </select>
      </div>
      ${renderFilters()}
      <div class="row-actions" style="margin-top: 14px;">
        <button class="btn green small" type="button" data-action="export-summary-csv">CSV</button>
        <button class="btn red small" type="button" data-action="export-summary-pdf">PDF</button>
      </div>
      ${renderSummary(summary)}
      ${
        aggregates.length
          ? aggregates.map(renderAggregateCard).join("")
          : renderEmpty("Nenhum dado agregado encontrado.")
      }
    </section>
  `;
}

function renderFilters() {
  return `
    <details class="filters">
      <summary>${icons.filter} Filtros</summary>
      <div class="filters-panel">
        <div class="field">
          <label for="filter-animal">Código do Animal</label>
          <input id="filter-animal" value="${escapeHtml(state.filters.animalId)}" placeholder="Digite o código do animal" data-filter="animalId" />
        </div>
        <div class="field">
          <label for="filter-from">Data inicial</label>
          <input id="filter-from" type="date" value="${escapeHtml(state.filters.from)}" data-filter="from" />
        </div>
        <div class="field">
          <label for="filter-to">Data final</label>
          <input id="filter-to" type="date" value="${escapeHtml(state.filters.to)}" data-filter="to" />
        </div>
      </div>
    </details>
  `;
}

function renderSummary(summary) {
  return `
    <div class="summary-grid">
      <div class="summary-item"><span>Quantidade</span><strong>${summary.quantity}</strong></div>
      <div class="summary-item"><span>Maior peso</span><strong>${formatNumber(summary.max)} kg</strong></div>
      <div class="summary-item"><span>Menor peso</span><strong>${formatNumber(summary.min)} kg</strong></div>
      <div class="summary-item"><span>Média</span><strong>${formatNumber(summary.average)} kg</strong></div>
      <div class="summary-item"><span>Total</span><strong>${formatNumber(summary.total)} kg</strong></div>
    </div>
  `;
}

function renderAggregateCard(item) {
  return `
    <article class="card aggregate-card">
      <div class="card-main">
        <div>
          <div class="entity-id">Animal</div>
          <div class="entity-name">${escapeHtml(item.animalId)}</div>
        </div>
        <div class="weight-value">${formatNumber(item.lastWeight)} kg</div>
      </div>
      <div class="summary-grid">
        <div class="summary-item"><span>Pesagens</span><strong>${item.quantity}</strong></div>
        <div class="summary-item"><span>Média</span><strong>${formatNumber(item.average)} kg</strong></div>
        <div class="summary-item"><span>Maior</span><strong>${formatNumber(item.max)} kg</strong></div>
        <div class="summary-item"><span>Menor</span><strong>${formatNumber(item.min)} kg</strong></div>
      </div>
    </article>
  `;
}

function renderSheet() {
  if (state.sheet.type === "weight") return renderWeightSheet();
  if (state.sheet.type === "property") return renderPropertySheet();
  return "";
}

function renderWeightSheet() {
  const record = state.sheet.record;
  const isEditing = Boolean(record);
  const activeProperty = getActiveProperty();

  return `
    <div class="sheet-backdrop" data-action="close-sheet">
      <form class="sheet" data-form="weight">
        <h2>${isEditing ? "Editar pesagem" : "Adicionar pesagem"}</h2>
        <p class="sheet-context">Propriedade: <strong>${escapeHtml(activeProperty?.name ?? "Sem propriedade ativa")}</strong></p>
        <div class="field">
          <label for="animalId">Código do Animal</label>
          <input id="animalId" name="animalId" value="${escapeHtml(record?.animalId ?? "")}" placeholder="Digite o código do animal" inputmode="numeric" autocomplete="off" />
        </div>
        <div class="field">
          <label for="weight">Peso</label>
          <input id="weight" name="weight" value="${record?.weight ?? ""}" type="number" min="1" step="0.1" inputmode="decimal" placeholder="Peso em kg" />
        </div>
        ${state.sheet.error ? `<div class="field-error">${escapeHtml(state.sheet.error)}</div>` : ""}
        <div class="row-actions" style="margin-top: 16px;">
          <button class="btn ghost" type="button" data-action="close-sheet">Cancelar</button>
          <button class="btn green" type="submit">${icons.check} Confirmar</button>
        </div>
      </form>
    </div>
  `;
}

function renderPropertySheet() {
  const property = state.sheet.property;
  const isEditing = Boolean(property);

  return `
    <div class="sheet-backdrop" data-action="close-sheet">
      <form class="sheet" data-form="property">
        <h2>${isEditing ? "Editar propriedade" : "Nova propriedade"}</h2>
        <div class="field">
          <label for="propertyName">Nome da propriedade</label>
          <input id="propertyName" name="name" value="${escapeHtml(property?.name ?? "")}" placeholder="Ex.: Riacho do Boi" autocomplete="off" />
        </div>
        ${state.sheet.error ? `<div class="field-error">${escapeHtml(state.sheet.error)}</div>` : ""}
        <div class="row-actions" style="margin-top: 16px;">
          <button class="btn ghost" type="button" data-action="close-sheet">Cancelar</button>
          <button class="btn green" type="submit">${icons.check} Confirmar</button>
        </div>
      </form>
    </div>
  `;
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

async function handleAction(event) {
  const action = event.currentTarget.dataset.action;
  const id = event.currentTarget.dataset.id;

  if (action === "close-sheet") {
    state.sheet = null;
    render();
    return;
  }

  event.stopPropagation();

  if (action === "go-properties") {
    state.route = "properties";
    render();
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
      await clearWeightHistory(id);
      await removeProperty(id);
      await runCloudSync(() => syncPropertyDeletion(id));
      toast("Propriedade excluída.");
      await refreshAll();
    }
  }

  if (action === "select-property") {
    await setActivePropertyId(id);
    await runCloudSync(() => syncActiveProperty(id));
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
      await runCloudSync(() => syncWeightRecordDeletion(id));
      toast("Pesagem excluída.");
      await refreshRecords();
      render();
    }
  }

  if (action === "clear-history") {
    if (state.records.length && confirm("Limpar todo o histórico desta propriedade?")) {
      await clearWeightHistory(state.activePropertyId);
      await runCloudSync(() => syncPropertyHistoryClear(state.activePropertyId));
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
      await runCloudSync(() => syncWeightRecordsDeletion(ids));
      toast("Registros filtrados excluídos.");
      await refreshRecords();
      render();
    }
  }

  if (action === "export-detailed-csv") exportDetailedCsv();
  if (action === "export-summary-csv") exportSummaryCsv();
  if (action === "export-detailed-pdf") exportDetailedPdf();
  if (action === "export-summary-pdf") exportSummaryPdf();
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
      const record = await updateWeightRecord(state.sheet.record.id, { animalId, weight });
      await runCloudSync(() => syncWeightRecord(record));
      toast("Pesagem atualizada.");
    } else {
      const activePropertyId = await getActivePropertyId();
      if (!activePropertyId) {
        state.sheet.error = "Selecione uma propriedade antes de salvar a pesagem.";
        render();
        return;
      }
      state.activePropertyId = activePropertyId;
      const record = await createWeightRecord({ propertyId: activePropertyId, animalId, weight });
      await runCloudSync(() => syncWeightRecord(record));
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
      const property = await updateProperty(state.sheet.property.id, { name });
      await runCloudSync(() => syncProperty(property));
      toast("Propriedade atualizada.");
    } else {
      const property = await createProperty(name, { activate: true });
      state.activePropertyId = property.id;
      await runCloudSync(async () => {
        await syncProperty(property);
        await syncActiveProperty(property.id);
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
    const [properties, activePropertyId, records] = await Promise.all([
      listProperties(),
      getActivePropertyId(),
      listAllWeightRecords()
    ]);

    return {
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
  await setActivePropertyId(next.id);
  await runCloudSync(() => syncActiveProperty(next.id));
  toast(`Propriedade ativa: ${next.name}`);
  await refreshAll();
}

async function runCloudSync(operation) {
  if (!state.cloud.enabled) return false;

  try {
    await operation();
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

function calculateSummary(records) {
  const weights = records.map((record) => record.weight);
  const total = weights.reduce((sum, weight) => sum + weight, 0);

  return {
    quantity: records.length,
    max: weights.length ? Math.max(...weights) : 0,
    min: weights.length ? Math.min(...weights) : 0,
    average: weights.length ? total / weights.length : 0,
    total
  };
}

function aggregateByAnimal(records) {
  const groups = new Map();

  records.forEach((record) => {
    if (!groups.has(record.animalId)) groups.set(record.animalId, []);
    groups.get(record.animalId).push(record);
  });

  return [...groups.entries()].map(([animalId, items]) => {
    const ordered = [...items].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const summary = calculateSummary(items);
    return {
      animalId,
      quantity: summary.quantity,
      lastWeight: ordered[0].weight,
      max: summary.max,
      min: summary.min,
      average: summary.average
    };
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
  const rows = [
    ["Animal", "Quantidade", "Ultimo peso kg", "Maior kg", "Menor kg", "Media kg"],
    ...aggregateByAnimal(getFilteredRecords()).map((item) => [
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

function exportDetailedPdf() {
  const records = getFilteredRecords();
  const summary = calculateSummary(records);
  printReport("Relatório Detalhado", `
    <h1>Relatório Detalhado - ${escapeHtml(getActiveProperty()?.name ?? "")}</h1>
    ${summaryHtml(summary)}
    <table>
      <thead><tr><th>Animal</th><th>Data e hora</th><th>Peso</th></tr></thead>
      <tbody>${records.map((record) => `<tr><td>${escapeHtml(record.animalId)}</td><td>${formatDateTime(record.timestamp)}</td><td>${formatNumber(record.weight)} kg</td></tr>`).join("")}</tbody>
    </table>
  `);
}

function exportSummaryPdf() {
  const aggregates = aggregateByAnimal(getFilteredRecords());
  const summary = calculateSummary(getFilteredRecords());
  printReport("Relatório Resumido", `
    <h1>Relatório Resumido - ${escapeHtml(getActiveProperty()?.name ?? "")}</h1>
    ${summaryHtml(summary)}
    <table>
      <thead><tr><th>Animal</th><th>Pesagens</th><th>Último peso</th><th>Média</th></tr></thead>
      <tbody>${aggregates.map((item) => `<tr><td>${escapeHtml(item.animalId)}</td><td>${item.quantity}</td><td>${formatNumber(item.lastWeight)} kg</td><td>${formatNumber(item.average)} kg</td></tr>`).join("")}</tbody>
    </table>
  `);
}

function summaryHtml(summary) {
  return `
    <div class="summary">
      <div><strong>Quantidade</strong><br>${summary.quantity}</div>
      <div><strong>Maior peso</strong><br>${formatNumber(summary.max)} kg</div>
      <div><strong>Menor peso</strong><br>${formatNumber(summary.min)} kg</div>
      <div><strong>Média</strong><br>${formatNumber(summary.average)} kg</div>
      <div><strong>Total</strong><br>${formatNumber(summary.total)} kg</div>
    </div>
  `;
}

function toast(message) {
  state.toast = message;
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => {
    state.toast = "";
    render();
  }, 1800);
}

function renderEmpty(message) {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatNumber(value) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1
  }).format(value || 0);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function svg(path) {
  return `<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;
}

function registerPwa() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}
