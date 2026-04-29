import PurchaseOrder from "./purchaseOrder";
import OrderType from "../enums/enums";
import helpers from "../helpers/helpers";
import ItemInfo from "../interfaces/itemInfo";

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

    mapItemInfos() : void
    {    
        let purchaseOrderLineSegmentName = this.determineChangeOrNewOrderLine("PO1013", "POC011");
        this.itemInfos = this.createItemInfos(purchaseOrderLineSegmentName, "PO109","PID05"); 
    }

    createItemInfos(segmentPositionPO, segmentPositionPO2, segmentPositionPID) : Array<ItemInfo>
    {
        const stagedItemInfos : Array<ItemInfo> = [];
        const cleanedItemInfos : Array<ItemInfo> = [];
        let pendingDescription = null;

        for (let i = 0; i < this.notes.length; i++) 
        {
            const itemDescription = this.notes[i][segmentPositionPID];
            let itemNumber = this.findSegment(this.segments, this.orderLineType)[0][segmentPositionPO];
            let itemNumber2 = this.findSegment(this.segments, this.orderLineType)[0][segmentPositionPO2];

            const itemInfo = this.createItemInfo(itemNumber, itemNumber2, itemDescription);

            stagedItemInfos.push(itemInfo); 
        }

        for (let j = 0; j < this.orderLineLength; j++)
        {
            const itemNumber = this.findSegment(this.segments, this.orderLineType)[j][segmentPositionPO];
            const itemNumber2 = this.findSegment(this.segments, this.orderLineType)[j][segmentPositionPO2];
            const itemInfo = this.createItemInfo(itemNumber, itemNumber2, null);
            stagedItemInfos.push(itemInfo);
        }

        for (let i = 0; i < stagedItemInfos.length; i++)
        {
            const currentItem = stagedItemInfos[i];
            const prevItem = cleanedItemInfos[cleanedItemInfos.length - 1];
            
            // If this is a duplicate item number
            if (prevItem && currentItem.itemNumber === prevItem.itemNumber) {
                // If current has description, save it for next unique item
                if (currentItem.itemDescription) {
                    pendingDescription = currentItem.itemDescription;
                }
                // Skip this duplicate
                continue;
            }
            
            // This is a unique item number
            // Apply pending description if we have one
            if (pendingDescription && !currentItem.itemDescription) {
                currentItem.itemDescription = pendingDescription;
                pendingDescription = null;
            }
            
            cleanedItemInfos.push(currentItem);
        }

        return cleanedItemInfos;
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