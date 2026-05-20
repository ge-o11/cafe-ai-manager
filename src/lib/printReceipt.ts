export interface KitchenTicketData {
  tableNumber: number;
  items: { name: string; quantity: number; notes?: string | null }[];
  sessionNote?: string | null;
}

// Returns a pre-opened window. Call writeKitchenTicket() after the order is confirmed.
export function openKitchenWindow(): Window | null {
  return window.open('', '_blank', 'width=350,height=500,toolbar=0,scrollbars=0,status=0,menubar=0');
}

export function writeKitchenTicket(pw: Window, data: KitchenTicketData) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' });

  const itemRows = data.items.map((item, i) => `
    <div class="item ${item.notes ? 'has-note' : ''}">
      <div class="item-top">
        <span class="qty">${item.quantity}</span>
        <span class="x">×</span>
        <span class="name">${item.name}</span>
      </div>
      ${item.notes ? `<div class="note">⚠ ${item.notes}</div>` : ''}
    </div>
    ${i < data.items.length - 1 ? '<div class="item-sep"></div>' : ''}
  `).join('');

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: Arial, 'Helvetica Neue', sans-serif;
      width: 80mm;
      padding: 6px 8px 10px;
      direction: rtl;
      background: #fff;
    }

    /* ── Header ── */
    .header {
      text-align: center;
      padding-bottom: 6px;
      border-bottom: 3px solid #000;
      margin-bottom: 8px;
    }
    .header-label {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #555;
    }
    .table-block {
      margin: 4px 0 2px;
    }
    .table-word {
      font-size: 16px;
      font-weight: 700;
      color: #333;
      display: block;
    }
    .table-num {
      font-size: 80px;
      font-weight: 900;
      line-height: 1;
      letter-spacing: -2px;
      display: block;
    }
    .datetime {
      font-size: 15px;
      font-weight: 700;
      color: #333;
      margin-top: 2px;
    }

    /* ── Items ── */
    .items-section {
      margin: 4px 0;
    }
    .item {
      padding: 7px 4px;
    }
    .item.has-note {
      background: #fffbe6;
      border-radius: 4px;
      padding: 7px 6px;
      margin: 2px 0;
    }
    .item-top {
      display: flex;
      align-items: baseline;
      gap: 5px;
    }
    .qty {
      font-size: 34px;
      font-weight: 900;
      line-height: 1;
      min-width: 32px;
      color: #000;
    }
    .x {
      font-size: 20px;
      font-weight: 900;
      color: #555;
      margin-top: 4px;
    }
    .name {
      font-size: 22px;
      font-weight: 700;
      line-height: 1.2;
      color: #000;
      flex: 1;
    }
    .note {
      font-size: 15px;
      font-weight: 800;
      color: #000;
      background: #ffe000;
      padding: 3px 6px;
      margin-top: 4px;
      border-radius: 3px;
      display: inline-block;
    }
    .item-sep {
      border-top: 1px dashed #bbb;
      margin: 0 4px;
    }

    /* ── Session note ── */
    .session {
      border: 2px dashed #aaa;
      border-radius: 4px;
      padding: 5px 8px;
      margin-top: 8px;
      font-size: 15px;
      font-weight: 700;
    }

    /* ── Footer ── */
    .footer {
      border-top: 3px solid #000;
      margin-top: 8px;
      padding-top: 5px;
      text-align: center;
      font-size: 12px;
      color: #666;
      font-weight: 600;
    }

    @media print {
      @page { margin: 0; size: 80mm auto; }
      body { width: 100%; }
    }
  </style>
</head>
<body>

  <div class="header">
    <div class="header-label">★ הזמנה חדשה ★</div>
    <div class="table-block">
      <span class="table-word">שולחן</span>
      <span class="table-num">${data.tableNumber}</span>
    </div>
    <div class="datetime">${dateStr} &nbsp;|&nbsp; ${timeStr}</div>
  </div>

  <div class="items-section">
    ${itemRows}
  </div>

  ${data.sessionNote ? `<div class="session">📝 &nbsp;${data.sessionNote}</div>` : ''}

  <div class="footer">סה"כ ${data.items.reduce((s, i) => s + i.quantity, 0)} מנות</div>

</body>
</html>`;

  pw.document.write(html);
  pw.document.close();
  pw.focus();
  setTimeout(() => { pw.print(); pw.close(); }, 300);
}

export interface DraftBonData {
  cafeName: string;
  tableNumber: number;
  items: { name: string; quantity: number; unitPrice: number; notes?: string | null }[];
  subtotal: number;
  discountAmount?: number;
  discountReason?: string | null;
  total: number;
  sessionNote?: string | null;
}

export function printDraftBon(data: DraftBonData) {
  const timeStr = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  const itemRows = data.items.map(item => `
    <div class="row">
      <span>${item.quantity}× ${item.name}</span>
      <span>₪${(item.unitPrice * item.quantity).toFixed(2)}</span>
    </div>
    ${item.notes ? `<div class="note">${item.notes}</div>` : ''}
  `).join('');

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="utf-8"><style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Courier New',monospace; font-size:13px; width:72mm; padding:8px 6px; direction:rtl; }
  .center { text-align:center; }
  .cafe-name { font-size:20px; font-weight:bold; margin:4px 0 4px; }
  .draft-label { font-size:11px; border:1px dashed #999; padding:2px 8px; display:inline-block; margin-bottom:4px; color:#666; }
  .divider { border-top:1px dashed #000; margin:5px 0; }
  .row { display:flex; justify-content:space-between; margin:3px 0; }
  .total-row { display:flex; justify-content:space-between; font-weight:bold; font-size:15px; margin:3px 0; }
  .note { font-size:11px; color:#555; margin:0 8px 4px; font-style:italic; }
  @media print { @page { margin:0; size:80mm auto; } body { width:100%; } }
</style></head>
<body>
  <div class="center cafe-name">${data.cafeName}</div>
  <div class="center"><span class="draft-label">בון — לא שולם</span></div>
  <div class="divider"></div>
  <div class="row"><span>שולחן:</span><span>${data.tableNumber}</span></div>
  <div class="row"><span>שעה:</span><span>${timeStr}</span></div>
  <div class="divider"></div>
  ${itemRows}
  <div class="divider"></div>
  ${(data.discountAmount && data.discountAmount > 0) ? `
  <div class="row"><span>לפני הנחה:</span><span>₪${data.subtotal.toFixed(2)}</span></div>
  <div class="row" style="color:#c00"><span>הנחה${data.discountReason ? ` — ${data.discountReason}` : ''}:</span><span>−₪${data.discountAmount.toFixed(2)}</span></div>
  ` : ''}
  <div class="total-row"><span>סה"כ לתשלום:</span><span>₪${data.total.toFixed(2)}</span></div>
  ${data.sessionNote ? `<div class="note">הערה: ${data.sessionNote}</div>` : ''}
  <div class="divider"></div>
</body></html>`;

  const pw = window.open('', '_blank', 'width=380,height=550,toolbar=0,scrollbars=0,status=0,menubar=0');
  if (!pw) { alert('נא לאפשר פופאפים בדפדפן כדי להדפיס'); return; }
  pw.document.write(html);
  pw.document.close();
  pw.focus();
  setTimeout(() => { pw.print(); pw.close(); }, 300);
}

export interface PrintReceiptData {
  cafeName: string;
  tableNumber: number;
  items: { name: string; quantity: number; unitPrice: number; notes?: string | null }[];
  subtotal: number;
  discountType?: 'percent' | 'fixed' | null;
  discountAmount?: number;
  discountReason?: string | null;
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
  ${(data.discountAmount && data.discountAmount > 0) ? `
  <div class="row"><span>סכום לפני הנחה:</span><span>₪${data.subtotal.toFixed(2)}</span></div>
  <div class="row" style="color:#c00;font-weight:700"><span>הנחה${data.discountType === 'percent' && data.discountReason ? ` (${data.discountReason})` : data.discountReason ? ` — ${data.discountReason}` : ''}:</span><span>−₪${data.discountAmount.toFixed(2)}</span></div>
  ` : ''}
  <div class="total-row"><span>סה"כ לתשלום:</span><span>₪${data.total.toFixed(2)}</span></div>
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
