import PurchaseOrder from "./purchaseOrder";
import LineInfo from "../interfaces/lineInfo";
import OrderType from "../enums/enums";
import helpers from "../helpers/helpers";
import ItemInfo from "../interfaces/itemInfo";

const {formatDateString} = helpers;

class GlanbiaPurchaseOrder extends PurchaseOrder
{
    getSegments() : Array<{}>
    {
        const MINIMUM_EDI_SEGMENTS = 10;

        let ediSegments = this.ediString.split('~');
        if (ediSegments.length < MINIMUM_EDI_SEGMENTS)
        {
            ediSegments = this.ediString.split('\r\n');
        }

        if (ediSegments.length < MINIMUM_EDI_SEGMENTS)
        {
            ediSegments = this.ediString.split('\n');
        }


        
        let cleanedSegments = this.getCleanedEDISegmentsFrom(ediSegments);
        if (Object.keys(cleanedSegments[0])[0] == "undefined00")
        {
            ediSegments = this.ediString.split('^');
            cleanedSegments = this.getCleanedEDISegmentsFrom(ediSegments);
        };
        return cleanedSegments;
    }

    createItemInfos(segmentPositionPO, segmentPositionPID) : Array<ItemInfo>
    {
        const stagedItemInfos : Array<ItemInfo> = [];
        const cleanedItemInfos : Array<ItemInfo> = [];
        const itemsItemInfo : Array<ItemInfo> = [];

        for (let i = 0; i < this.notes.length; i++) 
        {
            const itemDescription = this.notes[i][segmentPositionPID];
            const itemNumber = this.findSegment(this.segments, this.orderLineType)[0][segmentPositionPO];

            const itemInfo = this.createItemInfo(itemNumber, null,itemDescription);

            stagedItemInfos.push(itemInfo); 
        }

        for (let j = 0; j < this.orderLineLength; j++)
        {
            const itemNumber = this.findSegment(this.segments, this.orderLineType)[j][segmentPositionPO];
            const itemInfo = this.createItemInfo(itemNumber, null, null);
            itemsItemInfo.push(itemInfo);
        }

        let itemNumberIndex = 0;
        console.log("ITEM NUMBER SIZE: " + itemsItemInfo.length);
        for(let k = 0; k < stagedItemInfos.length; k++)
        {
            if (stagedItemInfos[k].itemDescription)
            {
                cleanedItemInfos.push(this.createItemInfo(
                    itemsItemInfo[itemNumberIndex].itemNumber, 
                    null,
                    stagedItemInfos[k].itemDescription))
                    
                ++itemNumberIndex;
            }
        }

        return cleanedItemInfos;
    }


    mapItemInfos() : void
    {    
           this.itemInfos = this.createItemInfos("PO107", "PID05"); 
    }

    getRequiredDeliveryDate() : String
    {
        const dtmSegments = this.findSegment(this.segments, "DTM");
        /*if (!dtmSegments || dtmSegments.length === 0 || !dtmSegments[0]["DTM02"])
        {
            return "No delivery date received";
        }*/
        return dtmSegments[0]["DTM02"];
    }

    // Glanbia has too many redundant messages, best to leave them out
    getMessages() : Array<{}>
    {
        return [{}];
    }
    
    mapParties() : void
    {
        let n2Count = 0;
        let shipToMapped = false;
        const parties = 
        {
            0 : "ST"
        }

    	for (let i = 2; i < this.segments.length; ++i)
    	{
    		const segmentName = this.segments[i]["segment"];

            let partyType;

            if (this.isCommonPartyIdentifier(segmentName) || segmentName == "N1")
            {
         		const previousSegmentName = this.segments[i - 1]["segment"];
        		const skipPreviousSegmentName = this.segments[i - 2]["segment"];
        		const nextSegmentName = this.segments[i+1]["segment"];
           
                if ((segmentName == "N2" && previousSegmentName != "N1") ||
                    (segmentName == "N3" && previousSegmentName !== "N2" && (skipPreviousSegmentName != "N1" || nextSegmentName == "N4")
                ) && !shipToMapped
            )
                {
                    partyType = parties[n2Count];
                    console.log("Party Type: " + partyType);
                    this.stagePartyObject(i, partyType);            
                    shipToMapped = true;
                }
                else if (segmentName == "N1")
    		    {
                    partyType = this.segments[i]["N101"];
                    this.stagePartyObject(i, partyType);            
    		    }
            }
    	}
        if (!this.parties["Buyer"])
        {
            this.parties["Buyer"] = this.findSegment(this.segments, "PER")[0];
        }
        console.log("PARITES HERE: " + JSON.stringify(this.parties));
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
                    customerPartNumber :  parseInt(lineSegment[i][this.orderLineType + "09"]).toString(),
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
    }
}

export default GlanbiaPurchaseOrder;