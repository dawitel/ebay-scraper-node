"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const puppeteer_extra_1 = __importDefault(require("puppeteer-extra"));
const puppeteer_extra_plugin_stealth_1 = __importDefault(require("puppeteer-extra-plugin-stealth"));
const fs_1 = __importDefault(require("fs"));
const papaparse_1 = __importDefault(require("papaparse"));
const axios_1 = __importDefault(require("axios"));
const validateData_1 = require("../utils/validateData");
puppeteer_extra_1.default.use((0, puppeteer_extra_plugin_stealth_1.default)());
const scrapeRouter = express_1.default.Router();
scrapeRouter.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { filePath, email, storeName } = req.body;
        console.log('email:', email, 'storename:', storeName, 'filepath:', filePath);
        // Read and parse the CSV file
        const csvData = fs_1.default.readFileSync(filePath, 'utf-8');
        const parsedData = papaparse_1.default.parse(csvData, {
            header: true,
            skipEmptyLines: true,
        }).data;
        // Validate the data
        const result = (0, validateData_1.validateData)(parsedData);
        if (result.incompleteDataCount > 0) {
            return res.status(400).json({
                error: `The CSV file contains incomplete data. Amount = ${result.incompleteDataCount}. Rows: ${result.invalidDataPositions.join(', ')}`,
            });
        }
        if (result.invalidUrlCount > 0) {
            return res.status(400).json({
                error: `The CSV file contains invalid URLs. Amount = ${result.invalidUrlCount}`,
            });
        }
        console.log('Parsed data:', parsedData);
        // Launch Puppeteer with stealth plugin to make it undetectable by eBay
        const browser = yield puppeteer_extra_1.default.launch({
            headless: true, // Enable headless mode in production
            args: ['--no-sandbox', '--disable-setuid-sandbox'], // Necessary for production environments
        });
        // Scraping function with retry logic and error handling
        const scrapePage = (ebayUrl_1, storeName_1, ...args_1) => __awaiter(void 0, [ebayUrl_1, storeName_1, ...args_1], void 0, function* (ebayUrl, storeName, retries = 3) {
            const page = yield browser.newPage();
            try {
                yield page.goto(ebayUrl, { waitUntil: 'domcontentloaded', timeout: 60000 }); // 60 seconds timeout
                // Find the rank of the store
                const rank = yield page.evaluate((storeName) => {
                    const listings = Array.from(document.querySelectorAll('span.s-item__location.s-item__itemLocation'));
                    let foundRank = 0;
                    listings.some((el, index) => {
                        const text = el.textContent || ''; // Null check
                        if (text.includes(storeName)) {
                            foundRank = index + 1; // Rank starts from 1
                            return true; // Exit loop when found
                        }
                        return false;
                    });
                    return foundRank;
                }, storeName);
                // Find the currency symbol
                const currency = yield page.evaluate(() => {
                    var _a;
                    const priceElement = document.querySelector('span.s-item__price');
                    return priceElement ? ((_a = priceElement.textContent) === null || _a === void 0 ? void 0 : _a.trim().charAt(0)) || 'USD' : 'USD';
                });
                yield page.close();
                return {
                    identity: storeName,
                    eBayURL: ebayUrl,
                    rank: rank || 0, // Default to 0 if not found
                    currency: currency || 'USD', // Default to USD if not found
                };
            }
            catch (error) {
                console.error(`Error scraping URL ${ebayUrl}:`, error);
                yield page.close();
                if (retries > 0) {
                    console.log(`Retrying... Attempts left: ${retries}`);
                    return scrapePage(ebayUrl, storeName, retries - 1);
                }
                return {
                    identity: storeName,
                    eBayURL: ebayUrl,
                    rank: 0,
                    currency: 'USD', // Fallback values
                };
            }
        });
        // Scrape data with rate limiting (throttle requests)
        const scrapeData = [];
        for (const item of parsedData) {
            const ebayUrl = item['eBayURL'];
            if (!ebayUrl)
                continue;
            console.log(`Scraping URL: ${ebayUrl}`);
            const data = yield scrapePage(ebayUrl, storeName);
            scrapeData.push(data);
            // Rate limiting: delay between requests (e.g., 5 seconds)
            yield new Promise((resolve) => setTimeout(resolve, 5000));
        }
        yield browser.close();
        console.log('Scraped data:', scrapeData);
        // Send the scraped data via email
        try {
            const url = 'http://localhost:3000/api/v1/send';
            const response = yield axios_1.default.post(url, { finalData: scrapeData }, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (response.status !== 200) {
                return res.status(500).json({
                    message: 'Failed to send the data to the email sender',
                });
            }
            console.log('Response:', response.data);
        }
        catch (error) {
            console.error('🔴 Error occurred:', error);
            console.error('🔴 Response data:', error.response.data); // Log server response
        }
        return res.json({
            message: 'File sent to the user email successfully',
        });
    }
    catch (error) {
        console.error('🔴 Error occurred:', error);
        return res.status(500).json({
            error: 'Failed to send the final data content to the email sender',
        });
    }
}));
exports.default = scrapeRouter;
