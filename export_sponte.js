const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

function getLastDayOfNextMonth() {
    const today = new Date();
    const year = today.getMonth() === 11 ? today.getFullYear() + 1 : today.getFullYear();
    const nextMonth = (today.getMonth() + 1) % 12;
    return new Date(year, nextMonth + 1, 0);
}

function formatDateBR(date) {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

async function exportarRelatorio(webhookUrl) {
    console.log("Iniciando rotina de exportação da Sponte...");
    const downloadPath = path.resolve(__dirname, 'downloads');
    if (!fs.existsSync(downloadPath)) fs.mkdirSync(downloadPath);
    
    const oldFiles = fs.readdirSync(downloadPath);
    for (const file of oldFiles) fs.unlinkSync(path.join(downloadPath, file));

    const browser = await puppeteer.launch({ 
        headless: 'new',
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-popup-blocking'
        ]
    });
    
    try {
        const page = await browser.newPage();
        
        // Interceptação de imagens removida para evitar qualquer chance de quebra na Sponte.
        
        const client = await page.target().createCDPSession();
        await client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: downloadPath
        });

        // HACK: Se a Sponte abrir o download em uma nova guia/pop-up (ex: link do AWS S3), 
        // precisamos garantir que a nova guia também baixe o arquivo na nossa pasta.
        browser.on('targetcreated', async (target) => {
            console.log("Pop-up/Nova aba detectada na URL: " + target.url());
            if (target.type() === 'page' || target.type() === 'other') {
                try {
                    const newPage = await target.page();
                    if (newPage) {
                        const newClient = await newPage.target().createCDPSession();
                        await newClient.send('Page.setDownloadBehavior', {
                            behavior: 'allow',
                            downloadPath: downloadPath
                        });
                        console.log("Pop-up configurado para download automático!");
                    }
                } catch(e) { }
            }
        });

        console.log("Acessando Sponte...");
        await page.goto('https://www.sponteweb.com.br/', { waitUntil: 'networkidle2', timeout: 60000 });

        await page.waitForSelector('#txtLogin', { timeout: 15000 });
        await page.type('#txtLogin', 'AMAIS@CIA');
        await page.type('#txtSenha', 'Ciaa+1717');
        await page.click('button[type="submit"], #btnEntrar, input[type="submit"]');

        console.log("Aguardando redirecionamento...");
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });

        console.log("Navegando para Contas a Receber...");
        await page.goto('https://www.sponteweb.com.br/SPRel/Financeiro/ContasReceber.aspx', { waitUntil: 'networkidle2', timeout: 60000 });

        const currentYear = new Date().getFullYear();
        const startDateStr = `01/01/${currentYear}`;
        const endDateStr = formatDateBR(getLastDayOfNextMonth());
        
        console.log(`Período configurado: ${startDateStr} até ${endDateStr}`);
        
        for (const frame of page.frames()) {
            await frame.evaluate((start, end) => {
                const inputs = Array.from(document.querySelectorAll('input[type="text"], input[type="date"], input[type="tel"]'));
                for (const input of inputs) {
                    const idName = (input.id + input.name).toLowerCase();
                    if(idName.includes('vencimentoini') || idName.includes('datainicial')) input.value = start;
                    if(idName.includes('vencimentofim') || idName.includes('datafinal')) input.value = end;
                }
            }, startDateStr, endDateStr);
        }

        console.log("Configurando exportação para Excel...");
        let formatChanged = false;
        
        for (const frame of page.frames()) {
            const changed = await frame.evaluate(() => {
                let localChanged = false;
                
                // 1. Marcar a Checkbox de Exportar
                const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
                for (const chk of checkboxes) {
                    const idName = (chk.id + chk.name).toLowerCase();
                    const parentText = chk.parentElement ? chk.parentElement.textContent.toLowerCase() : '';
                    if (idName.includes('export') || parentText.includes('exportar')) {
                        if (!chk.checked) chk.click();
                        break;
                    }
                }

                // 2. Selecionar Excel no Combobox
                const selects = Array.from(document.querySelectorAll('select'));
                for (const sel of selects) {
                    let targetIndex = -1;
                    for (let i = 0; i < sel.options.length; i++) {
                        const optText = sel.options[i].text.toLowerCase();
                        if (optText.includes('excel tabulado') || optText.includes('xls') || optText.includes('excel')) {
                            targetIndex = i;
                            break;
                        }
                    }
                    if (targetIndex !== -1) {
                        if (sel.selectedIndex !== targetIndex) {
                            sel.selectedIndex = targetIndex;
                            sel.dispatchEvent(new Event('change', { bubbles: true }));
                            localChanged = true;
                        }
                        break; // Se achou um combo com excel, não precisa olhar os outros
                    }
                }
                return localChanged;
            });
            if (changed) formatChanged = true;
        }

        if (formatChanged) {
            console.log("Aguardando a Sponte processar a escolha (Network Idle)...");
            try {
                await page.waitForNetworkIdle({ idleTime: 1000, timeout: 30000 });
            } catch (e) {
                console.log("Aviso: Tempo limite de rede atingido na espera do combo, seguindo em frente...");
            }
            await new Promise(r => setTimeout(r, 1000));
        }

        console.log("Clicando em Visualizar / Emitir e aguardando download (Timeout 30 min)...");
        
        let btnHandle = null;
        for (const frame of page.frames()) {
            // Busca todos os elementos clicáveis que parecem botões
            const elements = await frame.$$('input[type="button"], input[type="submit"], button, a');
            for (const el of elements) {
                const text = await frame.evaluate(x => (x.value || x.innerText || x.textContent || x.title || '').toUpperCase(), el);
                if (text.includes('VISUALIZAR') || text.includes('EMITIR') || text.includes('GERAR') || text.includes('EXPORTAR')) {
                    btnHandle = el;
                    break;
                }
            }
            if (btnHandle) break; // Se achou em algum frame, para de procurar
        }

        if (btnHandle) {
            await btnHandle.click(); // Clique confiável do Puppeteer (Evita bloqueio de Pop-up)
            console.log("Botão clicado com sucesso!");
        } else {
            console.log("ALERTA: Botão de Visualizar não encontrado em nenhum frame da tela!");
        }

        let filePath = null;
        let attempts = 0;
        const maxAttempts = 60 * 30; 
        
        while (attempts < maxAttempts) {
            await new Promise(r => setTimeout(r, 1000));
            const files = fs.readdirSync(downloadPath);
            const excelFile = files.find(f => (f.endsWith('.xls') || f.endsWith('.xlsx') || f.endsWith('.csv')) && !f.endsWith('.crdownload'));
            if (excelFile) {
                filePath = path.join(downloadPath, excelFile);
                break;
            }
            attempts++;
            if(attempts % 60 === 0) console.log(`Aguardando download... ${attempts/60} minuto(s)`);
        }

        if (!filePath) {
            throw new Error('Timeout: O arquivo Excel não foi baixado dentro do tempo limite de 30 minutos.');
        }

        console.log(`Download concluído! Arquivo: ${filePath}`);
        
        if (webhookUrl) {
            console.log(`Enviando para o N8N (${webhookUrl})...`);
            const form = new FormData();
            form.append('arquivo', fs.createReadStream(filePath));
            
            await axios.post(webhookUrl, form, {
                headers: {
                    ...form.getHeaders()
                }
            });
            console.log("Arquivo enviado com sucesso para o N8N!");
        }

        return { success: true, message: 'Exportação concluída!' };

    } catch (e) {
        console.error("Erro durante a automação:", e);
        if (webhookUrl) {
            try {
                await axios.post(webhookUrl, {
                    error: true,
                    message: e.toString()
                });
            } catch(err) {}
        }
        throw e;
    } finally {
        await browser.close();
    }
}

async function runWithRetries(webhookUrl) {
    let retries = 0;
    while (retries < 3) {
        try {
            await exportarRelatorio(webhookUrl);
            return; 
        } catch(e) {
            retries++;
            console.log(`Tentativa ${retries} falhou.`);
            if (retries < 3) {
                await new Promise(r => setTimeout(r, 10000));
            }
        }
    }
}

module.exports = { runWithRetries };
