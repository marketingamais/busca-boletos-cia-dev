const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ 
        headless: false, 
        slowMo: 60,
        defaultViewport: null,
        args: ['--window-size=1200,800']
    });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    
    try {
        console.log('Iniciando o teste visual com captura de logs...');
        
        await page.goto('https://rob-sponte-7zfdcswn8-matheus-s-projects3.vercel.app?_vercel_share=0jpYBb9twimdK2MvvDXEyhVNiHwnZLUN', { waitUntil: 'networkidle2' });
        
        await new Promise(r => setTimeout(r, 2000));
        
        await page.type('#cpf', '01330191366');
        await page.type('#nome', 'ABRAAO RABELO DE LIMA');
        
        page.on('dialog', async dialog => {
            console.log('\n=============================================');
            console.log(' ? ALERTA NA TELA:');
            console.log(' "' + dialog.message() + '"');
            console.log('=============================================\n');
            await new Promise(r => setTimeout(r, 5000));
            await dialog.accept();
        });
        
        await page.click('button[type="submit"]');
        console.log('Enviado! Aguardando retorno...');
        
        await new Promise(r => setTimeout(r, 70000));
        
    } catch (e) {
        console.error('Erro no teste:', e);
    } finally {
        console.log('Fechando o navegador...');
        await browser.close();
    }
})();
