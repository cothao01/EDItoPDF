import PurchaseOrderFactory from "./purchaseOrderFactory"
import LeprinoPurchaseOrder from "./leprinoPurchaseOrder"

class LeprinoPurchaseOrderFactory extends PurchaseOrderFactory
{

    createPurchaseOrder(): LeprinoPurchaseOrder 
    {
        return new LeprinoPurchaseOrder(this.ediString);
    }

}

export default LeprinoPurchaseOrderFactory;