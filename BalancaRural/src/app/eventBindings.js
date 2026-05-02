export function bindAppEvents(root, handlers) {
  root.querySelectorAll("[data-route]").forEach((button) => {
    button.addEventListener("click", () => handlers.onRouteChange(button.dataset.route));
  });

  root.querySelectorAll("[data-action]").forEach((element) => {
    element.addEventListener("click", handlers.onAction);
  });

  root.querySelectorAll("[data-filter]").forEach((input) => {
    input.addEventListener("input", () => handlers.onFilterChange(input.dataset.filter, input.value));
  });

  const summarySelect = root.querySelector("[data-action='summary-animal']");
  if (summarySelect) {
    summarySelect.addEventListener("change", () => handlers.onSummaryAnimalChange(summarySelect.value));
  }

  const weightForm = root.querySelector("[data-form='weight']");
  if (weightForm) {
    weightForm.addEventListener("submit", handlers.onWeightSubmit);
    weightForm.addEventListener("click", (event) => event.stopPropagation());
  }

  const propertyForm = root.querySelector("[data-form='property']");
  if (propertyForm) {
    propertyForm.addEventListener("submit", handlers.onPropertySubmit);
    propertyForm.addEventListener("click", (event) => event.stopPropagation());
  }
}

export function bindAuthEvents(root, handlers) {
  root.querySelectorAll("[data-auth-mode]").forEach((button) => {
    button.addEventListener("click", () => handlers.onAuthModeChange(button.dataset.authMode));
  });

  const authForm = root.querySelector("[data-form='auth']");
  if (authForm) {
    authForm.addEventListener("submit", handlers.onAuthSubmit);
  }
}
