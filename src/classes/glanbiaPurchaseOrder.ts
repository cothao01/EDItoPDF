import PurchaseOrder from "./purchaseOrder";
import LineInfo from "../interfaces/lineInfo";
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
        let lineType = "PO1";

        if (this.orderType == "CHANGE") 
        {    
            lineType = "POC";

            const lineSegment = this.findSegment(this.segments, lineType);

            for (let i = 0; i < lineSegment.length; ++i)
            {
                const orderLine = {
                    lineNumber: lineSegment[i][lineType + "01"],
                    customerPartNumber :  lineSegment[i][lineType + "09"],
                    qtyPerUOM :  `${lineSegment[i][lineType + "03"]}/${lineSegment[i][lineType + "05"]}`,
                    pricePerUOM :  `${lineSegment[i][lineType + "06"]}/${lineSegment[i][lineType + "05"]}`,
                    amount :  parseFloat(lineSegment[i][lineType + "03"]) * parseFloat(lineSegment[i][lineType + "06"]),
                    deliveryDate:  this.getRequiredDeliveryDate()} as LineInfo;

                orderLines.push(orderLine);
            }
        }
        else
        {
            lineType = "PO1";

            const lineSegment = this.findSegment(this.segments, lineType);

            for (let i = 0; i < lineSegment.length; ++i)
            {
                const orderLine = {
                    lineNumber: lineSegment[i][lineType + "01"],
                    customerPartNumber :  parseInt(lineSegment[i][lineType + "09"]).toString(),
                    qtyPerUOM :  `${lineSegment[i][lineType + "02"]}/${lineSegment[i][lineType + "03"]}`,
                    pricePerUOM :  `${lineSegment[i][lineType + "04"]}/${lineSegment[i][lineType + "03"]}`,
                    amount :  parseFloat(lineSegment[i][lineType + "04"]) * parseFloat(lineSegment[i][lineType + "02"]),
                    deliveryDate:  formatDateString(this.getRequiredDeliveryDate())} as LineInfo;

                orderLines.push(orderLine);
            }
            
        }

        return orderLines;
    }
}

export default GlanbiaPurchaseOrder;