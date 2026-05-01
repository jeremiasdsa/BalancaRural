export function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map(escapeCsv).join(";")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  downloadBlob(filename, blob);
}

export function downloadPdfReport(filename, report) {
  const pdf = createPdf(report);
  const blob = new Blob([pdf], { type: "application/octet-stream" });
  downloadBlob(filename, blob);
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (/[;"\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function createPdf(report) {
  const pageLines = paginateReport(report);
  const objects = [];
  const pageRefs = [];
  const fontObjectId = 3;

  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = null;
  objects[fontObjectId] = "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>";

  pageLines.forEach((lines, index) => {
    const pageObjectId = 4 + index * 2;
    const contentObjectId = pageObjectId + 1;
    const content = createPageContent(lines);
    pageRefs.push(`${pageObjectId} 0 R`);
    objects[pageObjectId] = [
      "<< /Type /Page",
      "/Parent 2 0 R",
      "/MediaBox [0 0 595 842]",
      `/Resources << /Font << /F1 ${fontObjectId} 0 R >> >>`,
      `/Contents ${contentObjectId} 0 R`,
      ">>"
    ].join(" ");
    objects[contentObjectId] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
  });

  objects[2] = `<< /Type /Pages /Kids [${pageRefs.join(" ")}] /Count ${pageRefs.length} >>`;

  return serializePdf(objects);
}

function paginateReport(report) {
  const title = normalizePdfText(report.title);
  const subtitle = normalizePdfText(report.subtitle ?? "");
  const summary = report.summaryItems.map(([label, value]) => `${label}: ${value}`);
  const header = report.columns.map((column) => padText(column.label, column.width)).join(" ");
  const separator = report.columns.map((column) => "-".repeat(column.width)).join(" ");
  const rows = report.rows.map((row) =>
    report.columns.map((column, index) => padText(row[index], column.width)).join(" ")
  );
  const firstPagePrefix = [
    title,
    subtitle,
    "",
    ...chunkSummary(summary),
    "",
    header,
    separator
  ];
  const nextPagePrefix = [
    `${title} (continuacao)`,
    "",
    header,
    separator
  ];
  const pages = [];
  let current = [...firstPagePrefix];
  const maxLines = 48;

  rows.forEach((row) => {
    if (current.length >= maxLines) {
      pages.push(current);
      current = [...nextPagePrefix];
    }
    current.push(row);
  });

  if (current.length) pages.push(current);
  return pages.length ? pages : [[title, subtitle, "", "Nenhum registro encontrado."]];
}

function chunkSummary(summaryItems) {
  const lines = [];
  for (let index = 0; index < summaryItems.length; index += 2) {
    lines.push([summaryItems[index], summaryItems[index + 1]].filter(Boolean).join(" | "));
  }
  return lines;
}

function createPageContent(lines) {
  const commands = [
    "BT",
    "/F1 10 Tf",
    "14 TL",
    "40 802 Td"
  ];

  lines.forEach((line, index) => {
    if (index) commands.push("T*");
    commands.push(`(${escapePdfText(line)}) Tj`);
  });

  commands.push("ET");
  return commands.join("\n");
}

function serializePdf(objects) {
  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (let index = 1; index < objects.length; index += 1) {
    offsets[index] = pdf.length;
    pdf += `${index} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;

  for (let index = 1; index < objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += [
    "trailer",
    `<< /Size ${objects.length} /Root 1 0 R >>`,
    "startxref",
    String(xrefOffset),
    "%%EOF"
  ].join("\n");

  return pdf;
}

function padText(value, width) {
  const text = normalizePdfText(value);
  if (text.length > width) return `${text.slice(0, Math.max(0, width - 3))}...`;
  return text.padEnd(width, " ");
}

function normalizePdfText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .trim();
}

function escapePdfText(value) {
  return normalizePdfText(value)
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
}
