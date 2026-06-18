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
        
        // Ativar interceptação para capturar respostas de download
        page.on('response', async (response) => {
            const url = response.url();
            const headers = response.headers();
            if (url.includes('Financeiro.aspx') && headers['content-disposition']) {
                console.log('ARQUIVO BAIXADO!', headers['content-disposition']);
            } else if (url.includes('Boleto') || url.includes('Imprime')) {
                console.log('REDIRECIONOU PARA BOLETO:', url);
            }
        });

        await page.goto(`https://portal.sponteweb.com.br/SelecionaLogin.aspx?cid=8731`, { waitUntil: 'networkidle2' });
        await page.type('#txtLogin', '8955');
        await page.type('#txtSenha', 'PO0H5jwr+');
        
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
            page.click('#btnOk')
        ]);
        
        await page.goto('https://portal.sponteweb.com.br/Financeiro.aspx', { waitUntil: 'networkidle2' });
        
        // Forçar a marcação do checkbox manipulando o estado diretamente
        await page.evaluate(() => {
            const cb = document.querySelector('input[type="checkbox"][id*="ctl02"]');
            if (cb) {
                cb.checked = true;
                // Executar o postback com a caixa marcada
                __doPostBack('ctl00$ContentPlaceHolder1$btnImprimirBoleto','');
            }
        });

        // Esperar 10s para ver se algum response é capturado
        await new Promise(r => setTimeout(r, 10000));

        await browser.close();
    } catch (e) {
        console.error(e);
        if (browser) await browser.close();
    }
})();
