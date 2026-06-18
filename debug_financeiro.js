const puppeteer = require('puppeteer');

(async () => {
    let browser;
    try {
        browser = await puppeteer.launch({ 
            headless: true, 
            defaultViewport: null,
            args: ['--no-sandbox']
        });
        const page = await browser.newPage();
        
        await page.goto(`https://portal.sponteweb.com.br/SelecionaLogin.aspx?cid=8731`, { waitUntil: 'networkidle2' });
        await page.type('#txtLogin', '8955');
        await page.type('#txtSenha', 'PO0H5jwr+');
        
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
            page.click('#btnOk')
        ]);
        
        await page.goto('https://portal.sponteweb.com.br/Financeiro.aspx', { waitUntil: 'networkidle2' });
        
        // Clicar no botão imprimir sem selecionar nada
        page.on('dialog', async dialog => {
            console.log('DIALOG:', dialog.message());
            await dialog.accept();
        });

        // Tentar ver os checkboxes
        const checkboxes = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('input[type="checkbox"], input[type="radio"]')).map(el => el.id);
        });
        console.log('Checkboxes:', checkboxes);

        await browser.close();
    } catch (e) {
        console.error(e);
        if (browser) await browser.close();
    }
})();
