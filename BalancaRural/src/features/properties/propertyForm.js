import {
  createProperty,
  updateProperty
} from "../../data/repositories/propertiesRepository.js";

export async function savePropertyForm({ existingProperty, formData, ownerId, syncNewProperty, syncPropertyChange }) {
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return { ok: false, error: "Informe o nome da propriedade." };
  }

  try {
    if (existingProperty) {
      const property = await updateProperty(existingProperty.id, { name }, ownerId);
      await syncPropertyChange(property);
      return { ok: true, message: "Propriedade atualizada." };
    }

    const property = await createProperty(name, { activate: true, ownerId });
    await syncNewProperty(property);
    return {
      ok: true,
      activePropertyId: property.id,
      route: "dashboard",
      message: "Propriedade criada e ativada."
    };
  } catch (error) {
    return { ok: false, error: error.message || "Não foi possível salvar a propriedade." };
  }
}
