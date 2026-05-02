import {
  ensureValidActiveProperty,
  getActivePropertyId,
  listProperties,
  setActivePropertyId
} from "../data/repositories/propertiesRepository.js";
import { listWeightRecords } from "../data/repositories/weightRecordsRepository.js";

export async function loadAppData(ownerId) {
  await ensureValidActiveProperty(ownerId);
  const properties = await listProperties(ownerId);
  let activePropertyId = await getActivePropertyId(ownerId);

  if (!activePropertyId && properties[0]) {
    activePropertyId = properties[0].id;
    await setActivePropertyId(activePropertyId, ownerId);
  }

  const records = await loadWeightRecords(activePropertyId, ownerId);

  return {
    activePropertyId,
    properties,
    records
  };
}

export async function loadWeightRecords(activePropertyId, ownerId) {
  return activePropertyId ? listWeightRecords(activePropertyId, ownerId) : [];
}
