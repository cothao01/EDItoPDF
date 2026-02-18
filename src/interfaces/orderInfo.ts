import LineInfo from "./lineInfo";
import ItemInfo from "./itemInfo";

interface OrderInfo
{
    poNumber    : Number;
    orderType   : String;
    poDate   : String;
    messages    : Array<{}>;
    segments    : Array<{}>;
    notes    : Array<{}>;
    parties     : {};   
    orderLines    : Array<LineInfo>;
    itemInfos   : Array<ItemInfo>;
}

export default OrderInfo;