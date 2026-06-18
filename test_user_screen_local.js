const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Servidor local para rodar o frontend atualizado e testar o N8N novo
const server = http.createServer((req, res) => {
    let filePath = './frontend' + (req.url === '/' ? '/index.html' : req.url);
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            res.writeHead(404);
            res.end();
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});
server.listen(8080);

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
        console.log('Iniciando teste visual no Frontend Local (100% atualizado)...');
        
        await page.goto('http://localhost:8080', { waitUntil: 'networkidle2' });
        
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
        console.log('Enviado para a N8N! Aguardando retorno (~60 segundos)...');
        
        const modalEmDia = await page.waitForSelector('#modalEmDia:not(.hidden)', { timeout: 80000 }).catch(() => null);
        if (modalEmDia) {
            console.log('\n=============================================');
            console.log(' ? SUCESSO! MODAL VERDE (EM DIA) APARECEU NA TELA!');
            console.log('=============================================\n');
            await new Promise(r => setTimeout(r, 10000));
        } else {
            console.log('Nenhum modal apareceu dentro do tempo!');
        }
        
    } catch (e) {
        console.error('Erro no teste:', e);
    } finally {
        console.log('Fechando o navegador...');
        await browser.close();
        server.close();
        process.exit(0);
    }
})();
