const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    let browser;
    try {
        browser = await puppeteer.launch({ 
            headless: true, 
            args: ['--no-sandbox']
        });
        const page = await browser.newPage();
        
        await page.goto(`https://portal.sponteweb.com.br/SelecionaLogin.aspx?cid=8731`, { waitUntil: 'networkidle2' });
        await page.type('#txtLogin', '8955');
        await page.type('#txtSenha', 'PO0H5jwr+');
        await Promise.all([ page.waitForNavigation(), page.click('#btnOk') ]);
        
        await page.goto('https://portal.sponteweb.com.br/Financeiro.aspx', { waitUntil: 'networkidle2' });
        await page.evaluate(() => {
            const row = document.querySelector('#ctl00_ContentPlaceHolder1_grdFinanceiro tr.odd[onclick]');
            if (row) row.click();
        });
        await new Promise(r => setTimeout(r, 1000));

        const pagesAntes = (await browser.pages()).length;
        await page.click('#ctl00_ContentPlaceHolder1_btnImprimirBoleto');

        let boletoPage = null;
        for (let i = 0; i < 15; i++) {
            await new Promise(r => setTimeout(r, 1000));
            const pagesAgora = await browser.pages();
            if (pagesAgora.length > pagesAntes) {
                boletoPage = pagesAgora[pagesAgora.length - 1];
                break;
            }
        }

        if (boletoPage) {
            await boletoPage.waitForNetworkIdle({ timeout: 10000 }).catch(() => {});
            const html = await boletoPage.content();
            fs.writeFileSync('boleto_page.html', html);
            console.log('Salvo em boleto_page.html');
        }

        await browser.close();
    } catch (e) {
        console.error(e);
        if (browser) await browser.close();
    }
})();
