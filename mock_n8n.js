const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/webhook-test/buscar-boletos', async (req, res) => {
    console.log("Recebido request do frontend:", req.body);
    
    try {
        // MOCK das credenciais
        const cid = 8731;
        const login = '5866';
        const senha = '515615';
        
        if (req.body.cpf === '11111111111') {
            return res.json({ status: 'em_dia', proximoBoleto: { numParcela: '12', dataVencimento: '15/06/2026', linhaDigitavel: '11111.11111 11111.111111 11111.111111 1 11111111111111' } });
        } else if (req.body.cpf === '22222222222') {
            return res.json({ status: 'pagar_atrasados', parcelas: [
                { numParcela: '10', dataVencimento: '10/05/2026', linhaDigitavel: '22222.22222 22222.222222 22222.222222 2 22222222222222' },
                { numParcela: '11', dataVencimento: '10/04/2026', linhaDigitavel: '33333.33333 33333.333333 33333.333333 3 33333333333333' }
            ]});
        }
        
        console.log("Encaminhando para o robô Puppeteer local...");
        const response = await axios.get(`http://localhost:3000/extrair-boleto?cid=${cid}&login=${login}&senha=${senha}`);
        
        console.log("Resposta do robô:", response.data);
        res.json(response.data);
    } catch (e) {
        console.error("Erro:", e.message);
        res.status(500).json({ error: e.toString() });
    }
});

app.listen(5678, () => {
    console.log("Mock Webhook N8N rodando na porta 5678");
});
