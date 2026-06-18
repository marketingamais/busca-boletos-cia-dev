const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    try {
        console.log('Acessando Vercel...');
        await page.goto('https://rob-sponte-6leamc37l-marketing-8929s-projects.vercel.app/', { waitUntil: 'networkidle2' });
        
        console.log('Preenchendo CPF...');
        await page.type('#cpf', '01330191366');
        await page.type('#nome', 'ABRAAO RABELO DE LIMA');
        
        console.log('Clicando em Buscar...');
        page.on('dialog', async dialog => {
            console.log('POPUP (ALERT):', dialog.message());
            await dialog.dismiss();
        });
        
        await page.click('button[type="submit"]');
        
        console.log('Aguardando resposta do servidor...');
        await new Promise(r => setTimeout(r, 5000));
        
        console.log('Teste concluído.');
    } catch (e) {
        console.error('Erro no teste:', e);
    } finally {
        await browser.close();
    }
})();
