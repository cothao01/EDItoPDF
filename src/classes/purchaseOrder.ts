import LineInfo from "../interfaces/lineInfo";
import ItemInfo from "../interfaces/itemInfo";
import helpers from "../helpers/helpers";
import OrderInfo from "../interfaces/orderInfo";
import OrderType from "../enums/enums";

const {formatDateString, isASpecialCharacter} = helpers;

class PurchaseOrder
{
    poNumber    : Number;
    ediString   : String;
    orderType   : OrderType;
    orderLineType   : String;
    poDate   : String = "";
    notes    : Array<{}>;
    segments    : Array<{}>;
    messages    : Array<{}>;
    itemInfos : Array<ItemInfo> = [];
    parties     : {} = {};
    orderLines    : Array<LineInfo>;
    delimiter : String;

    constructor(ediString)
    {
        this.ediString = ediString;
        this.mapEDIDelimiter();
        this.segments = this.getSegments();
        this.mapParties();
        this.orderType = this.getOrderType();
        this.mapOrderLineType();
        this.getPOLineGroup();        
        this.messages = this.getMessages();
        this.poNumber = this.getPONumber();
        this.mapPODate();
        this.notes = this.getNotes();
        this.orderLines = this.getOrderLines();
        this.mapItemInfos();
    }

    mapEDIDelimiter()
    {
        const characterCountObject = {};
        let key = 'a';
        let currentMax = {[key]: 0};

        for (let i = 0; i < this.ediString.length; ++i)
        {
            if (!characterCountObject[this.ediString[i]] && 
                isASpecialCharacter(this.ediString[i]))
            {
                characterCountObject[this.ediString[i]] = 1;
            }
            else
            {
                ++characterCountObject[this.ediString[i]];
                if (characterCountObject[this.ediString[i]] > currentMax[[key][0]])
                {
                    const currentKey = this.ediString[i];
                    currentMax = {[currentKey]: characterCountObject[this.ediString[i]]};
                }
            }
        }

        this.delimiter = Object.keys(currentMax)[0];
    }

    findSegment(segments, segmentID) : Array<{}>
    {
    	const foundSegments = []

    	for (let segment of segments)
	    {
		    if (segment["segment"] == segmentID) foundSegments.push(segment); 
	    }

    	return foundSegments;
    }

    // For RH, create rule for * or ~ splitting
    parseEDISegment(segment) : {}
    {
    	let field = '';
    	let dataElementIndex = 0;
    	let segmentCharacterIndex = 0;
    	let dataElement = segment[segmentCharacterIndex];
    	const segmentInfo = {};

    	while (segmentCharacterIndex < segment.length)
    	{
    		dataElement = segment[segmentCharacterIndex];
    		if (dataElement == this.delimiter)
    		{
    			if (dataElementIndex == 0)
    			{
    				segmentInfo["segment"] = field;
    			}
    			else
    			{
    				const segmentID = segmentInfo["segment"];
    				segmentInfo[segmentID + '0' + dataElementIndex] = field;
    			}
    			dataElementIndex++;
    			segmentCharacterIndex++;
    			field = '';
    			continue;
    		};


    		field = field + segment[segmentCharacterIndex]
    		++segmentCharacterIndex;
    	}

    	const segmentID = segmentInfo["segment"];
    	segmentInfo[segmentID + '0' + dataElementIndex] = field;

    	return segmentInfo;  
    }
    
    isCommonPartyIdentifier(identifier) : Boolean
    {
	    return identifier == "N2" ||
	    identifier == "N3" ||
	    identifier == "N4" ||
	    identifier == "PER";
    }

    findFieldAmountPerParty(currentSegmentIndex) : Number
    {
    	let fieldCounter = 1;
	    let nextSegmentInSequence = currentSegmentIndex + 1;

    	while (this.isCommonPartyIdentifier(this.segments[nextSegmentInSequence]["segment"]))
	    {
		    ++fieldCounter;
		    ++nextSegmentInSequence;
	    }

    	return fieldCounter;
    }

    getCleanedEDISegmentsFrom(ediSegments) : Array<{}>
    {
        const cleanedSegments = [];
        for (let segment of ediSegments)
	    {
		    const segmentInfo = this.parseEDISegment(segment);

    		cleanedSegments.push(segmentInfo);
	    }
	
	    return cleanedSegments;
    }

    stagePartyObject(segmentIndex, partyType) : void
    {
        let numberOfPartyFields = this.findFieldAmountPerParty(segmentIndex);
        const partyInfo = this.getPartyInfo(segmentIndex, numberOfPartyFields);

        switch (partyType)
        {
       	    case "BY":
            this.parties["Buyer"] = partyInfo;
       	    break;
       	    case "ST":
            this.parties["ShipTo"] = partyInfo;
       	    break;
       	    case "BT":
            this.parties["BillTo"] = partyInfo;
       	    break;
        }
 
    }

    getPONumber() : Number
    {
        let poNumber = this.findSegment(this.segments, "BEG")[0]["BEG03"];
        return poNumber; 
    }

    mapPODate() : void
    {
        const begSegment = this.findSegment(this.segments, "BEG")[0];
        if (begSegment && begSegment["BEG05"]) {
            this.poDate = formatDateString(begSegment["BEG05"]);
        } 
    }

    // Leprino is the only customer as of today that uses POC as the Order Line Type for
    // Change Orders. Keeping it as NEW for everyone helps keep it consistent

    mapOrderLineType() : void
    {
        switch(this.orderType)
        {
            case OrderType.NEW:
                this.orderLineType = "PO1";
                break;
            case OrderType.CHANGE:
                this.orderLineType = "PO1";
                break;
            case OrderType.LEPRINO_CHANGE:
                this.orderLineType = "POC"
        }
    };

    getOrderType() : OrderType
    {
        const poSegment = this.findSegment(this.segments, "BEG");

        const poSegmentLength = this.findSegment(this.segments, "BEG").length;

        if (poSegmentLength < 1 || parseInt(poSegment[0]["BEG01"]) > 0)
        {
            return OrderType.CHANGE;
        }

        return OrderType.NEW;
    }

    isPartyInfoElementUseful(info) : Boolean
    {
	    return (
		info == 'N1' ||
		info == 'BY' ||
		info == 'BT' ||
		info == 'ST' ||
		info == 'SF' ||
		info == 'ZZ' ||
		info == 'PP' ||
		info == 'FX' ||
		info == 'EM'
	);
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

    getPartyInfo(currentSegmentIndex, numberOfPartyFields) : {}
    {
    	const partyInfo = {};
	    for (let i = 0; i < numberOfPartyFields; ++i)
	    {
		    partyInfo[i] = this.segments[currentSegmentIndex + i]
	    }
	    return partyInfo;
    }

    mapParties() : void
    {
    	for (let i = 0; i < this.segments.length; ++i)
    	{
            const segmentName = this.segments[i]["segment"];
            if (segmentName == "N1")
            {
                const partyType = this.segments[i]["N101"];
                this.stagePartyObject(i, partyType);
            }
        }

        this.cleanPartyInfo();
    }

    getSegments() : Array<{}>
    {
        const ediSegments = this.ediString.split('\n');
        const cleanedSegments = this.getCleanedEDISegmentsFrom(ediSegments);
	    return cleanedSegments;
    }     

    getMessages() : Array<{}>
    {
        return this.findSegment(this.segments, "MSG");
    }

    getRequiredDeliveryDate() : String
    {
        return formatDateString(this.findSegment(this.segments, "DTM")[0]["DTM02"]);
    }

    getNotes() : Array<{}>
    {
        return this.findSegment(this.segments, "PID");
    }

    determineChangeOrNewOrderLine(newOrderLine, changeOrderLine)
    {
        let purchaseOrderLineSegmentName;
        if (this.orderType == OrderType.NEW)
        {
            purchaseOrderLineSegmentName = newOrderLine;
        }
        else if (this.orderType == OrderType.CHANGE || this.orderType == OrderType.LEPRINO_CHANGE)
        {
            purchaseOrderLineSegmentName = changeOrderLine;
        }; 
        
        return purchaseOrderLineSegmentName;
    }

    mapItemInfos() : void
    {    
        let purchaseOrderLineSegmentName = this.determineChangeOrNewOrderLine("PO1013", "POC011");
        this.itemInfos = this.createItemInfos(purchaseOrderLineSegmentName, "PID05"); 
    }

    mapItemNumbers()
    {
        //this.findSegment(this.segments, );
    }

    createItemInfos(segmentPositionPO, segmentPositionPID) : Array<ItemInfo>
    {
        const stagedItemInfos : Array<ItemInfo> = [];
        for (let i = 0; i < this.notes.length; i++) 
        {
            const itemDescription = this.notes[i][segmentPositionPID];
            const itemNumber = this.findSegment(this.segments, this.orderLineType)[0][segmentPositionPO];

            const itemInfo = this.createItemInfo(itemNumber, itemDescription);

            stagedItemInfos.push(itemInfo); 
        }

        return stagedItemInfos;
    }

    createItemInfo(itemNumber, itemDescription) : ItemInfo
    {
        return {itemNumber: itemNumber, itemDescription: itemDescription} as ItemInfo;
    }

    getOrderLines() : Array<LineInfo>
    {
        const orderLines : Array<LineInfo> = [];

        if (this.orderType & (OrderType.CHANGE | OrderType.LEPRINO_CHANGE)) 
        {    
            const lineSegment = this.findSegment(this.segments, this.orderLineType);

            for (let i = 0; i < lineSegment.length; ++i)
            {
                const orderLine = {
                    lineNumber: lineSegment[i][this.orderLineType + "01"],
                    customerPartNumber :  lineSegment[i][this.orderLineType + "09"],
                    qtyPerUOM :  `${lineSegment[i][this.orderLineType + "03"]}/${lineSegment[i][this.orderLineType + "05"]}`,
                    pricePerUOM :  `${lineSegment[i][this.orderLineType + "06"]}/${lineSegment[i][this.orderLineType + "05"]}`,
                    amount :  parseFloat(lineSegment[i][this.orderLineType + "03"]) * parseFloat(lineSegment[i][this.orderLineType + "06"]),
                    deliveryDate:  this.getRequiredDeliveryDate()} as LineInfo;

                orderLines.push(orderLine);
            }
        }
        else
        {
            const lineSegment = this.findSegment(this.segments, this.orderLineType);

            for (let i = 0; i < lineSegment.length; ++i)
            {
                console.log("Order Line Type: " + this.orderLineType);
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

    getPOLineGroup()
    {
        for (let i = 0; i < this.segments.length; ++i)
        {
            const segmentName = this.segments[i]["segment"];

            if (segmentName == this.orderLineType)
            {
                let segmentIndex = i;
                while (this.segments[segmentIndex]["segment"] != "SCH" && 
                    this.segments[segmentIndex + 1] != undefined
                )
                {
                    ++segmentIndex;
                }      
            }
        }
    }

    getPurchaseOrder() : OrderInfo
    {
        return {
            segments: this.segments,
            parties: this.parties,
            orderType: this.orderType,
            messages: this.messages,
            poNumber: this.poNumber,
            poDate: this.poDate,
            orderLines: this.orderLines,
            notes: this.notes,
            itemInfos: this.itemInfos
        }
    }
}

export default PurchaseOrder;