const fs = require('fs');

let raw = fs.readFileSync('Busca de Boletos SPONTE_Auto.json', 'utf8');
let flow = JSON.parse(raw);

let processarBoletos = flow.nodes.find(n => n.name === 'Processar Boletos');

processarBoletos.parameters.jsCode = `let allItems = $input.all();
let today = new Date();
let hasOver6Days = false;
let boletosParaEnviar = [];

for (let item of allItems) {
    let ContasReceberArray = item.json.ContasReceber || item.json.data || item.json || [];
    if (!Array.isArray(ContasReceberArray)) {
        if (ContasReceberArray.DataVencimento || ContasReceberArray.parcelas) ContasReceberArray = [ContasReceberArray];
        else ContasReceberArray = [];
    }
    
    for (let cr of ContasReceberArray) {
        let parcelas = cr.parcelas || cr.Parcelas || [];
        if (cr.situacao || cr.Situacao) {
            parcelas = [cr];
        }
        
        for (let p of parcelas) {
            let sit = p.Situacao || p.situacao;
            if (sit !== 0 && sit !== 'Aberto' && sit !== 'Pendente' && sit !== 'Pendentes') continue;
            
            let vencimentoStr = p.DataVencimento || p.dataVencimento;
            if (!vencimentoStr) continue;
            
            let vencimento = new Date(vencimentoStr);
            let diffTime = today - vencimento;
            let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            
            if (diffDays >= 6) {
                hasOver6Days = true;
            } else {
                let identifier = p.LinhaDigitavel || p.linhaDigitavel || cr.LinhaDigitavel || cr.linhaDigitavel || p.ContaReceberID || p.contaReceberID || cr.ContaReceberID || cr.contaReceberID || 'Boleto sem código';
                let valor = p.valor || p.Valor || cr.valorPlano || cr.ValorPlano || '';
                let dataBR = vencimento.toLocaleDateString('pt-BR');
                
                boletosParaEnviar.push(\`Vencimento: \${dataBR} | Valor: R$ \${valor}\\nLinha/ID: \${identifier}\`);
            }
        }
    }
}

let message = "VOCÊ ESTÁ EM DIA!";
if (hasOver6Days) {
    message = "entre em contato com: 0800 886 0663";
} else if (boletosParaEnviar.length > 0) {
    message = "Aqui estão seus boletos pendentes:\\n\\n" + boletosParaEnviar.join("\\n\\n");
}

return [{ json: { message } }];`;

fs.writeFileSync('Busca de Boletos SPONTE_Auto.json', JSON.stringify(flow, null, 2));
console.log('Fixed loop');
