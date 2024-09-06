"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateData = void 0;
const validateData = (data) => {
    const eBayUrlRegex = /^https:\/\/www\.ebay\.com\/sch\/i\.html/;
    let invalidUrlCount = 0;
    let incompleteDataCount = 0;
    const invalidDataPositions = [];
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
exports.validateData = validateData;
