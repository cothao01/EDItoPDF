import PurchaseOrder from "./purchaseOrder";
import OrderType from "../enums/enums";
import helpers from "../helpers/helpers";
const {formatDateString} = helpers;

class LeprinoPurchaseOrder extends PurchaseOrder
{
    getOrderType() : OrderType
    {
        const poSegment = this.findSegment(this.segments, "BEG");

        const poSegmentLength = this.findSegment(this.segments, "BEG").length;

        if (poSegmentLength < 1 || parseInt(poSegment[0]["BEG01"]) > 0)
        {
            return OrderType.LEPRINO_CHANGE;
        }

        return OrderType.NEW;
    }

    getPONumber() : Number
    {
        let poNumber;

        switch (this.orderType)
        {
            case OrderType.LEPRINO_CHANGE:
                poNumber = this.findSegment(this.segments, "BCH")[0]["BCH03"];
                break;
            case OrderType.NEW:
                poNumber = this.findSegment(this.segments, "BEG")[0]["BEG03"];
                break;
            default:
                poNumber = null;            
        }

        return poNumber        
    }

    mapPODate() : void
    {
        const begSegment = this.findSegment(this.segments, "BEG")[0];
        if (begSegment && begSegment["BEG05"]) {
            this.poDate = formatDateString(begSegment["BEG05"]);
        } else {
            const bchSegment = this.findSegment(this.segments, "BCH")[0];
            if (bchSegment && bchSegment["BCH06"]) {
                this.poDate = formatDateString(bchSegment["BCH06"]);
            } else {
                this.poDate = "";
            }
        }
    }
}

export default LeprinoPurchaseOrder;