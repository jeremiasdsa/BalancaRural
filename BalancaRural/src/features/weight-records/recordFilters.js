export function filterWeightRecords(records, filters) {
  return records.filter((record) => {
    const animalMatches = filters.animalId
      ? record.animalId.toLowerCase().includes(filters.animalId.toLowerCase())
      : true;
    const recordDate = record.timestamp.slice(0, 10);
    const fromMatches = filters.from ? recordDate >= filters.from : true;
    const toMatches = filters.to ? recordDate <= filters.to : true;
    return animalMatches && fromMatches && toMatches;
  });
}
