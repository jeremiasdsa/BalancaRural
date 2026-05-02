import { renderPropertyCard } from "../../components/cards/propertyCard.js";
import { icons } from "../../components/icons/icons.js";

export function renderPropertiesScreen({ activePropertyId, properties }) {
  return `
    <section class="screen">
      <div class="screen-header">
        <div>
          <h1 class="screen-title">Propriedades</h1>
          <p class="screen-subtitle">Selecione onde as pesagens serão registradas.</p>
        </div>
        <button class="btn green small" type="button" data-action="create-property">${icons.plus} Novo</button>
      </div>

      ${properties.map((property, index) => renderPropertyCard(property, index, activePropertyId)).join("")}
    </section>
  `;
}
