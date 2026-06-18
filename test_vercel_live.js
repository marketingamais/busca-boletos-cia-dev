const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
    
    try {
        await page.goto('https://rob-sponte-7zfdcswn8-matheus-s-projects3.vercel.app?_vercel_share=0jpYBb9twimdK2MvvDXEyhVNiHwnZLUN', { waitUntil: 'networkidle2' });
        
        await page.type('#cpf', '01330191366');
        await page.type('#nome', 'ABRAAO RABELO DE LIMA');
        
        let alertMessage = null;
        page.on('dialog', async dialog => {
            alertMessage = dialog.message();
            console.log('POPUP DETECTADO:', alertMessage);
            await dialog.dismiss();
        });
        
        await page.click('button[type="submit"]');
        
        await new Promise(r => setTimeout(r, 6000));
        
    } catch (e) {
        console.error('Erro:', e);
    } finally {
        await browser.close();
    }
})();
