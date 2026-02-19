import PurchaseOrderFactory from "./purchaseOrderFactory"
import GlanbiaPurchaseOrder from "./glanbiaPurchaseOrder";

class GlanbiaPurchaseOrderFactory extends PurchaseOrderFactory
{

    createPurchaseOrder(): GlanbiaPurchaseOrder 
    {
        return new GlanbiaPurchaseOrder(this.ediString);
    }

}

export default GlanbiaPurchaseOrderFactory;