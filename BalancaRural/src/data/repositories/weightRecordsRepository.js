import { deleteOne, getDb, readAll, readOne, STORES, writeOne } from "../db/indexedDb.js";
import { createId } from "../../utils/id.js";

export async function listWeightRecords(propertyId) {
  const records = await readAll(STORES.weightRecords);
  return records
    .filter((record) => record.propertyId === propertyId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export async function listAllWeightRecords() {
  const records = await readAll(STORES.weightRecords);
  return records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export async function createWeightRecord({ propertyId, animalId, weight }) {
  const now = new Date().toISOString();
  const record = {
    id: createId("weight"),
    propertyId,
    animalId: animalId.trim(),
    weight: Number(weight),
    timestamp: now,
    updatedAt: now
  };

  await writeOne(STORES.weightRecords, record);
  const saved = await readOne(STORES.weightRecords, record.id);
  if (!saved) {
    throw new Error("A pesagem não foi salva no IndexedDB.");
  }
  return record;
}

export async function updateWeightRecord(id, patch) {
  const current = await readOne(STORES.weightRecords, id);
  if (!current) return null;

  const updated = {
    ...current,
    ...patch,
    animalId: patch.animalId.trim(),
    weight: Number(patch.weight),
    updatedAt: new Date().toISOString()
  };

  await writeOne(STORES.weightRecords, updated);
  return updated;
}

export async function removeWeightRecord(id) {
  await deleteOne(STORES.weightRecords, id);
}

export async function clearWeightHistory(propertyId) {
  const records = await listWeightRecords(propertyId);
  const db = await getDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.weightRecords, "readwrite");
    const store = tx.objectStore(STORES.weightRecords);
    records.forEach((record) => store.delete(record.id));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteWeightRecords(ids) {
  const db = await getDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.weightRecords, "readwrite");
    const store = tx.objectStore(STORES.weightRecords);
    ids.forEach((id) => store.delete(id));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
