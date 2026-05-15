import OrderType from "../enums/enums";

function formatDateString(dateStr) {
    // Expecting YYYYMMDD
    if (typeof dateStr === 'string' && dateStr.length === 8) {
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        return `${month}/${day}/${year}`;
    }
    return dateStr;
}

function splitEdiByPurchaseOrder(ediString) : Array<String>
{
    const parts = ediString
    .split(/(?=BEG\})/g)   // split at positions right before "BEG}"
    .filter(p => p.startsWith("BEG}")); // remove header chunk before first BEG, if any

    const parts2 = ediString
    .split(/(?=BEG\*)/g)   // split at positions right before "BEG}"
    .filter(p => p.startsWith("BEG*")); // remove header chunk before first BEG, if any

    let choseParts = parts;

    if (parts.length < parts2.length)
    {
        choseParts = parts2;
    }

    if (choseParts.length < 2) return [ediString];
 
    return choseParts;
}

function getCompanyNameFrom(subjectName) : String
{
    const subjectNameElementsSplitByDash = subjectName.split('-');
    return subjectNameElementsSplitByDash[1].trim();
}

function getCustomerNumberFrom(subjectName, companyName, orderType) : String
{

    if (companyName == 'LEPRINO' && (orderType == OrderType.LEPRINO_CHANGE))
    {
        const subjectNameElementsSplitByDash = subjectName.split('-');
        return subjectNameElementsSplitByDash[3].split(' ')[6];
    }

    const subjectNameElementsSplitByDash = subjectName.split('-');
    return subjectNameElementsSplitByDash[2].split(' ')[6];
}

function transformSubjectNameFrom(subjectName, orderType, poNumber, customerNumber) : String
{
    const subjectNameElementsSplitByDash = subjectName.split('-');
    if (orderType & (OrderType.CHANGE | OrderType.LEPRINO_CHANGE))
    {
       subjectNameElementsSplitByDash[0] = "CHANGE"; 
    }
    else
    {
       subjectNameElementsSplitByDash[0] = "NEW"; 
    }

    subjectNameElementsSplitByDash[2] = `PO# ${poNumber}`;

    subjectNameElementsSplitByDash[3] = `CUSTOMER# ${customerNumber}`;

    return subjectNameElementsSplitByDash.join(' - ');
}

function isASpecialCharacter(character) : Boolean
{
    const characterMap = 
    {
        '~': 1,
        '|': 1,
        '*': 1,
        '-': 1,
        '}': 1,
        '{': 1,
        '_': 1,
        '#': 1,
        '\\': 1,
        '/': 1,
        '(': 1,
        ')': 1,
        '.': 1,
        ';': 1,
    };

    return characterMap[character];
}

function normalizeId(input: string | number): string {
  const value = String(input).trim();

  // If it contains ANY letter, return as-is
  if (/[A-Za-z]/.test(value)) {
    return value;
  }

  // Remove leading zeros safely
  return value.replace(/^0+/, '') || '0';
}


export default {transformSubjectNameFrom, getCustomerNumberFrom,normalizeId, splitEdiByPurchaseOrder, formatDateString, getCompanyNameFrom, isASpecialCharacter};