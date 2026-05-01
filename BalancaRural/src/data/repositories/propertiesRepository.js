import { deleteOne, readAll, readOne, STORES, writeOne } from "../db/indexedDb.js";
import { createId } from "../../utils/id.js";

const ACTIVE_PROPERTY_KEY = "activePropertyId";

export async function listProperties() {
  const properties = await readAll(STORES.properties);
  return properties.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

export async function createProperty(name, options = {}) {
  const property = {
    id: createId("property"),
    name: name.trim(),
    createdAt: new Date().toISOString()
  };

  await writeOne(STORES.properties, property);
  const saved = await readOne(STORES.properties, property.id);
  if (!saved) {
    throw new Error("A propriedade não foi salva no IndexedDB.");
  }

  const activeId = await getActivePropertyId();
  if (options.activate || !activeId) await setActivePropertyId(property.id);
  return property;
}

export async function updateProperty(id, patch) {
  const current = await readOne(STORES.properties, id);
  if (!current) return null;

  const updated = { ...current, ...patch, name: patch.name.trim() };
  await writeOne(STORES.properties, updated);
  return updated;
}

export async function removeProperty(id) {
  await deleteOne(STORES.properties, id);

  const activeId = await getActivePropertyId();
  if (activeId === id) {
    const remaining = await listProperties();
    await setActivePropertyId(remaining[0]?.id ?? null);
  }
}

export async function getActivePropertyId() {
  const row = await readOne(STORES.appState, ACTIVE_PROPERTY_KEY);
  return row?.value ?? null;
}

export async function setActivePropertyId(propertyId) {
  await writeOne(STORES.appState, {
    key: ACTIVE_PROPERTY_KEY,
    value: propertyId
  });
}

export async function ensureInitialProperty() {
  const properties = await listProperties();
  if (properties.length > 0) return properties;

  await createProperty("Riacho do Boi");
  return listProperties();
}
