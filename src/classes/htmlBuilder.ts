import PurchaseOrderFactory from "./purchaseOrderFactory";
import PurchaseOrder from "./purchaseOrder";

class PurchaseOrderHTML
{
    purchaseOrder : PurchaseOrder;    
    orderLineHTML : Array<String> = [];

    constructor(poFactory : PurchaseOrderFactory)
    {
        this.purchaseOrder = poFactory.createPurchaseOrder();    
        this.buildOrders();
    }

    printPurchaseOrder() : void
    {
        this.purchaseOrder.getPurchaseOrder();
    }

    buildOrders() : void
    {
        const orderInfo = this.purchaseOrder.getPurchaseOrder();
        const segments = orderInfo.segments;
        const notes = orderInfo.notes;
        const orderType = orderInfo.orderType;
        const orderLines = orderInfo.orderLines;

        for (let i = 0; i < orderLines.length; i++) {
        const segment = segments[i];
        // Prepare note list for this item
        let noteItems = [];
        // Add item number if present
        if (segment["PO1013"]) {
            noteItems.push(`Item Number: ${segment["PO1013"]}`);
        }
        // Add PID note if present
        if (notes && notes[i] && notes[i]["PID05"]) {
            noteItems.push(notes[i]["PID05"]);
        }
        let noteHtml = noteItems.length > 0 ? `<ul>${noteItems.map(n => `<li>${n}</li>`).join('')}</ul>` : "";
        
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
		${noteHtml}
	    </div>
	    `;
		this.orderLineHTML.push(html);
		}

    }
}

export default PurchaseOrderHTML;