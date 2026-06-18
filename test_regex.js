const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
    let browser = await puppeteer.launch();
    let page = await browser.newPage();
    const html = fs.readFileSync('boleto_page.html', 'utf8');
    await page.setContent(html);
    const texto = await page.evaluate(() => document.body.innerText);
    
    console.log("TEXTO COMPLETO:", texto);
    
    // Test regex
    const regexLinha = /\d{5}\.?\d{5}\s*\d{5}\.?\d{6}\s*\d{5}\.?\d{6}\s*\d\s*\d{14}/;
    console.log("MATCH REGEX 1:", texto.match(regexLinha));

    // Test simple regex ignoring all non-digits
    const limpo = texto.replace(/\D/g, '');
    console.log("LIMPO (Tamanho):", limpo.length);
    console.log("LIMPO:", limpo);
    
    const match2 = limpo.match(/\d{47}/);
    console.log("MATCH REGEX 2:", match2);

    await browser.close();
})();
