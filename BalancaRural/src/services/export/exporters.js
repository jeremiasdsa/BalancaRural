export function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map(escapeCsv).join(";")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  downloadBlob(filename, blob);
}

export function downloadPdfReport(filename, report) {
  const pdf = createPdf(report);
  const blob = new Blob([pdf], { type: "application/pdf" });
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
  const pageContents = createReportPageContents(report);
  const objects = [];
  const pageRefs = [];

  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = null;
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";

  pageContents.forEach((content, index) => {
    const pageObjectId = 5 + index * 2;
    const contentObjectId = pageObjectId + 1;
    pageRefs.push(`${pageObjectId} 0 R`);
    objects[pageObjectId] = [
      "<< /Type /Page",
      "/Parent 2 0 R",
      "/MediaBox [0 0 595 842]",
      "/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >>",
      `/Contents ${contentObjectId} 0 R`,
      ">>"
    ].join(" ");
    objects[contentObjectId] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
  });

  objects[2] = `<< /Type /Pages /Kids [${pageRefs.join(" ")}] /Count ${pageRefs.length} >>`;

  return serializePdf(objects);
}

function createReportPageContents(report) {
  const summary = new Map(report.summaryItems ?? []);
  const rows = report.rows ?? [];
  const pages = [];
  let commands = [];
  let y = 0;
  let tableColumns = [];

  const value = (label, fallback = "-") => String(summary.get(label) ?? fallback);

  const startPage = (continuation = false) => {
    commands = [];
    drawFilledRect(commands, 0, 800, 595, 42, [0, 0.69, 0.25]);
    drawText(commands, "BR", 42, 815, 16, "F2", [1, 1, 1]);
    drawText(commands, continuation ? `${report.title} - continuacao` : report.title, 42, 770, 22, "F2", [0.05, 0.09, 0.16]);
    drawText(commands, report.subtitle || "Relatorio", 42, 748, 12, "F1", [0.4, 0.45, 0.53]);
    y = 715;
  };

  const finishPage = () => {
    drawText(commands, `Pagina ${pages.length + 1}`, 508, 30, 9, "F1", [0.55, 0.6, 0.68]);
    pages.push(commands.join("\n"));
  };

  const drawSummary = () => {
    const cardGap = 10;
    const cardWidth = (511 - cardGap * 2) / 3;
    drawMetricCard(commands, 42, y, cardWidth, 62, "Total de animais", value("Quantidade", "0"));
    drawMetricCard(commands, 42 + cardWidth + cardGap, y, cardWidth, 62, "Peso total", value("Total", "0 kg"));
    drawMetricCard(commands, 42 + (cardWidth + cardGap) * 2, y, cardWidth, 62, "Media geral", value("Média", "0 kg"));
    y -= 88;

    drawText(commands, "Distribuicao por sexo", 42, y, 14, "F2", [0.05, 0.09, 0.16]);
    y -= 18;
    drawSexCard(commands, 42, y, 247, "Machos", value("Quantidade M", "0"), value("Total M", "0 kg"), value("Média M", "0 kg"), [0, 0.69, 0.25]);
    drawSexCard(commands, 306, y, 247, "Femeas", value("Quantidade F", "0"), value("Total F", "0 kg"), value("Média F", "0 kg"), [0.49, 0.33, 0.78]);
    y -= 112;

    drawText(commands, "Estatisticas de peso", 42, y, 14, "F2", [0.05, 0.09, 0.16]);
    y -= 18;
    drawWeightStats(commands, 42, y, 511, {
      min: value("Menor peso", "0 kg"),
      max: value("Maior peso", "0 kg"),
      maleMin: value("Menor peso M", "0 kg"),
      maleMax: value("Maior peso M", "0 kg"),
      femaleMin: value("Menor peso F", "0 kg"),
      femaleMax: value("Maior peso F", "0 kg")
    });
    y -= 118;
  };

  const drawTableHeader = () => {
    tableColumns = getTableColumns(report.columns ?? []);
    drawText(commands, `Animais registrados (${rows.length})`, 42, y, 15, "F2", [0.05, 0.09, 0.16]);
    y -= 22;
    drawFilledRect(commands, 42, y - 24, 511, 30, [0.93, 0.97, 0.94]);

    let x = 52;
    tableColumns.forEach((column) => {
      drawText(commands, column.label, x, y - 14, 9, "F2", [0, 0.46, 0.17]);
      x += column.width;
    });
    y -= 32;
  };

  startPage(false);
  drawSummary();
  drawTableHeader();

  if (!rows.length) {
    drawText(commands, "Nenhum registro encontrado.", 52, y - 18, 11, "F1", [0.4, 0.45, 0.53]);
    finishPage();
    return pages;
  }

  rows.forEach((row, rowIndex) => {
    const prepared = prepareTableRow(row, tableColumns);
    const rowHeight = Math.max(34, prepared.lineCount * 13 + 18);

    if (y - rowHeight < 55) {
      finishPage();
      startPage(true);
      drawTableHeader();
    }

    if (rowIndex % 2 === 0) drawFilledRect(commands, 42, y - rowHeight + 4, 511, rowHeight, [0.99, 1, 0.99]);
    drawStrokeLine(commands, 42, y - rowHeight + 4, 553, y - rowHeight + 4, [0.88, 0.9, 0.93]);

    let x = 52;
    prepared.cells.forEach((cell, cellIndex) => {
      const isWeight = tableColumns[cellIndex]?.label === "Peso";
      cell.lines.forEach((line, lineIndex) => {
        drawText(
          commands,
          line,
          x,
          y - 14 - lineIndex * 13,
          isWeight ? 10 : 9.5,
          isWeight ? "F2" : "F1",
          isWeight ? [0, 0.58, 0.21] : [0.23, 0.28, 0.36]
        );
      });
      x += tableColumns[cellIndex].width;
    });

    y -= rowHeight;
  });

  finishPage();
  return pages;
}

function getTableColumns(columns) {
  const tableWidth = 511;
  const total = columns.reduce((sum, column) => sum + (column.width || 1), 0) || 1;
  return columns.map((column) => ({
    label: column.label,
    width: Math.round((column.width || 1) / total * tableWidth)
  }));
}

function prepareTableRow(row, columns) {
  const cells = columns.map((column, index) => ({
    lines: wrapPdfText(row[index], Math.max(8, Math.floor(column.width / 5.3)), index === columns.length - 1 ? 2 : 1)
  }));
  return {
    cells,
    lineCount: Math.max(...cells.map((cell) => cell.lines.length))
  };
}

function drawMetricCard(commands, x, y, width, height, label, value) {
  drawFilledRect(commands, x, y - height, width, height, [1, 1, 1]);
  drawStrokedRect(commands, x, y - height, width, height, [0.88, 0.9, 0.93]);
  drawText(commands, label, x + 12, y - 22, 10, "F2", [0.42, 0.46, 0.54]);
  drawText(commands, value, x + 12, y - 45, 18, "F2", [0.05, 0.09, 0.16]);
  drawFilledRect(commands, x + 12, y - height + 10, width - 24, 4, [0.81, 0.94, 0.85]);
}

function drawSexCard(commands, x, y, width, title, quantity, total, average, color) {
  drawFilledRect(commands, x, y - 90, width, 90, [1, 1, 1]);
  drawStrokedRect(commands, x, y - 90, width, 90, [0.88, 0.9, 0.93]);
  drawFilledRect(commands, x, y - 28, width, 28, color.map((item) => 0.92 + item * 0.08));
  drawText(commands, title, x + 12, y - 18, 12, "F2", color);
  drawText(commands, quantity, x + width - 30, y - 18, 12, "F2", color);
  drawText(commands, "Quantidade", x + 12, y - 45, 9.5, "F1", [0.42, 0.46, 0.54]);
  drawText(commands, quantity, x + width - 42, y - 45, 10, "F2", color);
  drawText(commands, "Peso total", x + 12, y - 62, 9.5, "F1", [0.42, 0.46, 0.54]);
  drawText(commands, total, x + width - 62, y - 62, 10, "F2", color);
  drawText(commands, "Media", x + 12, y - 79, 9.5, "F1", [0.42, 0.46, 0.54]);
  drawText(commands, average, x + width - 62, y - 79, 10, "F2", color);
}

function drawWeightStats(commands, x, y, width, stats) {
  drawFilledRect(commands, x, y - 92, width, 92, [1, 1, 1]);
  drawStrokedRect(commands, x, y - 92, width, 92, [0.88, 0.9, 0.93]);
  drawStrokeLine(commands, x + width / 2, y, x + width / 2, y - 92, [0.88, 0.9, 0.93]);
  drawStrokeLine(commands, x, y - 44, x + width, y - 44, [0.88, 0.9, 0.93]);
  drawText(commands, "Menor peso", x + 14, y - 18, 10, "F2", [0.42, 0.46, 0.54]);
  drawText(commands, stats.min, x + 14, y - 37, 16, "F2", [0, 0.69, 0.25]);
  drawText(commands, "Maior peso", x + width / 2 + 14, y - 18, 10, "F2", [0.42, 0.46, 0.54]);
  drawText(commands, stats.max, x + width / 2 + 14, y - 37, 16, "F2", [0, 0.69, 0.25]);
  drawText(commands, `Machos  Menor: ${stats.maleMin}  Maior: ${stats.maleMax}`, x + 14, y - 66, 10, "F2", [0, 0.69, 0.25]);
  drawText(commands, `Femeas  Menor: ${stats.femaleMin}  Maior: ${stats.femaleMax}`, x + width / 2 + 14, y - 66, 10, "F2", [0.49, 0.33, 0.78]);
}

function drawText(commands, value, x, y, size, font, color) {
  commands.push(`${formatColor(color)} rg`);
  commands.push(`BT /${font} ${size} Tf ${x} ${y} Td (${escapePdfText(value)}) Tj ET`);
}

function drawFilledRect(commands, x, y, width, height, color) {
  commands.push(`${formatColor(color)} rg`);
  commands.push(`${x} ${y} ${width} ${height} re f`);
}

function drawStrokedRect(commands, x, y, width, height, color) {
  commands.push(`${formatColor(color)} RG`);
  commands.push(`${x} ${y} ${width} ${height} re S`);
}

function drawStrokeLine(commands, x1, y1, x2, y2, color) {
  commands.push(`${formatColor(color)} RG`);
  commands.push(`${x1} ${y1} m ${x2} ${y2} l S`);
}

function formatColor(color) {
  return color.map((channel) => Number(channel).toFixed(3)).join(" ");
}

function wrapPdfText(value, maxLength, maxLines) {
  const words = normalizePdfText(value).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxLength) {
      current = next;
      return;
    }
    if (current) lines.push(current);
    current = word.length > maxLength ? word.slice(0, maxLength) : word;
  });

  if (current) lines.push(current);
  if (!lines.length) lines.push("-");
  if (lines.length > maxLines) {
    const visible = lines.slice(0, maxLines);
    visible[maxLines - 1] = `${visible[maxLines - 1].slice(0, Math.max(0, maxLength - 3))}...`;
    return visible;
  }
  return lines;
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
