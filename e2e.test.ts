import puppeteer from 'puppeteer';
jest.setTimeout(10000);
describe('Spreadsheet E2E Tests', () => {
    let browser: puppeteer.Browser;
    let page: puppeteer.Page;

    beforeAll(async () => {
        browser = await puppeteer.launch({ headless: false });
        page = await browser.newPage();
        await page.goto('http://localhost:8080', { waitUntil: 'networkidle0' });
    });

    afterAll(async () => {
        await browser.close();
    });

    test('should set and display value in A1', async () => {
        // Click A1 cell
        await page.click('div.grid > div:nth-child(13)'); // A1 is the 13th div (after header row: 1 empty + 10 columns)
        await page.waitForSelector('input');

        // Type value and press Enter
        await page.type('input', '10');
        await page.keyboard.press('Enter');

        // Verify displayed value
        const a1Value = await page.$eval('div.grid > div:nth-child(13) > span', el => el.textContent);
        expect(a1Value).toBe('10');
    });

    test('should set and display formula in B1', async () => {
        // Click B1 cell
        await page.click('div.grid > div:nth-child(14)'); // B1 is the 13th div
        await page.waitForSelector('input');

        // Type formula and press Enter
        await page.type('input', '=A1 + 5');
        await page.keyboard.press('Enter');

        // Verify displayed value
        const b1Value = await page.$eval('div.grid > div:nth-child(14) > span', el => el.textContent);
        expect(b1Value).toBe('15');
    });

    test('should update dependent cell B1 when A1 changes', async () => {
        // Click A1 cell
        await page.click('div.grid > div:nth-child(13)');
        await page.waitForSelector('input');

        // Update value and press Enter
        await page.keyboard.press('Backspace');
        await page.keyboard.press('Backspace');
        await page.type('input', '20');
        await page.keyboard.press('Enter');

        // Verify B1 updated
        const b1Value = await page.$eval('div.grid > div:nth-child(14) > span', el => el.textContent);
        expect(b1Value).toBe('25');
    });
});
