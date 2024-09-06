export interface CSVData {
    identity: string;
    eBayURL: string;
    currency: string;
    rank: number;
}

export const validateData = (data: CSVData[]) => {
    const eBayUrlRegex = /^https:\/\/www\.ebay\.com\/sch\/i\.html/;

    let invalidUrlCount = 0;
    let incompleteDataCount = 0;
    const invalidDataPositions: number[] = [];

    data.forEach((item, index) => {
        const { identity, eBayURL, currency, rank } = item;

        // Check if any of the fields are missing
        if (!identity || !eBayURL || !currency || rank === undefined) {
            incompleteDataCount++;
            invalidDataPositions.push(index);
        }

        // Check if the eBay URL does not match the regex
        if (!eBayUrlRegex.test(eBayURL)) {
            invalidUrlCount++;
        }
    });

    return {
        invalidUrlCount,
        incompleteDataCount,
        invalidDataPositions
    };
};
