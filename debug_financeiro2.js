const puppeteer = require('puppeteer');

(async () => {
    let browser;
    try {
        browser = await puppeteer.launch({ 
            headless: true, 
            defaultViewport: { width: 1280, height: 800 },
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
        
        // Espera a tabela aparecer explicitamente
        await page.waitForSelector('#ctl00_ContentPlaceHolder1_grdFinanceiro', { timeout: 15000 }).catch(e => console.log('Tabela não achada'));
        
        // Vamos extrair as linhas da tabela
        const tableData = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('#ctl00_ContentPlaceHolder1_grdFinanceiro tr'));
            return rows.map(tr => {
                const cb = tr.querySelector('input[type="checkbox"]');
                return {
                    id: cb ? cb.id : null,
                    text: tr.innerText.replace(/\\n/g, ' | ')
                };
            });
        });
        
        console.log('Linhas da tabela:', JSON.stringify(tableData, null, 2));

        // Tentar clicar no primeiro checkbox que não seja do header
        const primeiroCb = tableData.find(r => r.id && r.id.includes('ctl02_CheckBoxButton'));
        if (primeiroCb) {
            console.log('Clicando em:', primeiroCb.id);
            await page.click('#' + primeiroCb.id);
            
            // Prepara aba do boleto
            const newPagePromise = new Promise(x => browser.once('targetcreated', target => x(target.page())));
            
            console.log('Clicando Imprimir...');
            await page.evaluate(() => {
                if (typeof __doPostBack !== 'undefined') {
                    __doPostBack('ctl00$ContentPlaceHolder1$btnImprimirBoleto','');
                }
            });
            
            console.log('Esperando nova aba...');
            const boletoPage = await newPagePromise;
            if (boletoPage) {
                await boletoPage.waitForNetworkIdle({ timeout: 10000 }).catch(() => {});
                console.log('Boleto URL:', boletoPage.url());
                const texto = await boletoPage.evaluate(() => document.body.innerText);
                console.log('Texto do Boleto (primeiros 500 chars):', texto.substring(0, 500));
                
                const match = texto.replace(/\\D/g, '').match(/\\d{47,48}/);
                if (match) console.log('LINHA DIGITAVEL ENCONTRADA:', match[0]);
                else console.log('Nao encontrou linha digitavel por regex');
            }
        }

        await browser.close();
    } catch (e) {
        console.error(e);
        if (browser) await browser.close();
    }
})();
