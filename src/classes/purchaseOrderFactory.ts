import PurchaseOrder from "./purchaseOrder";

class PurchaseOrderFactory
{
    ediString : String;

    constructor(ediString)
    {
        this.ediString = ediString;        
    }

    createPurchaseOrder() : PurchaseOrder
    {
        return new PurchaseOrder(this.ediString);
    };
}

export default PurchaseOrderFactory;