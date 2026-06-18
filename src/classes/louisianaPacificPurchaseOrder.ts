import PurchaseOrder from "./purchaseOrder";
import LineInfo from "../interfaces/lineInfo";
import OrderType from "../enums/enums";
import helpers from "../helpers/helpers";
import ItemInfo from "../interfaces/itemInfo";

const {formatDateString} = helpers;

class LouisianaPacificPurchaseOrder extends PurchaseOrder
{
    getSegments() : Array<{}>
    {
        let ediSegments = this.ediString.split('~');
        let ediSegments2 = this.ediString.split('\n');
        let chosenSegments = ediSegments;

        if (ediSegments2.length > ediSegments.length)
        {
            chosenSegments = ediSegments2;
        }

        const cleanedSegments = this.getCleanedEDISegmentsFrom(chosenSegments);

        return cleanedSegments;
    }

    mapItemInfos() : void
    {    
           this.itemInfos = this.createItemInfos("PO107", null, "PID05"); 
    }

    createItemInfos(segmentPositionPO, segmentPositionPO2, segmentPositionPID) : Array<ItemInfo>
    {
        const stagedItemInfos : Array<ItemInfo> = [];
        const cleanedItemInfos : Array<ItemInfo> = [];
        let pendingDescription = null;

        for (let i = 0; i < this.notes.length; i++) 
        {
            const itemDescription = this.notes[i][segmentPositionPID];
            const itemNumberSegment = this.findSegment(this.segments, this.orderLineType)[0];
            const indexDiff = Math.abs(this.notes[i]["index"] - itemNumberSegment["index"]);
            let itemNumber = itemNumberSegment[segmentPositionPO];
            let itemNumber2 = itemNumberSegment[segmentPositionPO2];

            const itemInfo = this.createItemInfo(itemNumber, itemNumber2, null, itemNumberSegment["index"]);
            stagedItemInfos.push(itemInfo); 
        }

        for (let j = 0; j < this.orderLineLength; j++)
        {
            const itemNumber = this.findSegment(this.segments, this.orderLineType)[j][segmentPositionPO];
            const itemNumber2 = this.findSegment(this.segments, this.orderLineType)[j][segmentPositionPO2];
            const itemInfo = this.createItemInfo(itemNumber, itemNumber2, null, this.findSegment(this.segments, this.orderLineType)[j]["index"]);
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

        for (let i = 0; i < this.notes.length; i++)
        {
            let closestIndex = Number.MAX_SAFE_INTEGER;
            let closestItemInfo;
            let noteIndex = this.notes[i]["index"];
            for (let j = 0; j < cleanedItemInfos.length; j++)
            {
                let itemIndex = cleanedItemInfos[j]["index"];
                let indexDiff = Math.abs(noteIndex - itemIndex);
                
                // if its comparing an item that is below it, continue as this means that item is invalid
                if (indexDiff < 0) continue;

                console.log(itemIndex.toString() + " - "  + noteIndex.toString() + " = " + indexDiff);
                if (indexDiff < closestIndex)
                {
                    closestIndex = indexDiff;
                    closestItemInfo = cleanedItemInfos[j];
                }

            }
            closestItemInfo["itemDescription"] = this.notes[i][segmentPositionPID];
        }

        return cleanedItemInfos;
    }


    getMessages() : Array<{}>
    {
        return [{}];
    }

    mapParties() : void
    {
        let n2Count = 0;

        const parties = 
        {
            0 : "ST"
        }

    	for (let i = 1; i < this.segments.length; ++i)
    	{
    		const segmentName = this.segments[i]["segment"];
    		const previousSegmentName = this.segments[i - 1]["segment"];
            let partyType;

            if (segmentName == "N2" && previousSegmentName != "N1")
            {
                partyType = parties[n2Count];
                this.stagePartyObject(i, partyType);            
            }
            else if (segmentName == "N1")
    		{
                partyType = this.segments[i]["N101"];
                this.stagePartyObject(i, partyType);            
    		}

    	}

        if (!this.parties["Buyer"])
        {
            this.parties["Buyer"] = this.findSegment(this.segments, "PER")[0];
        }

        this.cleanPartyInfo();
    }    
    
    getOrderLines() : Array<LineInfo>
    {
        const orderLines : Array<LineInfo> = [];

        if (this.orderType == OrderType.CHANGE) 
        {    

            const lineSegment = this.findSegment(this.segments, this.orderLineType);

            for (let i = 0; i < lineSegment.length; ++i)
            {
                const orderLine = {
                    lineNumber: lineSegment[i][this.orderLineType + "01"],
                    customerPartNumber :  lineSegment[i][this.orderLineType + "09"],
                    qtyPerUOM :  `${lineSegment[i][this.orderLineType + "02"]}/${lineSegment[i][this.orderLineType + "03"]}`,
                    pricePerUOM :  `${lineSegment[i][this.orderLineType + "04"]}/${lineSegment[i][this.orderLineType + "03"]}`,
                    amount :  parseFloat(lineSegment[i][this.orderLineType + "04"]) * parseFloat(lineSegment[i][this.orderLineType + "02"]),
                    deliveryDate:  this.getRequiredDeliveryDate()} as LineInfo;

                orderLines.push(orderLine);
            }
        }
        else
        {
            const lineSegment = this.findSegment(this.segments, this.orderLineType);

            for (let i = 0; i < lineSegment.length; ++i)
            {
                const orderLine = {
                    lineNumber: lineSegment[i][this.orderLineType + "01"],
                    customerPartNumber :  lineSegment[i][this.orderLineType + "09"],
                    qtyPerUOM :  `${lineSegment[i][this.orderLineType + "02"]}/${lineSegment[i][this.orderLineType + "03"]}`,
                    pricePerUOM :  `${lineSegment[i][this.orderLineType + "04"]}/${lineSegment[i][this.orderLineType + "03"]}`,
                    amount :  parseFloat(lineSegment[i][this.orderLineType + "04"]) * parseFloat(lineSegment[i][this.orderLineType + "02"]),
                    deliveryDate:  formatDateString(this.getRequiredDeliveryDate())} as LineInfo;

                orderLines.push(orderLine);
            }
            
        }

        return orderLines;
    }
}

export default LouisianaPacificPurchaseOrder;