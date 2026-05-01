import { deleteOne, readAll, readOne, STORES, writeOne } from "../db/indexedDb.js";
import { createId } from "../../utils/id.js";

const ACTIVE_PROPERTY_KEY = "activePropertyId";

export async function listProperties(ownerId) {
  if (!ownerId) return [];
  const properties = await readAll(STORES.properties);
  return properties
    .filter((property) => property.ownerId === ownerId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

export async function createProperty(name, options = {}) {
  if (!options.ownerId) throw new Error("Usuário não autenticado.");

  const property = {
    id: createId("property"),
    ownerId: options.ownerId,
    name: name.trim(),
    createdAt: new Date().toISOString()
  };

  await writeOne(STORES.properties, property);
  const saved = await readOne(STORES.properties, property.id);
  if (!saved) {
    throw new Error("A propriedade não foi salva no IndexedDB.");
  }

  const activeId = await getActivePropertyId(options.ownerId);
  if (options.activate || !activeId) await setActivePropertyId(property.id, options.ownerId);
  return property;
}

export async function updateProperty(id, patch, ownerId) {
  if (!ownerId) throw new Error("Usuário não autenticado.");
  const current = await readOne(STORES.properties, id);
  if (!current || current.ownerId !== ownerId) return null;

  const updated = { ...current, ...patch, name: patch.name.trim() };
  await writeOne(STORES.properties, updated);
  return updated;
}

export async function removeProperty(id, ownerId) {
  if (!ownerId) return;
  const current = await readOne(STORES.properties, id);
  if (!current || current.ownerId !== ownerId) return;

  await deleteOne(STORES.properties, id);

  const activeId = await getActivePropertyId(ownerId);
  if (activeId === id) {
    const remaining = await listProperties(ownerId);
    await setActivePropertyId(remaining[0]?.id ?? null, ownerId);
  }
}

export async function getActivePropertyId(ownerId) {
  if (!ownerId) return null;
  const row = await readOne(STORES.appState, getActivePropertyKey(ownerId));
  return row?.value ?? null;
}

export async function setActivePropertyId(propertyId, ownerId) {
  if (!ownerId) return;
  await writeOne(STORES.appState, {
    key: getActivePropertyKey(ownerId),
    ownerId,
    value: propertyId
  });
}

export async function ensureValidActiveProperty(ownerId) {
  const properties = await listProperties(ownerId);
  const activeId = await getActivePropertyId(ownerId);
  const activeExists = properties.some((property) => property.id === activeId);

  if (!activeExists) {
    await setActivePropertyId(properties[0]?.id ?? null, ownerId);
  }

  return listProperties(ownerId);
}

function getActivePropertyKey(ownerId) {
  return `${ACTIVE_PROPERTY_KEY}:${ownerId}`;
}
