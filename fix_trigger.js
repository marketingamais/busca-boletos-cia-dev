const fs = require('fs');

let raw = fs.readFileSync('Busca de Boletos SPONTE_Auto.json', 'utf8');
let flow = JSON.parse(raw);

// Find Webhook
let webhookIndex = flow.nodes.findIndex(n => n.name === 'Webhook Inicial');
if (webhookIndex !== -1) {
    flow.nodes[webhookIndex] = {
        "parameters": {
            "path": "be67a2ea-e273-42db-9a96-f38098766b35",
            "formTitle": "Segunda Via de Boleto - TESTE",
            "formDescription": "Informe o CPF ou Matrícula do ALUNO para consultar faturas em aberto",
            "formFields": {
                "values": [
                    {
                        "fieldLabel": "CPF",
                        "placeholder": "Somente números. Ex: 12345678901",
                        "requiredField": true
                    }
                ]
            },
            "options": {}
        },
        "id": "4ca0a957-4dc5-469a-a37c-865e64922dd7",
        "name": "Formulário - CPF",
        "type": "n8n-nodes-base.formTrigger",
        "typeVersion": 2,
        "position": [0, 200],
        "webhookId": "be67a2ea-e273-42db-9a96-f38098766b35"
    };

    // Fix connections
    flow.connections["Formulário - CPF"] = flow.connections["Webhook Inicial"];
    delete flow.connections["Webhook Inicial"];
}

// Update Validar CPF to properly read from Form Trigger
let validarCpf = flow.nodes.find(n => n.name === 'Validar CPF');
if (validarCpf) {
    validarCpf.parameters.jsCode = `const cpf = ($input.first().json['CPF'] || '').toString().replace(/\\D/g, '');\nif (cpf.length !== 11) throw new Error('CPF inválido: informe 11 dígitos. Recebido: ' + cpf);\nlet formattedCpf = cpf.replace(/(\\d{3})(\\d{3})(\\d{3})(\\d{2})/, "$1.$2.$3-$4");\nreturn [{ json: { cpf: formattedCpf } }];`;
}

fs.writeFileSync('Busca de Boletos SPONTE_Auto.json', JSON.stringify(flow, null, 2));
console.log('Done');
