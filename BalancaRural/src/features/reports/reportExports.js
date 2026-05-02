import { downloadCsv, downloadPdfReport } from "../../services/export/exporters.js";
import { formatDateTime, formatNumber } from "../../utils/format.js";
import { aggregateByAnimal, calculateSummary, getSummaryItems } from "../weight-records/weightStats.js";

export function getSummaryScopedRecords(records, selectedAnimal) {
  return selectedAnimal === "Todos"
    ? records
    : records.filter((record) => record.animalId === selectedAnimal);
}

export function exportDetailedCsv(records) {
  const rows = [
    ["Animal", "Data e hora", "Peso kg"],
    ...records.map((record) => [record.animalId, formatDateTime(record.timestamp), record.weight])
  ];
  downloadCsv("relatorio-detalhado.csv", rows);
}

export function exportSummaryCsv(records) {
  const rows = [
    ["Animal", "Quantidade", "Ultimo peso kg", "Maior kg", "Menor kg", "Media kg"],
    ...aggregateByAnimal(records).map((item) => [
      item.animalId,
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
        { label: "Animal", width: 18 },
        { label: "Data e hora", width: 22 },
        { label: "Peso", width: 14 }
      ],
      rows: records.map((record) => [
        record.animalId,
        formatDateTime(record.timestamp),
        `${formatNumber(record.weight)} kg`
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
        { label: "Animal", width: 18 },
        { label: "Pesagens", width: 10 },
        { label: "Último peso", width: 14 },
        { label: "Média", width: 14 }
      ],
      rows: aggregates.map((item) => [
        item.animalId,
        item.quantity,
        `${formatNumber(item.lastWeight)} kg`,
        `${formatNumber(item.average)} kg`
      ])
    }
  };
}
