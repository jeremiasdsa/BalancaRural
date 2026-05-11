import { formatNumber } from "../../utils/format.js";
import { formatAgeCategory } from "./ageCategories.js";
import { formatManagementSummary } from "./managementInfo.js";

export function calculateSummary(records) {
  const all = calculateWeightStats(records);
  const male = calculateWeightStats(records.filter((record) => normalizeSex(record.sex) === "M"));
  const female = calculateWeightStats(records.filter((record) => normalizeSex(record.sex) === "F"));
  return {
    ...all,
    female,
    male
  };
}

function calculateWeightStats(records) {
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
      ageCategory: ordered[0].ageCategory ?? "",
      ageCategoryLabel: formatAgeCategory(ordered[0].ageCategory),
      managementSummary: formatManagementSummary(ordered[0]),
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
    ["Quantidade M", summary.male.quantity],
    ["Quantidade F", summary.female.quantity],
    ["Total", `${formatNumber(summary.total)} kg`],
    ["Total M", `${formatNumber(summary.male.total)} kg`],
    ["Total F", `${formatNumber(summary.female.total)} kg`],
    ["Menor peso", `${formatNumber(summary.min)} kg`],
    ["Menor peso M", `${formatNumber(summary.male.min)} kg`],
    ["Menor peso F", `${formatNumber(summary.female.min)} kg`],
    ["Maior peso", `${formatNumber(summary.max)} kg`],
    ["Maior peso M", `${formatNumber(summary.male.max)} kg`],
    ["Maior peso F", `${formatNumber(summary.female.max)} kg`],
    ["Média", `${formatNumber(summary.average)} kg`],
    ["Média M", `${formatNumber(summary.male.average)} kg`],
    ["Média F", `${formatNumber(summary.female.average)} kg`]
  ];
}

export function formatSex(sex) {
  const value = normalizeSex(sex);
  if (value === "M") return "M";
  if (value === "F") return "F";
  return "";
}

export function normalizeSex(sex) {
  const value = String(sex ?? "").trim().toUpperCase();
  return value === "M" || value === "F" ? value : "";
}
