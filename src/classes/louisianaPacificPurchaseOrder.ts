import PurchaseOrder from "./purchaseOrder";
import LineInfo from "../interfaces/lineInfo";
import OrderType from "../enums/enums";
import helpers from "../helpers/helpers";

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