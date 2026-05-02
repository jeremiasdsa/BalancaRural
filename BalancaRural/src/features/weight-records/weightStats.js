import { formatNumber } from "../../utils/format.js";

export function calculateSummary(records) {
  const weights = records.map((record) => record.weight);
  const total = weights.reduce((sum, weight) => sum + weight, 0);

  return {
    quantity: records.length,
    max: weights.length ? Math.max(...weights) : 0,
    min: weights.length ? Math.min(...weights) : 0,
    average: weights.length ? total / weights.length : 0,
    total
  };
}

export function aggregateByAnimal(records) {
  const groups = new Map();

  records.forEach((record) => {
    if (!groups.has(record.animalId)) groups.set(record.animalId, []);
    groups.get(record.animalId).push(record);
  });

  return [...groups.entries()].map(([animalId, items]) => {
    const ordered = [...items].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const summary = calculateSummary(items);
    return {
      animalId,
      quantity: summary.quantity,
      lastWeight: ordered[0].weight,
      max: summary.max,
      min: summary.min,
      average: summary.average
    };
  });
}

export function getSummaryItems(summary) {
  return [
    ["Quantidade", summary.quantity],
    ["Maior peso", `${formatNumber(summary.max)} kg`],
    ["Menor peso", `${formatNumber(summary.min)} kg`],
    ["Média", `${formatNumber(summary.average)} kg`],
    ["Total", `${formatNumber(summary.total)} kg`]
  ];
}
