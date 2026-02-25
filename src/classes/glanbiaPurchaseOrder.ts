import PurchaseOrder from "./purchaseOrder";
import LineInfo from "../interfaces/lineInfo";
import OrderType from "../enums/enums";
import helpers from "../helpers/helpers";

const {formatDateString} = helpers;

class GlanbiaPurchaseOrder extends PurchaseOrder
{
    getSegments() : Array<{}>
    {
        const ediSegments = this.ediString.split('~');
        const cleanedSegments = this.getCleanedEDISegmentsFrom(ediSegments);
        return cleanedSegments;
    }

    mapItemInfos() : void
    {    
           this.itemInfos = this.createItemInfos("PO107", "PID05"); 
    }

    // Glanbia has too many redundant messages, best to leave them out
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
                console.log("Party Type: " + partyType);
                this.stagePartyObject(i, partyType);            
            }
            else if (segmentName == "N1")
    		{
                partyType = this.segments[i]["N101"];
                this.stagePartyObject(i, partyType);            
    		}

    	}

        this.cleanPartyInfo();
    }    
    
    getOrderLines() : Array<LineInfo>
    {
        const orderLines : Array<LineInfo> = [];

        if (this.orderType == OrderType.CHANGE) 
        {    

            const lineSegment = this.findSegment(this.segments, this.orderType);

            for (let i = 0; i < lineSegment.length; ++i)
            {
                const orderLine = {
                    lineNumber: lineSegment[i][this.orderType + "01"],
                    customerPartNumber :  lineSegment[i][this.orderType + "09"],
                    qtyPerUOM :  `${lineSegment[i][this.orderType + "03"]}/${lineSegment[i][this.orderType + "05"]}`,
                    pricePerUOM :  `${lineSegment[i][this.orderType + "06"]}/${lineSegment[i][this.orderType + "05"]}`,
                    amount :  parseFloat(lineSegment[i][this.orderType + "03"]) * parseFloat(lineSegment[i][this.orderType + "06"]),
                    deliveryDate:  this.getRequiredDeliveryDate()} as LineInfo;

                orderLines.push(orderLine);
            }
        }
        else
        {
            const lineSegment = this.findSegment(this.segments, this.orderType);

            for (let i = 0; i < lineSegment.length; ++i)
            {
                const orderLine = {
                    lineNumber: lineSegment[i][this.orderType + "01"],
                    customerPartNumber :  parseInt(lineSegment[i][this.orderType + "09"]).toString(),
                    qtyPerUOM :  `${lineSegment[i][this.orderType + "02"]}/${lineSegment[i][this.orderType + "03"]}`,
                    pricePerUOM :  `${lineSegment[i][this.orderType + "04"]}/${lineSegment[i][this.orderType + "03"]}`,
                    amount :  parseFloat(lineSegment[i][this.orderType + "04"]) * parseFloat(lineSegment[i][this.orderType + "02"]),
                    deliveryDate:  formatDateString(this.getRequiredDeliveryDate())} as LineInfo;

                orderLines.push(orderLine);
            }
            
        }

        return orderLines;
    }
}

export default GlanbiaPurchaseOrder;