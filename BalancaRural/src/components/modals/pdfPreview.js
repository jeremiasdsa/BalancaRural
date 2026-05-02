import { icons } from "../icons/icons.js";
import { escapeHtml } from "../../utils/html.js";

export function renderPdfPreview(pdfPreview) {
  const report = pdfPreview.report;

  return `
    <div class="preview-backdrop">
      <section class="pdf-preview" role="dialog" aria-modal="true" aria-labelledby="pdf-preview-title">
        <header class="preview-header">
          <div>
            <h2 id="pdf-preview-title">${escapeHtml(report.title)}</h2>
            <p>${escapeHtml(report.subtitle || "Relatório")}</p>
          </div>
          <button class="btn ghost small" type="button" data-action="close-pdf-preview">Fechar</button>
        </header>

        <div class="preview-actions">
          <button class="btn green" type="button" data-action="download-pdf-preview">${icons.check} Baixar PDF</button>
        </div>

        <div class="preview-page">
          <h3>${escapeHtml(report.title)}</h3>
          <p>${escapeHtml(report.subtitle || "")}</p>
          <div class="preview-summary">
            ${report.summaryItems.map(([label, value]) => `
              <div>
                <span>${escapeHtml(label)}</span>
                <strong>${escapeHtml(value)}</strong>
              </div>
            `).join("")}
          </div>
          <div class="preview-table-wrap">
            <table class="preview-table">
              <thead>
                <tr>${report.columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("")}</tr>
              </thead>
              <tbody>
                ${
                  report.rows.length
                    ? report.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")
                    : `<tr><td colspan="${report.columns.length}">Nenhum registro encontrado.</td></tr>`
                }
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  `;
}
