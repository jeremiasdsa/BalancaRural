export function bindAppEvents(root, handlers) {
  if (!root) return;

  root.querySelectorAll("[data-route]").forEach((button) => {
    addBoundListener(button, "route-click", "click", () => handlers.onRouteChange(button.dataset.route));
  });

  root.querySelectorAll("[data-action]").forEach((element) => {
    addBoundListener(element, "action-click", "click", handlers.onAction);
  });

  root.querySelectorAll("[data-filter]").forEach((input) => {
    addBoundListener(input, "filter-input", "input", () => handlers.onFilterChange(input.dataset.filter, input.value));
  });

  const summarySelect = root.querySelector("[data-action='summary-animal']");
  if (summarySelect) {
    addBoundListener(summarySelect, "summary-change", "change", () => handlers.onSummaryAnimalChange(summarySelect.value));
  }

  const weightForm = root.querySelector("[data-form='weight']");
  if (weightForm) {
    addBoundListener(weightForm, "weight-submit", "submit", handlers.onWeightSubmit);
    addBoundListener(weightForm, "weight-click", "click", (event) => event.stopPropagation());
  }

  const propertyForm = root.querySelector("[data-form='property']");
  if (propertyForm) {
    addBoundListener(propertyForm, "property-submit", "submit", handlers.onPropertySubmit);
    addBoundListener(propertyForm, "property-click", "click", (event) => event.stopPropagation());
  }
}

export function bindAuthEvents(root, handlers) {
  if (!root) return;

  root.querySelectorAll("[data-auth-mode]").forEach((button) => {
    addBoundListener(button, "auth-mode-click", "click", () => handlers.onAuthModeChange(button.dataset.authMode));
  });

  const authForm = root.querySelector("[data-form='auth']");
  if (authForm) {
    addBoundListener(authForm, "auth-submit", "submit", handlers.onAuthSubmit);
  }
}

function addBoundListener(element, key, eventName, handler) {
  if (!element.__balancaBindings) {
    Object.defineProperty(element, "__balancaBindings", {
      value: new Set()
    });
  }

  if (element.__balancaBindings.has(key)) return;
  element.__balancaBindings.add(key);
  element.addEventListener(eventName, handler);
}
