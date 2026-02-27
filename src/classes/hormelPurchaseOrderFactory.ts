import PurchaseOrderFactory from "./purchaseOrderFactory"
import HormelPurchaseOrder from "./hormelPurchaseOrder"

class HormelPurchaseOrderFactory extends PurchaseOrderFactory
{

    createPurchaseOrder(): HormelPurchaseOrder 
    {
        return new HormelPurchaseOrder(this.ediString);
    }

}

export default HormelPurchaseOrderFactory;