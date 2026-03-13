import PurchaseOrder from "./purchaseOrder";
import LineInfo from "../interfaces/lineInfo";
import OrderType from "../enums/enums";
import helpers from "../helpers/helpers";

const {formatDateString} = helpers;

class ThreeMPurchaseOrder extends PurchaseOrder
{
    getSegments() : Array<{}>
    {
        const ediSegments = this.ediString.split('\n');
        const cleanedSegments = this.getCleanedEDISegmentsFrom(ediSegments);
        return cleanedSegments;
    }

    getMessages() : Array<{}>
    {
        return [];
    }
 
    mapItemInfos() : void
    {    
           this.itemInfos = this.createItemInfos("PO107", "PID05"); 
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
                    customerPartNumber :  lineSegment[i][this.orderLineType + "07"],
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
                    customerPartNumber :  lineSegment[i][this.orderLineType + "07"],
                    qtyPerUOM :  `${lineSegment[i][this.orderLineType + "02"]}/${lineSegment[i][this.orderLineType + "03"]}`,
                    pricePerUOM :  `${lineSegment[i][this.orderLineType + "04"]}/${lineSegment[i][this.orderLineType + "03"]}`,
                    amount :  parseFloat(lineSegment[i][this.orderLineType + "04"]) * parseFloat(lineSegment[i][this.orderLineType + "02"]),
                    deliveryDate:  formatDateString(this.getRequiredDeliveryDate())} as LineInfo;

                orderLines.push(orderLine);
            }
            
        }

        return orderLines;
    }

    getRequiredDeliveryDate(): String {
        return formatDateString(this.findSegment(this.segments, "DTM")[0]["DTM02"]);
    }

}

export default ThreeMPurchaseOrder;