export function renderBottomNav(route) {
  return `
    <nav class="bottom-nav" aria-label="Navegação principal">
      <button class="nav-btn ${route === "properties" ? "active" : ""}" type="button" data-route="properties">Propriedades</button>
      <span></span>
      <button class="nav-btn ${route.startsWith("reports") ? "active" : ""}" type="button" data-route="reports-home">Relatórios</button>
    </nav>
  `;
}
