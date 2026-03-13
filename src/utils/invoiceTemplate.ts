import { format } from 'date-fns';
import { numberToWords } from './numberToWords';

interface InvoiceLineItem {
  description: string;
  amount: number;
}

interface InvoiceData {
  invoice_number: string;
  created_at: string;
  due_date?: string | null;
  status: string;
  customer_name: string;
  customer_email?: string | null;
  subtotal: number;
  cgst_percent: number;
  sgst_percent: number;
  cgst_amount: number;
  sgst_amount: number;
  amount: number;
  notes?: string | null;
  line_item_description?: string | null;
  invoice_line_items?: InvoiceLineItem[];
}

export function generateInvoiceHtml(inv: InvoiceData, signatureUrl?: string | null): string {
  const items: InvoiceLineItem[] = (inv.invoice_line_items && inv.invoice_line_items.length > 0)
    ? inv.invoice_line_items
    : [{ description: inv.line_item_description || 'Service / Subscription', amount: Number(inv.subtotal || inv.amount) }];

  const fmt = (n: number) => Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const lineItemsRows = items.map((li, idx) =>
    `<tr>
      <td style="text-align:center; border:1px solid #000; padding:8px 6px;">${idx + 1}</td>
      <td style="border:1px solid #000; padding:8px 10px;">${li.description}</td>
      <td style="text-align:right; border:1px solid #000; padding:8px 10px;">₹${fmt(Number(li.amount))}</td>
    </tr>`
  ).join('');

  const hasCgst = Number(inv.cgst_amount) > 0;
  const hasSgst = Number(inv.sgst_amount) > 0;
  const totalInWords = numberToWords(Number(inv.amount));

  return `<!DOCTYPE html>
<html><head>
<title>Invoice ${inv.invoice_number} — WaaZ</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: A4; margin: 12mm; }
  body { font-family: 'Arial', 'Helvetica Neue', sans-serif; color: #000; background: #fff; padding: 0; font-size: 13px; line-height: 1.5; }
  .invoice-container { max-width: 800px; margin: 0 auto; padding: 24px; }
  
  /* Header */
  .inv-header { border: 2px solid #000; padding: 0; margin-bottom: 0; }
  .inv-header-top { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #000; }
  .company-name { font-size: 32px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; }
  .company-tagline { font-size: 11px; color: #333; margin-top: 2px; letter-spacing: 1px; }
  .inv-title { font-size: 20px; font-weight: 700; letter-spacing: 2px; text-align: right; }
  
  /* Info grid */
  .inv-info { display: flex; border-bottom: 1px solid #000; }
  .inv-info-left, .inv-info-right { flex: 1; padding: 12px 20px; }
  .inv-info-left { border-right: 1px solid #000; }
  .info-row { display: flex; margin-bottom: 4px; }
  .info-label { font-weight: 700; min-width: 110px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
  .info-value { font-size: 13px; }

  /* Bill To */
  .bill-to { padding: 12px 20px; border-bottom: 1px solid #000; }
  .bill-to-label { font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .bill-to-name { font-size: 15px; font-weight: 600; }
  .bill-to-email { font-size: 12px; color: #333; }

  /* Items table */
  .items-table { width: 100%; border-collapse: collapse; }
  .items-table th { 
    background: #000; color: #fff; font-size: 12px; text-transform: uppercase; 
    letter-spacing: 0.5px; padding: 10px; text-align: left; font-weight: 600;
  }
  .items-table th:first-child { text-align: center; width: 50px; }
  .items-table th:last-child { text-align: right; width: 140px; }
  .items-table td { font-size: 13px; }

  /* Totals */
  .totals-section { display: flex; border: 1px solid #000; border-top: none; }
  .totals-words { flex: 1; padding: 12px 20px; border-right: 1px solid #000; }
  .totals-words-label { font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .totals-words-text { font-size: 13px; font-style: italic; }
  .totals-numbers { width: 280px; padding: 0; }
  .total-row { display: flex; justify-content: space-between; padding: 6px 16px; border-bottom: 1px solid #ddd; font-size: 13px; }
  .total-row:last-child { border-bottom: none; }
  .total-row.grand { background: #000; color: #fff; font-weight: 700; font-size: 15px; padding: 10px 16px; }

  /* Notes */
  .notes-section { border: 1px solid #000; border-top: none; padding: 12px 20px; }
  .notes-label { font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
  .notes-text { font-size: 12px; color: #333; margin-top: 4px; }

  /* Signature & Footer */
  .sig-footer { display: flex; justify-content: space-between; align-items: flex-end; border: 1px solid #000; border-top: none; padding: 20px; min-height: 100px; }
  .sig-left { font-size: 11px; color: #666; }
  .sig-right { text-align: right; }
  .sig-right img { max-height: 50px; margin-bottom: 4px; }
  .sig-label { font-size: 11px; color: #333; border-top: 1px solid #000; padding-top: 4px; margin-top: 4px; }
  .sig-company { font-weight: 700; font-size: 13px; margin-top: 2px; }

  .footer-bar { text-align: center; font-size: 10px; color: #666; padding: 10px 0; margin-top: 16px; border-top: 2px solid #000; letter-spacing: 0.5px; }

  /* Print */
  .no-print { margin: 20px auto; text-align: center; }
  .no-print button { 
    background: #000; color: #fff; border: none; padding: 12px 40px; font-size: 14px; 
    font-weight: 600; cursor: pointer; letter-spacing: 1px; text-transform: uppercase;
  }
  .no-print button:hover { background: #333; }
  @media print { 
    .no-print { display: none !important; } 
    body { padding: 0; }
    .invoice-container { padding: 0; }
  }
</style>
</head>
<body>

<div class="no-print">
  <button onclick="window.print()">🖨️ Print Invoice</button>
</div>

<div class="invoice-container">
  <!-- Header -->
  <div class="inv-header">
    <div class="inv-header-top">
      <div>
        <div class="company-name">WaaZ</div>
        <div class="company-tagline">Device Protection Services</div>
      </div>
      <div class="inv-title">TAX INVOICE</div>
    </div>

    <!-- Invoice info -->
    <div class="inv-info">
      <div class="inv-info-left">
        <div class="info-row"><span class="info-label">Invoice No.</span><span class="info-value" style="font-weight:700">${inv.invoice_number}</span></div>
        <div class="info-row"><span class="info-label">Invoice Date</span><span class="info-value">${format(new Date(inv.created_at), 'dd/MM/yyyy')}</span></div>
        ${inv.due_date ? `<div class="info-row"><span class="info-label">Due Date</span><span class="info-value">${format(new Date(inv.due_date), 'dd/MM/yyyy')}</span></div>` : ''}
      </div>
      <div class="inv-info-right">
        <div class="info-row"><span class="info-label">Status</span><span class="info-value" style="font-weight:700; text-transform:uppercase">${inv.status}</span></div>
        <div class="info-row"><span class="info-label">Place of Supply</span><span class="info-value">India</span></div>
      </div>
    </div>

    <!-- Bill To -->
    <div class="bill-to">
      <div class="bill-to-label">Bill To</div>
      <div class="bill-to-name">${inv.customer_name}</div>
      ${inv.customer_email ? `<div class="bill-to-email">${inv.customer_email}</div>` : ''}
    </div>
  </div>

  <!-- Line items -->
  <table class="items-table">
    <thead>
      <tr>
        <th style="text-align:center">S.No</th>
        <th>Description of Services</th>
        <th style="text-align:right">Amount (₹)</th>
      </tr>
    </thead>
    <tbody>
      ${lineItemsRows}
    </tbody>
  </table>

  <!-- Totals -->
  <div class="totals-section">
    <div class="totals-words">
      <div class="totals-words-label">Amount in Words</div>
      <div class="totals-words-text">${totalInWords}</div>
    </div>
    <div class="totals-numbers">
      <div class="total-row"><span>Subtotal</span><span>₹${fmt(Number(inv.subtotal || inv.amount))}</span></div>
      ${hasCgst ? `<div class="total-row"><span>CGST @ ${inv.cgst_percent}%</span><span>₹${fmt(Number(inv.cgst_amount))}</span></div>` : ''}
      ${hasSgst ? `<div class="total-row"><span>SGST @ ${inv.sgst_percent}%</span><span>₹${fmt(Number(inv.sgst_amount))}</span></div>` : ''}
      <div class="total-row grand"><span>TOTAL</span><span>₹${fmt(Number(inv.amount))}</span></div>
    </div>
  </div>

  <!-- Notes -->
  ${inv.notes ? `
  <div class="notes-section">
    <div class="notes-label">Notes / Terms</div>
    <div class="notes-text">${inv.notes}</div>
  </div>` : ''}

  <!-- Signature -->
  <div class="sig-footer">
    <div class="sig-left">
      This is a computer-generated invoice.<br/>
      No physical signature required.
    </div>
    <div class="sig-right">
      ${signatureUrl ? `<img src="${signatureUrl}" alt="Signature" />` : ''}
      <div class="sig-label">Authorized Signatory</div>
      <div class="sig-company">WaaZ</div>
    </div>
  </div>

  <div class="footer-bar">WaaZ Device Protection Services &bull; Thank you for your business</div>
</div>

</body></html>`;
}
