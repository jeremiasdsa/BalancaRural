import { normalizeDiscard } from "./managementInfo.js";
import { normalizeSex } from "./weightStats.js";

export function filterWeightRecords(records, filters) {
  return records.filter((record) => {
    const animalMatches = filters.animalId
      ? record.animalId.toLowerCase().includes(filters.animalId.toLowerCase())
      : true;
    const sexMatches = filters.sex
      ? normalizeSex(record.sex) === normalizeSex(filters.sex)
      : true;
    const discardMatches = filters.discard
      ? normalizeDiscard(record.discard) === normalizeDiscard(filters.discard)
      : true;
    const recordDate = record.timestamp.slice(0, 10);
    const fromMatches = filters.from ? recordDate >= filters.from : true;
    const toMatches = filters.to ? recordDate <= filters.to : true;
    return animalMatches && sexMatches && discardMatches && fromMatches && toMatches;
  });
}
