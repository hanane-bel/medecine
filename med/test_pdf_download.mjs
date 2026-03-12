// test_pdf_download.js
// using playwright to quickly test if html2canvas still throws

import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', error => console.error('BROWSER ERROR:', error.message));

    try {
        await page.goto('http://localhost:3001/medecin');
        
        console.log("Logging in as Medecin...");
        await page.fill('input[type="text"]', 'imene');
        await page.fill('input[type="password"]', 'imene123');
        await page.click('button[type="submit"]');

        await page.waitForSelector('text="Dossiers Médicaux Légaux"', { state: 'visible', timeout: 10000 });
        console.log("Logged in successfully.");

        // Find a consultation file
        const patientCard = await page.locator('.bg-white\\/5').filter({ hasText: 'Consultation' }).first();
        if (await patientCard.isVisible()) {
            await patientCard.click();
        } else {
            console.log("No consultation patient found.");
            process.exit(1);
        }

        console.log("Waiting for ConsultationForm...");
        await page.waitForTimeout(2000);
        
        // Fiche d'examen PDF button
        console.log("Clicking PDF button...");
        await page.click('button:has-text("PDF")');
        
        console.log("Wait to see if error occurs...");
        await page.waitForTimeout(5000);

    } catch (e) {
        console.error("Test failed:", e);
    } finally {
        await browser.close();
    }
})();
