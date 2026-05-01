export function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map(escapeCsv).join(";")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  downloadBlob(filename, blob);
}

export function printReport(title, html) {
  const win = window.open("", "_blank");
  if (!win) return;

  win.document.write(`
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111; padding: 24px; }
          h1 { font-size: 22px; margin: 0 0 16px; }
          table { width: 100%; border-collapse: collapse; margin: 16px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f2f3f5; }
          .summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .summary div { border: 1px solid #ddd; padding: 10px; }
        </style>
      </head>
      <body>${html}</body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
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
  link.click();
  URL.revokeObjectURL(url);
}
