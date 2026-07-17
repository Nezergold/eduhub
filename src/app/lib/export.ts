import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import { saveAs } from "file-saver";
import type { ExportColumn, ExportFormat } from "./types";
import { INSTITUTION_NAME } from "./types";

export interface ExportOptions {
  title: string;
  filename: string;
  columns: ExportColumn[];
  rows: Record<string, string | number>[];
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w\-]+/g, "_").slice(0, 80);
}

function cellValue(row: Record<string, string | number>, key: string): string {
  const v = row[key];
  return v === undefined || v === null ? "" : String(v);
}

export function exportToCsv(options: ExportOptions): void {
  const header = options.columns.map(c => c.header).join(",");
  const body = options.rows.map(row =>
    options.columns.map(c => `"${cellValue(row, c.key).replace(/"/g, '""')}"`).join(",")
  );
  const csv = [header, ...body].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, `${sanitizeFilename(options.filename)}.csv`);
}

export function exportToPdf(options: ExportOptions): void {
  const doc = new jsPDF({ orientation: options.columns.length > 6 ? "landscape" : "portrait" });
  doc.setFontSize(14);
  doc.text(INSTITUTION_NAME, 14, 16);
  doc.setFontSize(11);
  doc.text(options.title, 14, 24);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

  autoTable(doc, {
    startY: 36,
    head: [options.columns.map(c => c.header)],
    body: options.rows.map(row => options.columns.map(c => cellValue(row, c.key))),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [92, 26, 46] },
  });

  doc.save(`${sanitizeFilename(options.filename)}.pdf`);
}

export async function exportToDocx(options: ExportOptions): Promise<void> {
  const headerRow = new TableRow({
    children: options.columns.map(
      c => new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: c.header, bold: true })] })],
        width: { size: 100 / options.columns.length, type: WidthType.PERCENTAGE },
      })
    ),
  });

  const dataRows = options.rows.map(
    row =>
      new TableRow({
        children: options.columns.map(
          c =>
            new TableCell({
              children: [new Paragraph(cellValue(row, c.key))],
            })
        ),
      })
  );

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ children: [new TextRun({ text: INSTITUTION_NAME, bold: true, size: 28 })] }),
          new Paragraph({ children: [new TextRun({ text: options.title, size: 24 })] }),
          new Paragraph({ text: `Generated: ${new Date().toLocaleString()}` }),
          new Paragraph({ text: "" }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [headerRow, ...dataRows],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${sanitizeFilename(options.filename)}.docx`);
}

export async function exportData(format: ExportFormat, options: ExportOptions): Promise<void> {
  if (format === "csv") {
    exportToCsv(options);
    return;
  }
  if (format === "pdf") {
    exportToPdf(options);
    return;
  }
  await exportToDocx(options);
}

export function rowsFromObjects<T extends object>(
  items: T[],
  columns: ExportColumn[],
  mapper?: (item: T) => Record<string, string | number>
): Record<string, string | number>[] {
  return items.map(item => {
    const base = mapper ? mapper(item) : (item as Record<string, string | number>);
    const row: Record<string, string | number> = {};
    columns.forEach(c => {
      row[c.key] = base[c.key] ?? "";
    });
    return row;
  });
}
