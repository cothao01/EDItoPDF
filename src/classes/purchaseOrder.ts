import helpers from "../helpers/helpers";
import LineInfo from "../interfaces/lineInfo";
import ItemInfo from "../interfaces/itemInfo";
import OrderInfo from "../interfaces/orderInfo";
import OrderType from "../enums/enums";

//hello
const {normalizeId, formatDateString, isASpecialCharacter} = helpers;

class PurchaseOrder
{
    poNumber    : Number;
    poDate      : String;
    orderType   : String;
    orderLines  : Array<LineInfo>;
    notes       : Array<{}>;
    parties     : {} = {};
    segments    : Array<{}>;
    ediString   : string;
    itemInfos   : Array<ItemInfo>;
    messages    : Array<{}>;
    orderLineType : string;
    delimiter : string;
    orderLineLength : number;
    globalSegmentIndex = 0;

    constructor(ediString)
    {
        this.ediString = ediString;
        this.segments = this.getSegments();
        this.setDelimiter();
        this.orderType = this.getOrderType();
        this.poNumber = this.getPONumber();
        this.poDate = "";
        this.mapPODate();
        this.orderLineType = this.getOrderLineType();
        this.orderLineLength = this.getOrderLineLength();
        this.orderLines = this.getOrderLines();
        this.notes = this.getNotes();
        this.parties = this.getParties();
        this.itemInfos = this.createItemInfos(this.getSegmentPositionPO(), this.getSegmentPositionPO2(), this.getSegmentPositionPID());
        this.messages = this.getMessages();
    }

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
            cleanedSegments = cleanedSegments.slice(1);
        }
        return cleanedSegments;
    }

    setDelimiter() : void
    {
        const delimiterCounts = {};
        const specialCharacters = ['~', '\n', '\r\n'];
        for (let char of specialCharacters) {
            delimiterCounts[char] = (this.ediString.split(char).length - 1);
        }
        const currentMax = {};
        let maxCount = 0;
        for (let delim in delimiterCounts) {
            if (delimiterCounts[delim] > maxCount) {
                maxCount = delimiterCounts[delim];
                Object.keys(currentMax).forEach(k => delete currentMax[k]);
                currentMax[delim] = delimiterCounts[delim];
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

    getCleanedEDISegmentsFrom(ediSegments) : Array<{}>
    {
        const cleanedSegments = [];
        for (let segment of ediSegments)
        {
            const segmentInfo = this.parseEDISegment(segment);
            segmentInfo["index"] = this.globalSegmentIndex++;
            console.log("Segment " + this.globalSegmentIndex + ": " + JSON.stringify(segmentInfo));
    		cleanedSegments.push(segmentInfo);
    	}
    
    	return cleanedSegments;
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

    getOrderType() : String
    {
        const stSegment = this.findSegment(this.segments, "ST")[0];
        if (!stSegment) return OrderType.NEW;

        const orderTypeCode = stSegment["ST01"];
        if (orderTypeCode == "860")
        {
            return OrderType.CHANGE;
        }
        return OrderType.NEW;
    }

    getPONumber() : Number
    {
        let poNumber;

        console.log("ORDER TYPE: " + this.orderType);
        switch (this.orderType)
        {
            case OrderType.CHANGE:
            {
                const bchSegment = this.findSegment(this.segments, "BCH")[0];
                poNumber = bchSegment ? bchSegment["BCH03"] : null;
                break;
            }
            case OrderType.NEW:
            {
                const begSegment = this.findSegment(this.segments, "BEG")[0];
                poNumber = begSegment ? begSegment["BEG03"] : null;
                break;
            }
            default:
                poNumber = null;
        }

        return poNumber;
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

    getOrderLineType() : string
    {
        const orderType = this.orderType;
        if (orderType == OrderType.CHANGE)
        {
            return "POC";
        }
        return "PO1";
    }

    getOrderLineLength() : number
    {
        return this.findSegment(this.segments, this.orderLineType).length;
    }

    getOrderLines() : Array<LineInfo>
    {
        const orderLines = [];
        for (let i = 0; i < this.orderLineLength; i++)
        {
            const orderLine = this.getOrderLine(i);
            orderLines.push(orderLine);
        }
        return orderLines;
    }

    getOrderLine(lineNumber) : LineInfo
    {
        const orderLineSegment = this.findSegment(this.segments, this.orderLineType)[lineNumber];
        const linePrefix = this.orderLineType;

        const lineInfo = {} as LineInfo;
        lineInfo["lineNumber"] = orderLineSegment[linePrefix + "01"];

        const deliveryDateSegments = this.findSegment(this.segments, "DTM");
        const deliveryDateSegment = deliveryDateSegments.length > lineNumber 
            ? deliveryDateSegments[lineNumber] 
            : deliveryDateSegments[0];

        lineInfo["deliveryDate"] = deliveryDateSegment 
            ? formatDateString(deliveryDateSegment["DTM02"]) 
            : "";

        if (linePrefix == "PO1")
        {
            lineInfo["customerPartNumber"] = orderLineSegment[linePrefix + "07"];
            lineInfo["qtyPerUOM"] = orderLineSegment[linePrefix + "02"] + "/" + orderLineSegment[linePrefix + "03"];
            lineInfo["pricePerUOM"] = orderLineSegment[linePrefix + "04"] + "/" + orderLineSegment[linePrefix + "03"];
            lineInfo["amount"] = parseFloat(orderLineSegment[linePrefix + "02"]) * parseFloat(orderLineSegment[linePrefix + "04"]);
        }
        else if (linePrefix == "POC")
        {
            lineInfo["customerPartNumber"] = orderLineSegment[linePrefix + "09"];
            lineInfo["qtyPerUOM"] = orderLineSegment[linePrefix + "03"] + "/" + orderLineSegment[linePrefix + "05"];
            lineInfo["pricePerUOM"] = orderLineSegment[linePrefix + "06"] + "/" + orderLineSegment[linePrefix + "05"];
            lineInfo["amount"] = parseFloat(orderLineSegment[linePrefix + "03"]) * parseFloat(orderLineSegment[linePrefix + "06"]);
        }

        return lineInfo;
    }

    getNotes() : Array<{}>
    {
        return this.findSegment(this.segments, "PID");
    }

    getSegmentPositionPO() : string
    {
        if (this.orderLineType == "POC")
        {
            return "POC013";
        }
        return "PO107";
    }

    getSegmentPositionPO2() : string
    {
        if (this.orderLineType == "POC")
        {
            return "POC011";
        }
        return "PO106";
    }

    getSegmentPositionPID() : string
    {
        return "PID05";
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
    			let numberOfPartyFields = this.findFieldAmountPerParty(this.segments, i);
    			const partyType = this.segments[i]["N101"];
    			const partyInfo = this.getPartyInfo(this.segments, i, numberOfPartyFields);
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
    	}

    	return this.parties;
    }

    findFieldAmountPerParty(ediSegments, currentSegmentIndex)
    {
        let fieldCounter = 1;
        let nextSegmentInSequence = currentSegmentIndex + 1;

        while (nextSegmentInSequence < ediSegments.length && this.isCommonPartyIdentifier(ediSegments[nextSegmentInSequence]["segment"]))
        {
            ++fieldCounter;
            ++nextSegmentInSequence;
        }

        return fieldCounter;
    }

    getPartyInfo(ediSegments, currentSegmentIndex, numberOfPartyFields)
    {
        const partyInfo = {};
        for (let i = 0; i < numberOfPartyFields; ++i)
        {
            partyInfo[i] = ediSegments[currentSegmentIndex + i]
        }
        return partyInfo;
    }

    isCommonPartyIdentifier(identifier)
    {
        return identifier == "N2" ||
        identifier == "N3" ||
        identifier == "N4" ||
        identifier == "PER";
    }

    getRequiredDeliveryDate() : String
    {
        return formatDateString(this.findSegment(this.segments, "DTM")[0]["DTM02"]);
    }

    getNotes2() : Array<{}>
    {
        return this.findSegment(this.segments, "MSG");
    }

    getMessages() : Array<{}>
    {
        return this.getNotes2();
    }

    getPurchaseOrder() : OrderInfo
    {
        return {
            poNumber: this.poNumber,
            poDate: this.poDate,
            orderType: this.orderType,
            orderLines: this.orderLines,
            notes: this.notes,
            parties: this.parties,
            itemInfos: this.itemInfos,
            messages: this.messages,
        } as OrderInfo;
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

            let itemNumber = itemNumberSegment[segmentPositionPO];
            let itemNumber2 = itemNumberSegment[segmentPositionPO2];
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

        return stagedItemInfos;
    }

    createItemInfo(itemNumber, itemNumber2, itemDescription, index = null) : ItemInfo
    {
        return {itemNumber: itemNumber, itemNumber2: itemNumber2, itemDescription: itemDescription, index: index} as ItemInfo;
    }

    getOrderLines2() : Array<LineInfo>
    {
        return this.orderLines;
    }
}

export default PurchaseOrder;
