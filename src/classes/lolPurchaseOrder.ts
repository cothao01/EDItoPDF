import PurchaseOrder from "./purchaseOrder";
import LineInfo from "../interfaces/lineInfo";
import OrderType from "../enums/enums";
import helpers from "../helpers/helpers";

const {formatDateString} = helpers;

class LandOLakesPurchaseOrder extends PurchaseOrder
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
           this.itemInfos = this.createItemInfos("PO107", null, "PID05"); 
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

    cleanPartyInfo() : void
    {
    // If not POC (change order), inject first PER segment into Buyer

        if ((this.orderType !== OrderType.CHANGE || this.orderType as OrderType !== OrderType.LEPRINO_CHANGE) && this.parties["Buyer"]) {
            const perSegment = this.segments.find(seg => seg["segment"] === "PER");
        if (perSegment) {
            // Extract phone and email from PER segment
            let perNumbers = [];
            let perEmails = [];
            for (let key in perSegment) {
                if (typeof perSegment[key] === "string") {
                    const val = perSegment[key];
                    const emailMatches = val.match(/([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi);
                    if (emailMatches) perEmails = perEmails.concat(emailMatches);
                    const phoneMatches = val.match(/\d{3,}[- ]?\d{2,}[- ]?\d{2,}/g);
                    if (phoneMatches) perNumbers = perNumbers.concat(phoneMatches);
                }
            }
            // Place in last Buyer slot
            const buyerKeys = Object.keys(this.parties["Buyer"]);
            const lastKey = buyerKeys[buyerKeys.length - 1];
            this.parties["Buyer"][lastKey] = [...perNumbers, ...perEmails].join(' ');
        }
    }
	for (let party in this.parties) {
        for (let index in this.parties[party]) {
            let address = "";
            let extraFields = [];
            // For Buyer, only show the last key (email and number)
            if (party === "Buyer") {
                const buyerKeys = Object.keys(this.parties[party]);
                const lastKey = buyerKeys[buyerKeys.length - 1];
                if (index !== lastKey) {
                    this.parties[party][index] = "";
                    continue;
                } else {
                    // Already handled above for change order
                    continue;
                }
            }
            for (let info in this.parties[party][index]) {
                if (!this.isCommonPartyIdentifier(this.parties[party][index][info])) {
                    const infoElement = this.parties[party][index][info];
                    if (!this.isPartyInfoElementUseful(infoElement)) {
                        if (typeof infoElement === "string") {
                            const emailMatches = infoElement.match(/([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi);
                            const phoneMatches = infoElement.match(/\d{3,}[- ]?\d{2,}[- ]?\d{2,}/g);
                            let cleaned = infoElement;
                            if (emailMatches) {
                                emailMatches.forEach(email => {
                                    extraFields.push(email);
                                    cleaned = cleaned.replace(email, "");
                                });
                            }
                            if (phoneMatches) {
                                phoneMatches.forEach(phone => {
                                    extraFields.push(phone);
                                    cleaned = cleaned.replace(phone, "");
                                });
                            }
                            if (cleaned.trim()) address += cleaned.trim() + ' ';
                        } else {
                            address += this.parties[party][index][info] + ' ';
                        }
                    }
                    console.log(infoElement);
                }
            }
            this.parties[party][index] = address;
            let extraIndex = Number(index) + 1;
            extraFields.forEach(val => {
                this.parties[party][extraIndex++] = val;
            });
        }
    }

    this.parties["Buyer"] = {"1": this.parties["ShipTo"][(Object.keys(this.parties["ShipTo"]).length- 1).toString()]}; 
    delete this.parties["ShipTo"][(Object.keys(this.parties["ShipTo"]).length- 1).toString()];
    }
}

export default LandOLakesPurchaseOrder;