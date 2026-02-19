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

function getCompanyNameFrom(subjectName) : String
{
    console.log(subjectName);
    const subjectNameElementsSplitByDash = subjectName.split('-');
    return subjectNameElementsSplitByDash[1].trim();
}

export default {formatDateString, getCompanyNameFrom};