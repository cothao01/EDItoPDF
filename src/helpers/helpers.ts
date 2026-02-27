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
    const subjectNameElementsSplitByDash = subjectName.split('-');
    return subjectNameElementsSplitByDash[1].trim();
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

export default {formatDateString, getCompanyNameFrom, isASpecialCharacter};