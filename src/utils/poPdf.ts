// src/utils/poPdf.ts
import PDFDocument from 'pdfkit';

export function generatePoPdf(po: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 36 });
    const chunks: Buffer[] = [];
    doc.on('data', (d) => chunks.push(d));
    doc.on('error', reject);
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    doc.fontSize(16).text(`Purchase Order: ${po.po_no}`, { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10)
      .text(`Vendor: ${po.vendor_name || po.vendor_id || ''}`)
      .text(`PO Date: ${po.po_date ? new Date(po.po_date).toDateString() : ''}`)
      .text(`Expected: ${po.expected_date ? new Date(po.expected_date).toDateString() : ''}`)
      .text(`Currency: ${po.currency}`);

    doc.moveDown();
    doc.fontSize(12).text('Lines');
    doc.moveDown(0.3);

    doc.fontSize(10).text('SKU', 36, doc.y, { continued: true, width: 140 })
      .text('Ordered', { continued: true, width: 80, align: 'right' })
      .text('Unit Cost', { continued: true, width: 100, align: 'right' })
      .text('Tax %', { continued: true, width: 80, align: 'right' })
      .text('MRP', { width: 80, align: 'right' });
    doc.moveDown(0.2);
    doc.moveTo(36, doc.y).lineTo(559, doc.y).stroke();
    doc.moveDown(0.2);

    (po.lines || []).forEach((l: any) => {
      doc.text(l.sku, 36, doc.y, { continued: true, width: 140 })
        .text(String(l.ordered_qty), { continued: true, width: 80, align: 'right' })
        .text(Number(l.unit_cost).toFixed(2), { continued: true, width: 100, align: 'right' })
        .text(String(l.tax_pct || 0), { continued: true, width: 80, align: 'right' })
        .text(l.mrp != null ? Number(l.mrp).toFixed(2) : '-', { width: 80, align: 'right' });
    });

    doc.moveDown();
    const totals = po.totals || {};
    doc.fontSize(12).text('Totals', 36, doc.y);
    doc.fontSize(10)
      .text(`Subtotal: ${Number(totals.subtotal || 0).toFixed(2)}`)
      .text(`Tax: ${Number(totals.tax || 0).toFixed(2)}`)
      .text(`Grand Total: ${Number(totals.grandTotal || 0).toFixed(2)}`);

    doc.end();
  });
}