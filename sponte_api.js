const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const port = process.env.PORT || 3000;

app.get('/extrair-boleto', async (req, res) => {
    const { cid, login, senha } = req.query;
    if (!cid || !login || !senha) {
        return res.status(200).json({ status: 'erro', message: 'Este aluno não possui senha cadastrada no Portal da Sponte para que possamos consultar os boletos.' });
    }

    const maxTentativas = 5;
    let ultimoErro = null;

    for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
        let browser;
        try {
            browser = await puppeteer.launch({ 
                headless: true, // Obrigatório true na VPS/Render
                defaultViewport: null,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-popup-blocking']
            });
            const page = await browser.newPage();
            
            // Reativando a intercepção para melhorar a velocidade (Sponte estava dando timeout)
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                const rt = req.resourceType();
                if (['image', 'stylesheet', 'font', 'media'].includes(rt)) {
                    req.abort();
                } else {
                    req.continue();
                }
            });
            
            await page.goto(`https://portal.sponteweb.com.br/SelecionaLogin.aspx?cid=${cid}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
            await page.type('#txtLogin', login);
            await page.type('#txtSenha', senha);
            
            await page.click('#btnOk');
            
            // Aguarda resposta da Sponte (Login ou falha)
            try {
                await page.waitForFunction(() => {
                    return document.querySelector('.highslide-container') !== null || 
                           window.location.href.toLowerCase().includes('financeiro') || 
                           window.location.href.toLowerCase().includes('default') ||
                           (document.querySelector('#lblMsg') && document.querySelector('#lblMsg').innerText.length > 0);
                }, { timeout: 10000 });
            } catch (e) {}
            
            // Verifica erro de login na Sponte
            const msgErro = await page.evaluate(() => {
                const msg = document.querySelector('#lblMsg');
                return msg ? msg.innerText.trim() : '';
            });
            if (msgErro && msgErro.toLowerCase().includes('senha')) {
                throw new Error('Erro de login Sponte: ' + msgErro);
            }

            // Anti-travamento DEFINITIVO: O botão Ignorar (Recuperar Senha)
            try {
                await new Promise(r => setTimeout(r, 2000));
                let modalFrame = page.frames().find(f => f.url().includes('RecuperarSenha.aspx'));
                if (modalFrame) {
                    await modalFrame.evaluate(() => {
                        const btn = Array.from(document.querySelectorAll('a, button, input'))
                            .find(el => (el.innerText && el.innerText.toLowerCase().includes('ignorar')) || (el.value && el.value.toLowerCase().includes('ignorar')));
                        if (btn) btn.click();
                    }).catch(() => {});
                    await new Promise(r => setTimeout(r, 2000));
                }
            } catch(e) {}
            
            // Força a ida pro financeiro
            try {
                if (!page.url().toLowerCase().includes('financeiro')) {
                    await page.goto('https://portal.sponteweb.com.br/Financeiro.aspx', { waitUntil: 'domcontentloaded', timeout: 60000 });
                }
            } catch (e) {}
            
            // Aguarda ter certeza que chegou na tela do financeiro
            try {
                await page.waitForFunction(() => window.location.href.toLowerCase().includes('financeiro'), { timeout: 15000 });
            } catch(e) {}
            
            const isFinanceiro = await page.evaluate(() => window.location.href.toLowerCase().includes('financeiro'));
            if (!isFinanceiro) {
                throw new Error('Navegação falhou: Não foi possível acessar a tela financeira.');
            }
            
            // Espera a tabela carregar linhas ou mostrar mensagem de nenhum registro
            const estadoTabela = await page.evaluate(async () => {
                return new Promise((resolve) => {
                    let tempo = 0;
                    const check = setInterval(() => {
                        tempo += 500;
                        const msgNenhum = Array.from(document.querySelectorAll('td, span, div, p')).find(el => el.innerText && el.innerText.toLowerCase().includes('nenhum registro'));
                        if (msgNenhum) {
                            clearInterval(check);
                            resolve('vazio');
                        }
                        const linhas = document.querySelectorAll('#ctl00_ContentPlaceHolder1_grdFinanceiro tr.odd, #ctl00_ContentPlaceHolder1_grdFinanceiro tr.even');
                        if (linhas && linhas.length > 0) {
                            clearInterval(check);
                            resolve('com_dados');
                        }
                        if (tempo > 20000) {
                            clearInterval(check);
                            resolve('timeout');
                        }
                    }, 500);
                });
            });

            if (estadoTabela === 'timeout') {
                throw new Error('Timeout esperando os boletos na tela financeira.');
            }

            if (estadoTabela === 'vazio') {
                await browser.close();
                return res.json({ status: 'em_dia', message: 'Nenhuma parcela pendente encontrada.' });
            }
            
            // Extrai todas as parcelas da tabela
            const parcelas = await page.evaluate(() => {
                const allRows = Array.from(document.querySelectorAll('#ctl00_ContentPlaceHolder1_grdFinanceiro tr.odd, #ctl00_ContentPlaceHolder1_grdFinanceiro tr.even'));
                
                return allRows.map((row, index) => {
                    const img = row.querySelector('img[id*="imgSituacao"]');
                    const title = img ? (img.getAttribute('title') || '') : '';
                    const src = img ? (img.getAttribute('src') || '') : '';
                    const numParcela = row.querySelector('td:nth-child(1)') ? row.querySelector('td:nth-child(1)').innerText.trim() : '';
                    const dataVencimento = row.querySelector('td:nth-child(2)') ? row.querySelector('td:nth-child(2)').innerText.trim() : '';
                    const valor = row.querySelector('td:nth-child(3)') ? row.querySelector('td:nth-child(3)').innerText.trim() : '';
                    let diasAtraso = 0;
                    let isVencida = false;
                    
                    const isVencidaOrPendente = title.toLowerCase().includes('vencida') || title.toLowerCase().includes('pendente') || src.toLowerCase().includes('vencida') || src.toLowerCase().includes('pendente');
                    
                    if (img && isVencidaOrPendente) {
                        if (title.toLowerCase().includes('vencida a')) {
                            isVencida = true;
                            const match = title.match(/\d+/);
                            if (match) diasAtraso = parseInt(match[0], 10);
                        }
                        if (dataVencimento && dataVencimento.includes('/')) {
                            const [dia, mes, ano] = dataVencimento.split('/');
                            const dtVenc = new Date(ano, mes - 1, dia);
                            const hoje = new Date();
                            hoje.setHours(0,0,0,0);
                            const diff = hoje - dtVenc;
                            const diasDiff = Math.floor(diff / (1000 * 60 * 60 * 24));
                            if (diasDiff > 0) {
                                isVencida = true;
                                diasAtraso = diasDiff;
                            }
                        }
                    }
                    
                    let isPendente = false;
                    if (img && (title.toLowerCase().includes('pendente') || src.toLowerCase().includes('pendente'))) {
                        isPendente = true;
                    }
                    
                    return { index, numParcela, dataVencimento, valor, title, isVencida, diasAtraso, isPendente };
                });
            });

            if (parcelas.length === 0) {
                await browser.close();
                return res.json({ status: 'em_dia', message: 'Nenhuma parcela pendente encontrada.' });
            }

            const atrasadas = parcelas.filter(p => p.isVencida);
            const maxAtraso = atrasadas.length > 0 ? Math.max(...atrasadas.map(p => p.diasAtraso)) : 0;

            // Regra 1: Mais de 5 dias de atraso (Negociar)
            if (maxAtraso > 5) {
                await browser.close();
                return res.json({ status: 'negociar', maxAtraso, parcelasAtrasadas: atrasadas.length });
            }

            // Função auxiliar para extrair linha digitável
            const extrairLinhaDigitavel = async (rowIndex) => {
                await page.evaluate((idx) => {
                    const rows = Array.from(document.querySelectorAll('#ctl00_ContentPlaceHolder1_grdFinanceiro tr.odd, #ctl00_ContentPlaceHolder1_grdFinanceiro tr.even'));
                    if (rows[idx]) rows[idx].click();
                }, rowIndex);
                
                await new Promise(r => setTimeout(r, 1000));
                try {
                    // Sem visible: true, pois o CSS bloqueado deixa o botão com 0x0
                    await page.waitForSelector('#ctl00_ContentPlaceHolder1_btnImprimirBoleto', { timeout: 3000 });
                    await page.evaluate(() => {
                        const btn = document.querySelector('#ctl00_ContentPlaceHolder1_btnImprimirBoleto');
                        if (btn) btn.click();
                    });
                } catch (e) {
                    console.log('Botão de imprimir não encontrado ou indisponível.');
                    return null;
                }
                
                let boletoPage = null;
                for (let i = 0; i < 20; i++) {
                    await new Promise(r => setTimeout(r, 1000));
                    const pagesAgora = await browser.pages();
                    boletoPage = pagesAgora.find(p => p.url().toLowerCase().includes('boleto.aspx'));
                    if (boletoPage) break;
                }
                
                if (!boletoPage) return null;
                
                await boletoPage.waitForNetworkIdle({ timeout: 10000 }).catch(() => {});
                
                let texto = '';
                let linha = null;
                const regexLinha = /\d{5}\.?\d{5}\s*\d{5}\.?\d{6}\s*\d{5}\.?\d{6}\s*\d\s*\d{14}/;
                
                // Polling for the barcode text instead of reading just once
                for (let k = 0; k < 6; k++) {
                    texto = await boletoPage.evaluate(() => document.body.innerText);
                    const match = texto.match(regexLinha);
                    if (match) {
                        linha = match[0].replace(/\D/g, '');
                        break;
                    }
                    await new Promise(r => setTimeout(r, 1500));
                }
                
                await boletoPage.close();
                await new Promise(r => setTimeout(r, 500));
                return linha;
            };

            // Regra 2: Atraso de 1 a 5 dias (Pagar atrasados)
            if (atrasadas.length > 0) {
                let resultados = [];
                for (let p of atrasadas) {
                    const linha = await extrairLinhaDigitavel(p.index);
                    resultados.push({ ...p, linhaDigitavel: linha });
                }
                await browser.close();
                return res.json({ status: 'pagar_atrasados', parcelas: resultados });
            }

            // Regra 3: Nenhuma atrasada (Em dia)
            const proximas = parcelas.filter(p => p.isPendente && !p.isVencida);
            let proxima = null;
            let linhaProxima = null;
            
            if (proximas.length > 0) {
                proxima = proximas[0];
                linhaProxima = await extrairLinhaDigitavel(proxima.index);
            }
            
            await browser.close();
            
            if (proxima) {
                return res.json({ status: 'em_dia', proximoBoleto: { ...proxima, linhaDigitavel: linhaProxima } });
            } else {
                return res.json({ status: 'em_dia', message: 'Nenhuma parcela futura disponível para pagamento.' });
            }

        } catch (e) {
            ultimoErro = e;
            console.error(`Tentativa ${tentativa} falhou:`, e.message);
            if (browser) await browser.close();
            
            // Se for erro de login Sponte, não adianta tentar novamente
            if (e.message.includes('Erro de login Sponte')) {
                return res.status(200).json({ status: 'erro', message: e.message });
            }
            
            // Se for a última tentativa, devolve o erro
            if (tentativa === maxTentativas) {
                return res.status(500).json({ error: ultimoErro.toString() });
            }
            
            // Caso contrário, tenta novamente
            console.log("Iniciando nova tentativa...");
            await new Promise(r => setTimeout(r, 2000));
        }
    }
});

app.listen(port, () => {
    console.log(`🤖 Servidor RPA Sponte iniciado na porta ${port}!`);
});
