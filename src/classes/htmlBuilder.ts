import PurchaseOrderFactory from "./purchaseOrderFactory";
import PurchaseOrder from "./purchaseOrder";
import OrderInfo from "../interfaces/orderInfo";
import OrderType from "../enums/enums";
import type {BodyInit} from "undici";

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
        this.buildOrderLines();
        this.buildParties();
        this.buildMessages();
        this.buildOrderAlert();

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

    buildItemInfos() : String
    {
        const orderInfo = this.purchaseOrder.getPurchaseOrder();
        const itemInfos = orderInfo.itemInfos;
            
        const usedItems = {};
        const usedItemDesc = {};

        let itemInfosHtml = `<ul>`;

        for (let i = 0; i < itemInfos.length; i++)
        {
          const item = itemInfos[i];

          if (!usedItems[item.itemNumber])
          {
            itemInfosHtml += `${item.itemNumber ? `<li>${item.itemNumber}</li>` : ''}`;
            usedItems[item.itemNumber] = 1;
          }

          if (!usedItemDesc[item.itemDescription])
          {
            itemInfosHtml += `${item.itemDescription ? `<li>${item.itemDescription}</li>` : ''}`;
            usedItems[item.itemDescription] = 1;
          }

        }
        
        itemInfosHtml += `</ul>`;

        return itemInfosHtml;
    }

    buildOrderLines() : void
    {
        const orderInfo = this.purchaseOrder.getPurchaseOrder();
        const orderLines = orderInfo.orderLines;
        const itemInfosHtml = this.buildItemInfos();

        for (let i = 0; i < orderLines.length; i++) {

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
}

export default PurchaseOrderHTML;