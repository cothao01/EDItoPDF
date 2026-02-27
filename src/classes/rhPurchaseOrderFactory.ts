import PurchaseOrderFactory from "./purchaseOrderFactory"
import RHPurchaseOrder from "./rhPurchaseOrder";

class RHPurchaseOrderFactory extends PurchaseOrderFactory
{

    createPurchaseOrder(): RHPurchaseOrder 
    {
        console.log("Creating RH Order");
        return new RHPurchaseOrder(this.ediString);
    }

}

export default RHPurchaseOrderFactory;