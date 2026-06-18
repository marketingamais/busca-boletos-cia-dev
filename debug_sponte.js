const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    let browser = await puppeteer.launch({ 
        headless: true, // We will run headless and just take screenshots
        defaultViewport: { width: 1366, height: 768 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    console.log("Acessando login...");
    await page.goto(`https://portal.sponteweb.com.br/SelecionaLogin.aspx?cid=8731`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    await page.type('#txtLogin', '5866');
    await page.type('#txtSenha', '515615');
    
    console.log("Clicando em Entrar...");
    await page.screenshot({ path: 'debug_01_antes_login.png' });
    
    const navPromise = page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.click('#btnOk');
    
    try {
        await navPromise;
        console.log("Navegação após login concluída.");
    } catch(e) {
        console.log("Timeout aguardando navegação após login.");
    }
    
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: 'debug_02_pos_login.png' });
    
    // Testa clicar em ignorar se houver
    const clicouIgnorar = await page.evaluate(() => {
        const ignorarBtn = Array.from(document.querySelectorAll('a, button, input[type="button"], input[type="submit"]'))
            .find(el => (el.innerText && el.innerText.toLowerCase().includes('ignorar')) || (el.value && el.value.toLowerCase().includes('ignorar')));
        if (ignorarBtn) {
            ignorarBtn.click();
            return true;
        }
        return false;
    }).catch(() => false);
    
    console.log("Clicou em ignorar?", clicouIgnorar);
    
    if (clicouIgnorar) {
        await new Promise(r => setTimeout(r, 3000));
        await page.screenshot({ path: 'debug_03_pos_ignorar.png' });
    }
    
    const html = await page.content();
    fs.writeFileSync('debug_page.html', html);
    console.log("HTML salvo em debug_page.html");

    await browser.close();
    console.log("Pronto.");
})();
