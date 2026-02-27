import PurchaseOrderFactory from "./purchaseOrderFactory"
import JohnDeerePurchaseOrder from "./johnDeerePurchaseOrder";

class JohnDeerePurchaseOrderFactory extends PurchaseOrderFactory
{

    createPurchaseOrder(): JohnDeerePurchaseOrder 
    {
        return new JohnDeerePurchaseOrder(this.ediString);
    }

}

export default JohnDeerePurchaseOrderFactory;