import {
  getActivePropertyId,
  listProperties
} from "../data/repositories/propertiesRepository.js";
import { listAllWeightRecords } from "../data/repositories/weightRecordsRepository.js";

export function exposeDebugTools(getOwnerId) {
  globalThis.balancaRuralDebug = async () => {
    const ownerId = getOwnerId();
    const [properties, activePropertyId, records] = await Promise.all([
      listProperties(ownerId),
      getActivePropertyId(ownerId),
      listAllWeightRecords(ownerId)
    ]);

    return {
      ownerId,
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
