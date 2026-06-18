const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ 
        headless: false, 
        slowMo: 60,
        defaultViewport: null,
        args: ['--window-size=1200,800', '--start-maximized']
    });

    try {
        const page = await browser.newPage();
        console.log('\n=============================================');
        console.log(' Iniciando Teste: SITUACAO 2 (COM PROXIMO BOLETO) - CPF: 626.531.633-81');
        console.log('=============================================\\n');
        
        await page.goto('https://rob-sponte.vercel.app', { waitUntil: 'networkidle2' });
        
        page.on('dialog', async dialog => {
            console.log(' -> ALERTA NA TELA: ' + dialog.message());
            await new Promise(r => setTimeout(r, 4000));
            await dialog.accept();
        });
        
        await new Promise(r => setTimeout(r, 1000));
        await page.type('#cpf', '62653163381');
        await new Promise(r => setTimeout(r, 1000));
        
        await page.click('button[type="submit"]');
        console.log(' -> Enviado! Aguardando o robo consultar a Sponte (~60s)...');
        
        await page.waitForFunction(() => {
            const loading = document.getElementById('modalLoading');
            return loading && loading.classList.contains('hidden');
        }, { timeout: 90000 });
        
        console.log(' -> Retorno recebido! Observe a tela...');
        
        await new Promise(r => setTimeout(r, 2000));
        await page.evaluate(() => {
            const btn = document.getElementById('btnQueroPagarProximo');
            if (btn && btn.style.display !== 'none') btn.click();
        }).catch(() => {});
        
        await new Promise(r => setTimeout(r, 15000));
        await page.close();
    } catch (e) {
        console.error(' Erro:', e.message);
    } finally {
        // await browser.close();
        process.exit(0);
    }
})();
