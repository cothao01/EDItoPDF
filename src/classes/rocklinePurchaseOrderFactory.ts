import PurchaseOrderFactory from "./purchaseOrderFactory"
import RocklinePurchaseOrder from "./rocklinePurchaseOrder";

class RocklinePurchaseOrderFactory extends PurchaseOrderFactory
{

    createPurchaseOrder(): RocklinePurchaseOrder 
    {
        console.log("Creating Rockline Order");
        return new RocklinePurchaseOrder(this.ediString);
    }

}

export default RocklinePurchaseOrderFactory;