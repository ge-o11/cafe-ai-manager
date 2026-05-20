export interface PrintReceiptData {
  cafeName: string;
  tableNumber: number;
  items: { name: string; quantity: number; unitPrice: number; notes?: string | null }[];
  total: number;
  paymentLabel: string;
  sessionNote?: string | null;
}

export function printReceipt(data: PrintReceiptData) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const itemRows = data.items.map(item => `
    <div class="row">
      <span>${item.quantity}× ${item.name}</span>
      <span>₪${(item.unitPrice * item.quantity).toFixed(2)}</span>
    </div>
    ${item.notes ? `<div class="note">${item.notes}</div>` : ''}
  `).join('');

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 13px;
      width: 72mm;
      padding: 8px 6px;
      direction: rtl;
    }
    .center { text-align: center; }
    .cafe-name { font-size: 22px; font-weight: bold; margin: 4px 0 6px; letter-spacing: 1px; }
    .divider { border-top: 1px dashed #000; margin: 6px 0; }
    .row { display: flex; justify-content: space-between; margin: 3px 0; }
    .meta { font-size: 12px; color: #333; }
    .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 15px; margin: 3px 0; }
    .note { font-size: 11px; color: #555; margin: 0 8px 4px; font-style: italic; }
    .footer { font-size: 12px; margin: 3px 0; }
    @media print {
      @page { margin: 0; size: 80mm auto; }
      body { width: 100%; }
    }
  </style>
</head>
<body>
  <div class="center cafe-name">${data.cafeName}</div>
  <div class="divider"></div>
  <div class="row meta"><span>שולחן:</span><span>${data.tableNumber}</span></div>
  <div class="row meta"><span>תאריך:</span><span>${dateStr}</span></div>
  <div class="row meta"><span>שעה:</span><span>${timeStr}</span></div>
  <div class="divider"></div>
  ${itemRows}
  <div class="divider"></div>
  <div class="total-row"><span>סה"כ:</span><span>₪${data.total.toFixed(2)}</span></div>
  <div class="row meta"><span>אמצעי תשלום:</span><span>${data.paymentLabel}</span></div>
  ${data.sessionNote ? `<div class="note">הערה: ${data.sessionNote}</div>` : ''}
  <div class="divider"></div>
  <div class="center footer">תודה על ביקורכם!</div>
  <div class="center footer" style="font-size:11px;color:#555;">${data.cafeName}</div>
</body>
</html>`;

  const pw = window.open('', '_blank', 'width=380,height=600,toolbar=0,scrollbars=0,status=0,menubar=0');
  if (!pw) {
    alert('נא לאפשר פופאפים בדפדפן כדי להדפיס');
    return;
  }
  pw.document.write(html);
  pw.document.close();
  pw.focus();
  setTimeout(() => { pw.print(); pw.close(); }, 300);
}
