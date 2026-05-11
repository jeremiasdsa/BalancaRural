import { downloadCsv, downloadPdfReport } from "../../services/export/exporters.js";
import { formatDateTime, formatNumber } from "../../utils/format.js";
import { formatAgeCategory } from "../weight-records/ageCategories.js";
import { formatDiscard, formatEarring, formatManagementSummary, formatVaccines } from "../weight-records/managementInfo.js";
import { aggregateByAnimal, calculateSummary, formatSex, getSummaryItems } from "../weight-records/weightStats.js";

export function getSummaryScopedRecords(records, selectedAnimal) {
  return selectedAnimal === "Todos"
    ? records
    : records.filter((record) => record.animalId === selectedAnimal);
}

export function exportDetailedCsv(records) {
  const rows = [
    ["Animal", "Sexo", "Peso kg", "Idade", "Descarte", "Ferro", "Brinco", "Vacinas", "Data", "Info"],
    ...records.map((record) => [
      record.animalId,
      record.sex ?? "",
      record.weight,
      formatAgeCategory(record.ageCategory),
      formatDiscard(record.discard),
      record.iron ?? "",
      formatEarring(record.earring),
      formatVaccines(record.vaccines, record.vaccineNotes),
      formatDateTime(record.timestamp),
      record.info ?? ""
    ])
  ];
  downloadCsv("relatorio-detalhado.csv", rows);
}

export function exportSummaryCsv(records) {
  const rows = [
    ["Animal", "Idade", "Manejo", "Quantidade", "Ultimo peso kg", "Maior kg", "Menor kg", "Media kg"],
    ...aggregateByAnimal(records).map((item) => [
      item.animalId,
      item.ageCategoryLabel,
      item.managementSummary,
      item.quantity,
      item.lastWeight,
      item.max,
      item.min,
      item.average.toFixed(1)
    ])
  ];
  downloadCsv("relatorio-resumido.csv", rows);
}

export function downloadPdfPreview(pdfPreview) {
  if (!pdfPreview) return;
  downloadPdfReport(pdfPreview.filename, pdfPreview.report);
}

export function createDetailedPdfPreview({ activeProperty, records }) {
  const summary = calculateSummary(records);
  return {
    filename: "relatorio-detalhado.pdf",
    report: {
      title: "Relatório Detalhado",
      subtitle: activeProperty?.name ?? "",
      summaryItems: getSummaryItems(summary),
      columns: [
        { label: "Animal", width: 9 },
        { label: "Sexo", width: 6 },
        { label: "Peso", width: 8 },
        { label: "Idade", width: 16 },
        { label: "Descarte", width: 9 },
        { label: "Ferro", width: 8 },
        { label: "Brinco", width: 8 },
        { label: "Vacinas", width: 18 },
        { label: "Data", width: 12 },
        { label: "Info", width: 10 }
      ],
      rows: records.map((record) => [
        record.animalId,
        formatSex(record.sex),
        `${formatNumber(record.weight)} kg`,
        formatAgeCategory(record.ageCategory),
        formatDiscard(record.discard),
        record.iron ?? "",
        formatEarring(record.earring),
        formatVaccines(record.vaccines, record.vaccineNotes),
        formatDateTime(record.timestamp),
        record.info ?? ""
      ])
    }
  };
}

export function createSummaryPdfPreview({ activeProperty, records }) {
  const aggregates = aggregateByAnimal(records);
  const summary = calculateSummary(records);
  return {
    filename: "relatorio-resumido.pdf",
    report: {
      title: "Relatório Resumido",
      subtitle: activeProperty?.name ?? "",
      summaryItems: getSummaryItems(summary),
      columns: [
        { label: "Animal", width: 16 },
        { label: "Idade", width: 18 },
        { label: "Manejo", width: 24 },
        { label: "Pesagens", width: 10 },
        { label: "Último peso", width: 14 },
        { label: "Média", width: 14 }
      ],
      rows: aggregates.map((item) => [
        item.animalId,
        item.ageCategoryLabel,
        item.managementSummary,
        item.quantity,
        `${formatNumber(item.lastWeight)} kg`,
        `${formatNumber(item.average)} kg`
      ])
    }
  };
}
