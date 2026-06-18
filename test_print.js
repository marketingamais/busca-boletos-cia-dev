const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    let browser;
    try {
        browser = await puppeteer.launch({ 
            headless: true, 
            defaultViewport: { width: 1366, height: 768 },
            args: ['--no-sandbox']
        });
        const page = await browser.newPage();
        
        console.log('Login...');
        await page.goto(`https://portal.sponteweb.com.br/SelecionaLogin.aspx?cid=8731`, { waitUntil: 'networkidle2' });
        await page.type('#txtLogin', '8955');
        await page.type('#txtSenha', 'PO0H5jwr+');
        
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
            page.click('#btnOk')
        ]);
        
        console.log('Financeiro...');
        await page.goto('https://portal.sponteweb.com.br/Financeiro.aspx', { waitUntil: 'networkidle2' });
        
        console.log('Selecionando...');
        await page.evaluate(() => {
            for (let i = 2; i <= 10; i++) {
                const id = 'ctl00_ContentPlaceHolder1_grdFinanceiro_ctl0' + i + '_CheckBoxButton';
                const el = document.getElementById(id);
                if (el) {
                    el.click();
                    return true;
                }
            }
            return false;
        });

        console.log('Imprimindo...');
        await page.evaluate(() => {
            if (typeof __doPostBack !== 'undefined') {
                __doPostBack('ctl00$ContentPlaceHolder1$btnImprimirBoleto','');
            }
        });

        // Esperar um pouco para a ação acontecer (popup ou redirect)
        await new Promise(r => setTimeout(r, 4000));
        
        console.log('Tirando print...');
        await page.screenshot({ path: 'sponte_tela.png', fullPage: true });
        
        const html = await page.content();
        fs.writeFileSync('sponte_tela.html', html);
        
        const pages = await browser.pages();
        console.log('Abas abertas:', pages.length);
        for(let p of pages) {
            console.log('- Aba:', p.url());
        }

        await browser.close();
        console.log('Finalizado!');
    } catch (e) {
        console.error(e);
        if (browser) await browser.close();
    }
})();
