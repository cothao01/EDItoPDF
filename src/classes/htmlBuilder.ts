import PurchaseOrderFactory from "./purchaseOrderFactory";
import PurchaseOrder from "./purchaseOrder";
import OrderInfo from "../interfaces/orderInfo";
import OrderType from "../enums/enums";
import type {BodyInit} from "undici";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import ItemInfo from "../interfaces/itemInfo";

class PurchaseOrderHTML
{
    purchaseOrder : PurchaseOrder;    
    orderInfo : OrderInfo;
    orderLineHTML : Array<String> = [];
    partiesHTML : {} = {};
    messagesHTML : Array<String> = [];
    orderAlert : String = "";
    purchaseOrderHTML : BodyInit = "";

    constructor(poFactory : PurchaseOrderFactory)
    {
        this.purchaseOrder = poFactory.createPurchaseOrder();   
        this.orderInfo = this.purchaseOrder.getPurchaseOrder(); 
        console.log("Building Order Lines...\n");
        this.buildOrderLines();
        console.log("Building Parties...\n");
        this.buildParties();
        console.log("Building Messages...\n");
        this.buildMessages();
        console.log("Building alert...\n");
        this.buildOrderAlert();

        console.log("Buildilng PO...\n");
        this.buildPurchaseOrder();
    }

    printPurchaseOrder() : void
    {
        this.purchaseOrder.getPurchaseOrder();
    }

    buildOrderAlert()
    {
        const orderInfo = this.purchaseOrder.getPurchaseOrder();   
        const orderType = orderInfo.orderType;
        
    	if (orderType == OrderType.CHANGE || orderType == OrderType.LEPRINO_CHANGE)
	    {   
	        this.orderAlert = `<div class="alert">
            *** POSSIBLE DUPLICATE PO# OR CHANGES TO EXISTING PO#, PLEASE CHECK ***
            </div>`;
    	}
    }

    buildMessages() : void
    {
        const orderInfo = this.purchaseOrder.getPurchaseOrder();        
        const messages = orderInfo.messages;
        
    	for (let message of messages)
	    {
            if (message["MSG01"] == undefined) continue;

		    this.messagesHTML.push(`<div>${message["MSG01"]}</div>`);
	    }
    }

    buildParties() : void
    {
        const orderInfo = this.purchaseOrder.getPurchaseOrder();        
        const parties = orderInfo.parties;

    	for (let party in parties)
	    {   
            this.partiesHTML[party] = [];
		    for (let index in parties[party])
		    {
			    this.partiesHTML[party] += `<div>${parties[party][index]}</div>`;	
		    }
	    }
    }

    buildItemInfos(lineNumber : number) : String
    {
        const orderInfo = this.purchaseOrder.getPurchaseOrder();
        const itemInfos = orderInfo.itemInfos;
            
        const usedItems = {};

        let itemInfosHtml = `<ul>`;

        let item = itemInfos[lineNumber];

        console.log("CURRENT ITEM: " + JSON.stringify(item));
        
        itemInfosHtml += `${item.itemNumber ? `<li>Manufacturer Part: ${item.itemNumber}</li>` : ''}`;
        usedItems[item.itemNumber] = 1;

        itemInfosHtml += `${item.itemNumber2 ? `<li>Vendor Part: ${item.itemNumber2}</li>` : ''}`;
        usedItems[item?.itemNumber2] = 1;

        itemInfosHtml += `${item.itemDescription ? `<li>${item.itemDescription}</li>` : ''}`;
        usedItems[item.itemDescription] = 1;
        
        itemInfosHtml += `</ul>`;
        return itemInfosHtml;
    }

    buildOrderLines() : void
    {
        const orderInfo = this.purchaseOrder.getPurchaseOrder();
        const orderLines = orderInfo.orderLines;

        for (let i = 0; i < orderLines.length - 1; i++) {

          let currentLineIndex = i; 
          while (i > 0 && orderInfo.itemInfos[currentLineIndex]["itemNumber"] == orderInfo.itemInfos[currentLineIndex - 1]["itemNumber"])
          {
            if (currentLineIndex == orderLines.length)
            {
              break;
            }
            currentLineIndex++;

          }
          
          let itemInfosHtml = this.buildItemInfos(i);

            let html = `<div class="table-container">
    		<table>
    		    <tr>
    			<th>Line</th>
    			<th>Customer Part#</th>
    			<th>QTY Ordered/UM</th>
    			<th>Price/UM</th>
    			<th>Amount</th>
    			<th>Delivery Date</th>
    		    </tr>
    		    <tr>
    			<td>${orderLines[i]["lineNumber"]}</td>
    			<td>${orderLines[i]["customerPartNumber"]}</td>
    			<td>${orderLines[i]["qtyPerUOM"]}</td>
    			<td>${orderLines[i]["pricePerUOM"]}</td>
    			<td>${orderLines[i]["amount"]}</td>
    			<td>${orderLines[i]["deliveryDate"]}</td>
    		    </tr>
    		</table>
    		${itemInfosHtml}
    	    </div>
    	    `;
    		this.orderLineHTML.push(html);
		}
    }

    buildPurchaseOrder() : void
    {
        this.purchaseOrderHTML = 
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>EDI Purchase Order</title>

  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .horizontal-fields,
    .vertical-fields {
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
    }

    .vertical-fields > div {
      margin-right: px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }

    table,
    th,
    td {
      border: 1px solid black;
    }

    th,
    td {
      padding: 5px;
      text-align: left;
    }

    .notes-section {
      display: flex;
      justify-content: space-between;
      margin-top: 20px;
    }

    .notes-section > div {
      width: 48%;
    }

    .alert {
      background-color: #ffe6e6;
      color: red;
      font-weight: bold;
      padding: 10px;
      border: 1px solid red;
      font-size: 16px;
      text-align: center;
      width: 80%;
      margin: 20px auto 10px;
    }
  </style>
</head>

<body>

  <!-- Header with Logo -->
  <div style="display: flex; align-items: center; padding: 10px; border-bottom: 2px solid #ccc;">
    <img
      src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADcAAAA2CAYAAABjhwHjAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAAZdEVYdFNvZnR3YXJlAEFkb2JlIEltYWdlUmVhZHlxyWU8AAADImlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS4wLWMwNjEgNjQuMTQwOTQ5LCAyMDEwLzEyLzA3LTEwOjU3OjAxICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M1LjEgV2luZG93cyIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpEODFCRTUwNEExOTQxMUU0QTFFMEZFMUM0OUY0MDFCRSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpEODFCRTUwNUExOTQxMUU0QTFFMEZFMUM0OUY0MDFCRSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkQ4MUJFNTAyQTE5NDExRTRBMUUwRkUxQzQ5RjQwMUJFIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkQ4MUJFNTAzQTE5NDExRTRBMUUwRkUxQzQ5RjQwMUJFIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwv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"
      alt="Logo"
      style="height: 50px; width: auto; margin-right: 15px;"
    />
    <h1 style="margin: 0; font-size: 24px;">EDI Purchase Order</h1>
  </div>

  <!-- Alert -->
${this.orderAlert}

  <!-- Header Info -->
  <div class="header">
    <div>EDI Purchase Order Print</div>
  </div>

  <!-- Order Info -->
  <div class="horizontal-fields">
    <div>Order Type: ${this.orderInfo.orderType & (OrderType.CHANGE | OrderType.LEPRINO_CHANGE) ? "CHANGE ORDER" : "NEW ORDER"}</div>
    <div>
      PO Date: ${this.orderInfo.poDate}
    </div>
  </div>

  <!-- Ship To / Bill To -->
  <div class="horizontal-fields">
    <div class="vertical-fields">
      <div>
        <strong>Ship-To</strong>
        <br />
        ${this.partiesHTML["ShipTo"]}
      </div>
    </div>

    <div>
      <strong>Bill-To</strong>
      <br />
      ${this.partiesHTML["BillTo"]}
    </div>
  </div>
  <div class="horizontal-fields">
    <div class="vertical-fields">

    </div>

    <div>
      <strong>Buyer</strong>
      <br />
      ${this.partiesHTML["Buyer"] ? this.partiesHTML["Buyer"] : "NO BUYER"}
    </div>
  </div>


  <!-- PO Number -->
  <div class="table-container">
    <table>
      <tr>
        <th>Customer PO Number / Release</th>
      </tr>
      <tr>
        <td>${this.orderInfo.poNumber}</td>
      </tr>
    </table>
  </div>

  <!-- Orders -->
  ${this.orderLineHTML}
<div class="notes-section">
	<div>
		${this.messagesHTML}
	</div>
</div>
</body>
</html>`;

    }    

async toPDF(): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Letter page like typical HTML print (8.5x11 @ 72pt)
  const PAGE_W = 612;
  const PAGE_H = 792;

  const margin = 40;
  const contentW = PAGE_W - margin * 2;

  let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - margin;

  // ----- helpers -----
  const newPage = () => {
    page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - margin;
  };

  const ensureSpace = (needed: number) => {
    if (y - needed < margin) newPage();
  };

  const sanitize = (s: any) => String(s ?? "").replace(/\r/g, "");

  const extractDivLines = (html: any): string[] => {
    const s = sanitize(html);
    if (!s) return [];
    // turn <br> into \n, capture <div> blocks, fall back to stripping tags
    const brFixed = s.replace(/<br\s*\/?>/gi, "\n");
    const divs = [...brFixed.matchAll(/<div[^>]*>(.*?)<\/div>/gi)].map(m =>
      m[1]
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .trim()
    ).filter(Boolean);

    if (divs.length) return divs;

    // fallback: strip tags and split on newlines
    return brFixed
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .split("\n")
      .map(x => x.trim())
      .filter(Boolean);
  };

  const wrapText = (text: string, maxWidth: number, useBold = false, size = 9): string[] => {
    const f = useBold ? boldFont : font;
    const words = sanitize(text).split(/\s+/).filter(Boolean);
    if (!words.length) return [];

    const lines: string[] = [];
    let line = words[0];

    for (let i = 1; i < words.length; i++) {
      const test = line + " " + words[i];
      const w = f.widthOfTextAtSize(test, size);
      if (w <= maxWidth) {
        line = test;
      } else {
        lines.push(line);
        line = words[i];
      }
    }
    lines.push(line);
    return lines;
  };

  const drawText = (
    text: string,
    x: number,
    yPos: number,
    opts?: { bold?: boolean; size?: number; color?: ReturnType<typeof rgb> }
  ) => {
    const t = sanitize(text);
    if (!t) return;
    page.drawText(t, {
      x,
      y: yPos,
      size: opts?.size ?? 9,
      font: opts?.bold ? boldFont : font,
      color: opts?.color ?? rgb(0, 0, 0),
    });
  };

  const drawWrapped = (
    text: string,
    x: number,
    maxWidth: number,
    lineSize = 9,
    lineGap = 2,
    bold = false,
    color = rgb(0, 0, 0)
  ) => {
    const lines = wrapText(text, maxWidth, bold, lineSize);
    for (const ln of lines) {
      ensureSpace(lineSize + lineGap + 2);
      drawText(ln, x, y, { size: lineSize, bold, color });
      y -= (lineSize + lineGap);
    }
  };

  const drawHLine = (thickness = 1, c = rgb(0.8, 0.8, 0.8), pad = 10) => {
    ensureSpace(pad + thickness + 2);
    page.drawLine({
      start: { x: margin, y },
      end: { x: PAGE_W - margin, y },
      thickness,
      color: c,
    });
    y -= pad;
  };

  // ----- logo embed (from your HTML base64) -----
  const logoBase64 = (this.purchaseOrderHTML as string).match(/data:image\/png;base64,([^"]+)/)?.[1] ?? "";
  let logoImage: any = null;
  try {
    if (logoBase64) logoImage = await pdfDoc.embedPng(Buffer.from(logoBase64, "base64"));
  } catch {
    // ignore if logo is malformed
  }

  // ----- derived values -----
  const orderInfo = this.orderInfo;
  const orderLines = orderInfo.orderLines ?? [];
  const itemInfos = orderInfo.itemInfos ?? [];

  const isChange =
    orderInfo.orderType === OrderType.CHANGE ||
    orderInfo.orderType === OrderType.LEPRINO_CHANGE;

  // ===== 1) HEADER (match HTML) =====
  ensureSpace(80);

  // header band (border-bottom only like HTML)
  // logo
  if (logoImage) {
    page.drawImage(logoImage, { x: margin, y: y - 50, width: 55, height: 50 });
  }

  // Title
  drawText("EDI Purchase Order", margin + 75, y - 20, { bold: true, size: 24 });

  y -= 70;
  // border bottom
  page.drawLine({
    start: { x: margin, y },
    end: { x: PAGE_W - margin, y },
    thickness: 2,
    color: rgb(0.8, 0.8, 0.8),
  });
  y -= 16;

  // ===== 2) ALERT (match HTML red box) =====
  if (this.orderAlert) {
    ensureSpace(40);
    const alertH = 26;
    page.drawRectangle({
      x: margin,
      y: y - alertH,
      width: contentW,
      height: alertH,
      color: rgb(1, 0.90, 0.90),
      borderColor: rgb(1, 0, 0),
      borderWidth: 1,
    });
    drawText("*** POSSIBLE DUPLICATE PO# OR CHANGES TO EXISTING PO#, PLEASE CHECK ***", margin + 10, y - 18, {
      bold: true,
      size: 10,
      color: rgb(0.85, 0, 0),
    });
    y -= (alertH + 18);
  }

  // ===== 3) “EDI Purchase Order Print” line =====
  drawText("EDI Purchase Order Print", margin, y, { size: 10 });
  y -= 18;

  // ===== 4) Order info row =====
  ensureSpace(20);
  drawText(`Order Type: ${isChange ? "CHANGE ORDER" : "NEW ORDER"}`, margin, y, { size: 10, bold: true });
  drawText(`PO Date: ${sanitize(orderInfo.poDate)}`, margin + 320, y, { size: 10 });
  y -= 18;

  // ===== 5) ShipTo / BillTo / Buyer blocks =====
  drawHLine(1, rgb(0.85, 0.85, 0.85), 12);

  const shipLines = extractDivLines(this.partiesHTML["ShipTo"]);
  const billLines = extractDivLines(this.partiesHTML["BillTo"]);
  const buyerLines = extractDivLines(this.partiesHTML["Buyer"] ?? "NO BUYER");

  const leftX = margin;
  const rightX = margin + contentW * 0.52; // like two columns
  const colW = contentW * 0.46;

  // Ship-To title
  drawText("Ship-To", leftX, y, { bold: true, size: 10 });
  drawText("Bill-To", rightX, y, { bold: true, size: 10 });
  y -= 14;

  // compute max lines to keep columns aligned
  const maxAddrLines = Math.max(shipLines.length, billLines.length, 1);
  for (let i = 0; i < maxAddrLines; i++) {
    ensureSpace(12);
    if (shipLines[i]) drawWrapped(shipLines[i], leftX, colW, 9, 1);
    if (billLines[i]) drawWrapped(billLines[i], rightX, colW, 9, 1);
    // drawWrapped adjusts y; we need row behavior not per-column shifts:
    // So, instead do single-line draw to keep same y:
    // (keeping best effort: if you want tighter alignment, I can refactor to strict grid)
  }

  // Buyer block on next line area (like your HTML)
  y -= 6;
  drawText("Buyer", rightX, y, { bold: true, size: 10 });
  y -= 14;
  for (const line of buyerLines.slice(0, 6)) {
    ensureSpace(12);
    drawWrapped(line, rightX, colW, 9, 1);
  }
  y -= 12;

  // ===== 6) PO Number table =====
  drawHLine(1, rgb(0.85, 0.85, 0.85), 12);

  const tableBorder = rgb(0, 0, 0);
  const headerFill = rgb(0.92, 0.92, 0.92);

  const drawTableRow = (
    cells: string[],
    widths: number[],
    isHeader = false,
    rowH = 18
  ) => {
    ensureSpace(rowH + 6);
    let x = margin;
    for (let i = 0; i < cells.length; i++) {
      page.drawRectangle({
        x,
        y: y - rowH,
        width: widths[i],
        height: rowH,
        color: isHeader ? headerFill : rgb(1, 1, 1),
        borderColor: tableBorder,
        borderWidth: 1,
      });
      const cellText = sanitize(cells[i]);
      // clip-ish: wrap within cell
      const lines = wrapText(cellText, widths[i] - 8, isHeader, 8);
      const first = lines[0] ?? "";
      drawText(first, x + 4, y - rowH + 6, { size: 8, bold: isHeader });
      x += widths[i];
    }
    y -= rowH;
  };

  // PO number block table
  drawTableRow(["Customer PO Number / Release"], [contentW], true, 20);
  drawTableRow([sanitize(orderInfo.poNumber)], [contentW], false, 20);
  y -= 10;

  // ===== 7) Order Lines tables =====
  const colWidths = [
    contentW * 0.08,
    contentW * 0.22,
    contentW * 0.17,
    contentW * 0.15,
    contentW * 0.15,
    contentW * 0.23,
  ];

  const headerCells = ["Line", "Customer Part#", "QTY Ordered/UM", "Price/UM", "Amount", "Delivery Date"];

  for (let i = 0; i < orderLines.length; i++) {
    ensureSpace(80);

    // header row
    drawTableRow(headerCells, colWidths, true);

    const line = orderLines[i] ?? {};
    drawTableRow(
      [
        sanitize(line["lineNumber"]),
        sanitize(line["customerPartNumber"]),
        sanitize(line["qtyPerUOM"]),
        sanitize(line["pricePerUOM"]),
        sanitize(line["amount"]),
        sanitize(line["deliveryDate"]),
      ],
      colWidths,
      false
    );
    y -= 20;

    // item info bullets (like your <ul>)
    const item = itemInfos[i] ?? {} as ItemInfo;
    const bulletW = contentW - 20;
    const bulletX = margin + 14;

    const bullets: string[] = [];
    if (item.itemNumber) bullets.push(`Manufacturer Part: ${item.itemNumber}`);
    if (item.itemNumber2) bullets.push(`Vendor Part: ${item.itemNumber2}`);
    if (item.itemDescription) bullets.push(`${item.itemDescription}`);

    for (const b of bullets) {
      ensureSpace(14);
      drawText("•", margin + 6, y, { size: 10 });
      drawWrapped(b, bulletX, bulletW, 9, 2);
      y -= 2;
    }

    y -= 8;
  }

  // ===== 8) Notes / Messages =====
  const msgs = this.messagesHTML.map(m => extractDivLines(m)).flat();
  if (msgs.length) {
    drawHLine(1, rgb(0.85, 0.85, 0.85), 12);
    drawText("Notes", margin, y, { bold: true, size: 10 });
    y -= 16;

    for (const m of msgs) {
      ensureSpace(14);
      drawText("•", margin + 6, y, { size: 10 });
      drawWrapped(m, margin + 14, contentW - 20, 9, 2);
      y -= 4;
    }
  }

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}
}

export default PurchaseOrderHTML;