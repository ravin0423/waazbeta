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

  // Add empty rows to fill the table area (min 10 rows total)
  const minRows = 10;
  const emptyRowsCount = Math.max(0, minRows - items.length);

  const lineItemsRows = items.map((li, idx) =>
    `<tr>
      <td style="text-align:center; padding:8px 6px; border-bottom:1px solid #eef1f5;">${idx + 1}</td>
      <td style="padding:8px 12px; border-bottom:1px solid #eef1f5;">${li.description}</td>
      <td style="text-align:right; padding:8px 12px; border-bottom:1px solid #eef1f5;">₹${fmt(Number(li.amount))}</td>
    </tr>`
  ).join('');

  const emptyRows = Array.from({ length: emptyRowsCount }, () =>
    `<tr class="empty-row">
      <td style="text-align:center; padding:8px 6px; border-bottom:1px solid #f0f2f5;">&nbsp;</td>
      <td style="padding:8px 12px; border-bottom:1px solid #f0f2f5;">&nbsp;</td>
      <td style="text-align:right; padding:8px 12px; border-bottom:1px solid #f0f2f5;">&nbsp;</td>
    </tr>`
  ).join('');

  const hasCgst = Number(inv.cgst_amount) > 0;
  const hasSgst = Number(inv.sgst_amount) > 0;
  const totalInWords = numberToWords(Number(inv.amount));

  return `<!DOCTYPE html>
<html><head>
<title>Invoice ${inv.invoice_number} — WaaZ</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --teal: #0e9a83;
    --teal-light: #e8f7f4;
    --teal-dark: #0a7d6a;
    --coral: #e8532e;
    --navy: #141b2d;
    --navy-light: #1e2a42;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: A4; margin: 15mm; }
  body { font-family: 'Plus Jakarta Sans', sans-serif; color: var(--navy); background: #eef1f5; padding: 0; font-size: 13px; line-height: 1.5; }
  
  .a4-page {
    width: 210mm; min-height: 297mm; margin: 20px auto; padding: 0;
    background: #fff; box-shadow: 0 4px 30px rgba(20,27,45,0.12);
    display: flex; flex-direction: column; overflow: hidden;
  }
  .invoice-container { flex: 1; display: flex; flex-direction: column; }

  /* === HEADER BANNER === */
  .inv-header-banner {
    background: linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 100%);
    color: #fff; padding: 24px 28px 20px; position: relative; overflow: hidden;
  }
  .inv-header-banner::after {
    content: ''; position: absolute; top: -40px; right: -40px;
    width: 160px; height: 160px; border-radius: 50%;
    background: var(--teal); opacity: 0.1;
  }
  .inv-header-top { display: flex; justify-content: space-between; align-items: flex-start; position: relative; z-index: 1; }
  .company-name { font-family: 'Space Grotesk', sans-serif; font-size: 34px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; }
  .company-tagline { font-size: 10px; color: rgba(255,255,255,0.6); margin-top: 2px; letter-spacing: 1.5px; text-transform: uppercase; }
  .inv-title-block { text-align: right; }
  .inv-title { font-family: 'Space Grotesk', sans-serif; font-size: 20px; font-weight: 700; letter-spacing: 2px; color: var(--teal); }
  .inv-title-sub { font-size: 10px; color: rgba(255,255,255,0.5); margin-top: 4px; letter-spacing: 1px; }

  /* === TEAL ACCENT BAR === */
  .accent-bar { height: 4px; background: linear-gradient(90deg, var(--teal), var(--coral)); }

  /* === INFO SECTION === */
  .inv-info-section { display: flex; border-bottom: 1px solid #e8ecf1; }
  .inv-info-left, .inv-info-right { flex: 1; padding: 14px 28px; }
  .inv-info-left { border-right: 1px solid #e8ecf1; }
  .info-row { display: flex; margin-bottom: 4px; align-items: baseline; }
  .info-label { font-weight: 700; min-width: 105px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #8892a4; }
  .info-value { font-size: 13px; font-weight: 500; color: var(--navy); }

  /* === BILL TO === */
  .bill-to { padding: 14px 28px; border-bottom: 1px solid #e8ecf1; }
  .bill-to-label { font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: var(--teal); margin-bottom: 4px; }
  .bill-to-name { font-family: 'Space Grotesk', sans-serif; font-size: 16px; font-weight: 600; color: var(--navy); }
  .bill-to-email { font-size: 12px; color: #8892a4; margin-top: 2px; }

  /* === ITEMS TABLE === */
  .items-table { width: 100%; border-collapse: collapse; }
  .items-table th { 
    background: var(--teal); color: #fff; font-family: 'Space Grotesk', sans-serif;
    font-size: 10px; text-transform: uppercase; letter-spacing: 1px;
    padding: 10px 12px; text-align: left; font-weight: 600;
  }
  .items-table th:first-child { text-align: center; width: 50px; }
  .items-table th:last-child { text-align: right; width: 130px; }
  .items-table td { font-size: 12px; border-bottom: 1px solid #eef1f5; }
  .items-table tr:nth-child(even) td { background: #fafbfc; }
  .items-table .empty-row td { border-bottom: 1px solid #f0f2f5; }

  /* === TOTALS === */
  .totals-section { display: flex; border-top: 2px solid var(--teal); }
  .totals-words { flex: 1; padding: 14px 28px; border-right: 1px solid #e8ecf1; background: var(--teal-light); }
  .totals-words-label { font-weight: 700; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: var(--teal-dark); margin-bottom: 4px; }
  .totals-words-text { font-size: 12px; font-style: italic; color: var(--navy); }
  .totals-numbers { width: 250px; padding: 0; }
  .total-row { display: flex; justify-content: space-between; padding: 7px 18px; font-size: 12px; color: #555; border-bottom: 1px solid #eef1f5; }
  .total-row:last-child { border-bottom: none; }
  .total-row.grand { 
    background: linear-gradient(135deg, var(--navy), var(--navy-light)); 
    color: #fff; font-weight: 700; font-family: 'Space Grotesk', sans-serif;
    font-size: 15px; padding: 10px 18px;
  }

  /* === NOTES === */
  .notes-section { padding: 12px 28px; border-top: 1px solid #e8ecf1; }
  .notes-label { font-weight: 700; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: var(--teal); }
  .notes-text { font-size: 11px; color: #666; margin-top: 3px; }

  /* === SIGNATURE === */
  .sig-footer { display: flex; justify-content: space-between; align-items: flex-end; padding: 24px 28px 20px; margin-top: auto; border-top: 1px solid #e8ecf1; }
  .sig-left { font-size: 10px; color: #aaa; line-height: 1.6; }
  .sig-right { text-align: right; }
  .sig-right img { max-height: 45px; margin-bottom: 4px; }
  .sig-label { font-size: 10px; color: #8892a4; border-top: 2px solid var(--navy); padding-top: 6px; margin-top: 6px; }
  .sig-company { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 14px; color: var(--navy); margin-top: 2px; }

  /* === FOOTER === */
  .footer-bar { 
    text-align: center; font-size: 9px; color: #fff; letter-spacing: 1px;
    padding: 10px 0; background: var(--navy);
  }
  .footer-bar span { color: var(--teal); }

  /* === PRINT BUTTON === */
  .no-print { text-align: center; padding: 16px 0; }
  .no-print button { 
    background: linear-gradient(135deg, var(--teal), var(--teal-dark)); color: #fff; border: none; 
    padding: 12px 44px; font-size: 14px; font-family: 'Space Grotesk', sans-serif;
    font-weight: 600; cursor: pointer; letter-spacing: 1px; text-transform: uppercase;
    border-radius: 6px; box-shadow: 0 4px 14px rgba(14,154,131,0.3);
  }
  .no-print button:hover { opacity: 0.9; }
  @media print { 
    .no-print { display: none !important; } 
    body { background: #fff; padding: 0; }
    .a4-page { width: 100%; min-height: auto; margin: 0; padding: 0; box-shadow: none; }
  }
</style>
</head>
<body>

<div class="no-print">
  <button onclick="window.print()">🖨️ Print Invoice</button>
</div>

<div class="a4-page">
<div class="invoice-container">
  <!-- Header Banner -->
  <div class="inv-header-banner">
    <div class="inv-header-top">
      <div>
        <div class="company-name">WaaZ</div>
        <div class="company-tagline">Gadget Protection Services</div>
      </div>
      <div class="inv-title-block">
        <div class="inv-title">TAX INVOICE</div>
        <div class="inv-title-sub">Original for Recipient</div>
      </div>
    </div>
  </div>
  <div class="accent-bar"></div>

  <!-- Invoice Info -->
  <div class="inv-info-section">
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

  <!-- Line Items -->
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
      ${emptyRows}
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

  <!-- Footer -->
  <div class="footer-bar"><span>WaaZ</span> Gadget Protection Services &bull; Thank you for your business</div>
</div>
</div>

</body></html>`;
}
