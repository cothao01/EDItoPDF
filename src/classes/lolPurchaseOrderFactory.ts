import PurchaseOrderFactory from "./purchaseOrderFactory"
import LandOLakesPurchaseOrder from "./lolPurchaseOrder";

class LandOLakesPurchaseOrderFactory extends PurchaseOrderFactory
{

    createPurchaseOrder(): LandOLakesPurchaseOrder 
    {
        console.log("Creating LandOLakes Order");
        return new LandOLakesPurchaseOrder(this.ediString);
    }

}

export default LandOLakesPurchaseOrderFactory;