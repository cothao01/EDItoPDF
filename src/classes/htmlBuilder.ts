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
        const orderLines = orderInfo.orderLines;
        const itemInfos = orderInfo.itemInfos;

        for (let i = 0; i < orderLines.length; i++) {

            const itemInfosHtml = `<ul>${itemInfos.map(item => `<li>${item.itemNumber}</li><li>${item.itemDescription}</li>`).join('')}</ul>`;
            
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
}

export default PurchaseOrderHTML;