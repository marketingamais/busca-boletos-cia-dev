const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    let filePath = './frontend' + (req.url === '/' ? '/index.html' : req.url);
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
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
        args: ['--window-size=1200,800', '--start-maximized']
    });

    const runTest = async (cpf, situacaoName) => {
        const page = await browser.newPage();
        console.log('\n=============================================');
        console.log(` Iniciando Teste: ${situacaoName} - CPF: ${cpf}`);
        console.log('=============================================\n');
        
        try {
            await page.goto('http://localhost:8080', { waitUntil: 'networkidle2' });
            
            page.on('dialog', async dialog => {
                console.log(` ${situacaoName} -> ALERTA NA TELA: "${dialog.message()}"`);
                await new Promise(r => setTimeout(r, 4000));
                await dialog.accept();
            });
            
            await new Promise(r => setTimeout(r, 1000));
            await page.type('#cpf', cpf);
            await new Promise(r => setTimeout(r, 1000));
            
            await page.click('button[type="submit"]');
            console.log(` ${situacaoName} -> Enviado! Aguardando o robô consultar a Sponte (~60s)...`);
            
            await page.waitForFunction(() => {
                const loading = document.getElementById('modalLoading');
                return loading && loading.classList.contains('hidden');
            }, { timeout: 90000 });
            
            console.log(` ${situacaoName} -> Retorno recebido! Observe a tela...`);
            
            if (situacaoName.includes('LEVE')) {
                await new Promise(r => setTimeout(r, 2000));
                await page.evaluate(() => {
                    const btnPagar = document.querySelector('.boleto-card .btn-primary');
                    if (btnPagar) btnPagar.click();
                }).catch(() => {});
            }

            if (situacaoName.includes('DIA')) {
                await new Promise(r => setTimeout(r, 2000));
                await page.evaluate(() => {
                    const btn = document.getElementById('btnQueroPagarProximo');
                    if (btn && btn.style.display !== 'none') btn.click();
                }).catch(() => {});
            }
            
            await new Promise(r => setTimeout(r, 15000));
            await page.close();
        } catch (e) {
            console.error(` Erro no ${situacaoName}:`, e.message);
            await page.close();
        }
    };

    try {
        await runTest('01330191366', 'SITUAÇÃO 1: PAGAMENTO EM DIA');
        await runTest('62653163381', 'SITUAÇÃO 2: ATRASO LEVE (1 a 5 dias)');
        await runTest('08157476321', 'SITUAÇÃO 3: ATRASO GRAVE (6+ dias)');
        console.log('\n=============================================');
        console.log(' TODOS OS TESTES FORAM CONCLUÍDOS!');
        console.log('=============================================\n');
    } finally {
        await browser.close();
        server.close();
        process.exit(0);
    }
})();
