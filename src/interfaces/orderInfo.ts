import LineInfo from "./lineInfo";
import ItemInfo from "./itemInfo";
import OrderType from "../enums/enums";

interface OrderInfo
{
    poNumber    : Number;
    orderType   : OrderType;
    poDate   : String;
    messages    : Array<{}>;
    segments    : Array<{}>;
    notes    : Array<{}>;
    parties     : {};   
    orderLines    : Array<LineInfo>;
    itemInfos   : Array<ItemInfo>;
}

export default OrderInfo;