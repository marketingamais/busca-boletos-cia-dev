const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    let browser = await puppeteer.launch({ 
        headless: true,
        defaultViewport: { width: 1366, height: 768 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    console.log("Acessando login...");
    await page.goto(`https://portal.sponteweb.com.br/SelecionaLogin.aspx?cid=8731`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    await page.type('#txtLogin', '5866');
    await page.type('#txtSenha', '515615');
    
    console.log("Clicando em Entrar...");
    await page.click('#btnOk');
    
    // Aguarda o iframe carregar
    await new Promise(r => setTimeout(r, 5000));
    
    let modalFrame = page.frames().find(f => f.url().includes('RecuperarSenha.aspx'));
    if (modalFrame) {
        console.log("Iframe encontrado!");
        const clicouIgnorar = await modalFrame.evaluate(() => {
            const btn = Array.from(document.querySelectorAll('a, button, input'))
                .find(el => (el.innerText && el.innerText.toLowerCase().includes('ignorar')) || (el.value && el.value.toLowerCase().includes('ignorar')));
            if (btn) {
                btn.click();
                return true;
            }
            return false;
        }).catch(() => false);
        console.log("Clicou no botão ignorar dentro do iframe?", clicouIgnorar);
        
        await new Promise(r => setTimeout(r, 5000)); // Aguarda processar o clique
    } else {
        console.log("Iframe não encontrado.");
    }
    
    console.log("Acessando financeiro...");
    await page.goto('https://portal.sponteweb.com.br/Financeiro.aspx', { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    await page.screenshot({ path: 'debug_04_financeiro.png' });
    const html = await page.content();
    fs.writeFileSync('debug_financeiro.html', html);
    console.log("Tudo pronto, veja debug_financeiro.html");

    await browser.close();
})();
