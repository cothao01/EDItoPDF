import PurchaseOrderFactory from "./purchaseOrderFactory"
import ThreeMPurchaseOrder from "./threemPurchaseOrder";

class ThreeMPurchaseOrderFactory extends PurchaseOrderFactory
{

    createPurchaseOrder(): ThreeMPurchaseOrder 
    {
        return new ThreeMPurchaseOrder(this.ediString);
    }

}

export default ThreeMPurchaseOrderFactory;