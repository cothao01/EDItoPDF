import PurchaseOrderFactory from "./purchaseOrderFactory"
import LouisianaPacificPurchaseOrder from "./louisianaPacificPurchaseOrder";

class LouisianaPacificPurchaseOrderFactory extends PurchaseOrderFactory
{

    createPurchaseOrder(): LouisianaPacificPurchaseOrder 
    {
        return new LouisianaPacificPurchaseOrder(this.ediString);
    }

}

export default LouisianaPacificPurchaseOrderFactory;