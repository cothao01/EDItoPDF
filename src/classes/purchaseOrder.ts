import LineInfo from "../interfaces/lineInfo";
import ItemInfo from "../interfaces/itemInfo";
import formatDateString from "../helpers/helpers";

interface OrderInfo
{
    poNumber    : Number;
    orderType   : String;
    messages    : Array<{}>;
    segments    : Array<{}>;
    notes    : Array<{}>;
    parties     : {};   
    orderLines    : Array<LineInfo>;
    itemInfos   : Array<ItemInfo>;
}

class PurchaseOrder
{
    poNumber    : Number;
    ediString   : String;
    orderType   : String;
    notes    : Array<{}>;
    segments    : Array<{}>;
    messages    : Array<{}>;
    itemInfos : Array<ItemInfo> = [];
    parties     : {};
    orderLines    : Array<LineInfo>;

    constructor(ediString)
    {
        this.ediString = ediString;
        this.segments = this.getSegments();
        this.parties = this.getParties();
        this.orderType = this.getOrderType();
        this.messages = this.getMessages();
        this.poNumber = this.getPONumber();
        this.notes = this.getNotes();
        this.orderLines = this.getOrderLines();
        this.mapItemInfos();
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
    		
    		if (dataElement == '*')
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

    getPONumber() : Number
    {
        let poNumber;

        switch (this.orderType)
        {
            case "CHANGE":
                poNumber = this.findSegment(this.segments, "BCH")[0]["BCH03"];
                return poNumber;
            case "NEW":
                poNumber = this.findSegment(this.segments, "BEG")[0]["BEG03"];
                return poNumber;
            default:
                return null;            
        }
    }

    getOrderType() : String
    {
        const poSegmentLength = this.findSegment(this.segments, "PO1").length;

        if (poSegmentLength < 1)
        {
            return "CHANGE";
        }

        return "NEW";
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

    getParties() : {}
    {
    	const parties = 
    	{
    		"ShipTo": {},
    		"BillTo": {},
    		"Buyer": {},
    		"ShipFrom": {},
    	};

    	for (let i = 0; i < this.segments.length; ++i)
    	{
    		const segmentName = this.segments[i]["segment"];
    		if (segmentName == "N1")
    		{
    			let numberOfPartyFields = this.findFieldAmountPerParty(i);
    			const partyType = this.segments[i]["N101"];
    			const partyInfo = this.getPartyInfo(i, numberOfPartyFields);
    			switch (partyType)
    			{
    				case "BY":
    				parties["Buyer"] = partyInfo;
    				break;
    				case "ST":
    				parties["ShipTo"] = partyInfo;
    				break;
    				case "BT":
    				parties["BillTo"] = partyInfo;
    				break;
    			}
    		}
    	}

    	return parties;
    }

    getSegments() : Array<{}>
    {
        const ediSegments = this.ediString.split('\n');
        const cleanedSegments = [];
    	for (let segment of ediSegments)
	    {
		    const segmentInfo = this.parseEDISegment(segment);

    		cleanedSegments.push(segmentInfo);
	    }
	
	    return cleanedSegments;
    }     

    getMessages() : Array<{}>
    {
        return this.findSegment(this.segments, "MSG");
    }

    getRequiredDeliveryDate() : String
    {
        return this.findSegment(this.segments, "DTM")[0]["DTM02"];
    }

    getNotes() : Array<{}>
    {
        return this.findSegment(this.segments, "PID");
    }

    mapItemInfos() : void
    {    
        for (let i = 0; i < this.notes.length; i++) 
        {
            const segment = this.notes[i];

            const itemSegment = this.findSegment(this.segments, "PO1");

            const itemInfo = {
                itemNumber: itemSegment[0]["PO1013"], 
                itemDescription: segment["PID05"]} as ItemInfo;

           this.itemInfos.push(itemInfo); 
        }
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
                    customerPartNumber :  lineSegment[i][lineType + "07"],
                    qtyPerUOM :  `${lineSegment[i][lineType + "02"]}/${lineSegment[i][lineType + "03"]}`,
                    pricePerUOM :  `${lineSegment[i][lineType + "04"]}/${lineSegment[i][lineType + "03"]}`,
                    amount :  parseFloat(lineSegment[i][lineType + "04"]) * parseFloat(lineSegment[i][lineType + "02"]),
                    deliveryDate:  formatDateString(this.getRequiredDeliveryDate())} as LineInfo;

                orderLines.push(orderLine);
            }
            
        }

        return orderLines;
    }

    getPurchaseOrder() : OrderInfo
    {
        return {
            segments: this.segments,
            parties: this.parties,
            orderType: this.orderType,
            messages: this.messages,
            poNumber: this.poNumber,
            orderLines: this.orderLines,
            notes: this.notes,
            itemInfos: this.itemInfos
        }
    }
}

export default PurchaseOrder;