import express, { Request, Response } from 'express';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as fs from 'fs';
import * as Papa from 'papaparse';
import axios from 'axios';
import { validateData, CSVData } from '../utils/validateData';

puppeteer.use(StealthPlugin());

const scrapeRouter = express.Router();

scrapeRouter.post('/', async (req: Request, res: Response) => {
    try {
        const { filePath, email, storeName } = req.body;
        console.log('email:', email, 'storename:', storeName, 'filepath:', filePath);

        // Read and parse the CSV file
        const csvData = fs.readFileSync(filePath, 'utf-8');
        const parsedData: any = Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true,
        }).data;

        // Validate the data
        const result = validateData(parsedData);
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
        const browser = await puppeteer.launch({
            headless: true, // Enable headless mode in production
            args: ['--no-sandbox', '--disable-setuid-sandbox'], // Necessary for production environments
        });

        // Scraping function with retry logic and error handling
        const scrapePage = async (ebayUrl: string, storeName: string, retries = 3): Promise<CSVData> => {
            const page = await browser.newPage();
            try {
                await page.goto(ebayUrl, { waitUntil: 'domcontentloaded', timeout: 60000 }); // 60 seconds timeout

                // Find the rank of the store
                const rank = await page.evaluate((storeName) => {
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
                const currency = await page.evaluate(() => {
                    const priceElement = document.querySelector('span.s-item__price');
                    return priceElement ? priceElement.textContent?.trim().charAt(0) || 'USD' : 'USD';
                });

                await page.close();
                return {
                    identity: storeName,
                    eBayURL: ebayUrl,
                    rank: rank || 0, // Default to 0 if not found
                    currency: currency || 'USD', // Default to USD if not found
                };
            } catch (error) {
                console.error(`Error scraping URL ${ebayUrl}:`, error);
                await page.close();

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
        };

        // Scrape data with rate limiting (throttle requests)
        const scrapeData: CSVData[] = [];
        for (const item of parsedData) {
            const ebayUrl = item['eBayURL'];
            if (!ebayUrl) continue;

            console.log(`Scraping URL: ${ebayUrl}`);

            const data = await scrapePage(ebayUrl, storeName);
            scrapeData.push(data);

            // Rate limiting: delay between requests (e.g., 5 seconds)
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }

        await browser.close();

        console.log('Scraped data:', scrapeData);

        // Send the scraped data via email
        try {
            const url = 'http://localhost:3000/api/v1/send';
            const response = await axios.post(
                url,
                { finalData: scrapeData },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            if (response.status !== 200) {
                return res.status(500).json({
                    message: 'Failed to send the data to the email sender',
                });
            }
            console.log('Response:', response.data);
        } catch (error: any) {
            console.error('🔴 Error occurred:', error);
            console.error('🔴 Response data:', error.response.data); // Log server response
        }

        return res.json({
            message: 'File sent to the user email successfully',
        });
    } catch (error) {
        console.error('🔴 Error occurred:', error);
        return res.status(500).json({
            error: 'Failed to send the final data content to the email sender',
        });
    }
});

export default scrapeRouter;
