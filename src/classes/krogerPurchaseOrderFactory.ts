import PurchaseOrderFactory from "./purchaseOrderFactory"
import KrogerPurchaseOrder from "./krogerPurchaseOrder";

class KrogerPurchaseOrderFactory extends PurchaseOrderFactory
{

    createPurchaseOrder(): KrogerPurchaseOrder 
    {
        console.log("Creating Kroger Order");
        return new KrogerPurchaseOrder(this.ediString);
    }

}

export default KrogerPurchaseOrderFactory;