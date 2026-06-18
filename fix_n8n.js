const fs = require('fs');

let raw = fs.readFileSync('Busca de Boletos SPONTE (2).json', 'utf8');
let flow = JSON.parse(raw);

// Find nodes
let validarCpf = flow.nodes.find(n => n.name === 'Validar CPF');
let oldLogin = flow.nodes.find(n => n.name === 'Login ');
let oldPrepararVars = flow.nodes.find(n => n.name === 'Preparar Vars');

// 1. Update Validar CPF to also extract 'escola' if it exists in the webhook body/query
validarCpf.parameters.jsCode = `const cpf = ($input.first().json['CPF'] || '').toString().replace(/\\D/g, '');
if (cpf.length !== 11) throw new Error('CPF inválido: informe 11 dígitos. Recebido: ' + cpf);

let escola = 70532; // Padrão
if ($('Formulário - CPF').first() && $('Formulário - CPF').first().json.query && $('Formulário - CPF').first().json.query.escola) {
    escola = $('Formulário - CPF').first().json.query.escola;
} else if ($('Formulário - CPF').first() && $('Formulário - CPF').first().json.body && $('Formulário - CPF').first().json.body.escola) {
    escola = $('Formulário - CPF').first().json.body.escola;
} else if ($input.first().json['escola']) {
    escola = $input.first().json['escola'];
}

return [{ json: { cpf, escola } }];`;

// 2. Create the IF node
let ifNode = {
  "parameters": {
    "conditions": {
      "options": {
        "caseSensitive": true,
        "leftValue": "",
        "typeValidation": "strict",
        "version": 2
      },
      "conditions": [
        {
          "id": "12eb3c4f-c1f9-4670-b7af-3c8c6f111a43",
          "leftValue": "={{ $json.escola }}",
          "rightValue": "8731",
          "operator": {
            "type": "string",
            "operation": "equals",
            "name": "filter.operator.equals"
          }
        }
      ],
      "combinator": "and"
    },
    "options": {}
  },
  "id": "if-school-branch",
  "name": "Qual Escola?",
  "type": "n8n-nodes-base.if",
  "typeVersion": 2.2,
  "position": [
    validarCpf.position[0] + 200,
    validarCpf.position[1]
  ]
};
flow.nodes.push(ifNode);

// 3. Create Login 8731
let login8731 = JSON.parse(JSON.stringify(oldLogin));
login8731.id = "login-8731-id";
login8731.name = "Login 8731";
login8731.parameters.jsonBody = `{\n  "email": "milenanogueira-itz-ma@hotmail.com",\n  "password": "vPT3KBftA28@Qo8X",\n  "codCliSponte": 8731\n}\n`;
login8731.position = [ifNode.position[0] + 200, ifNode.position[1] - 100];
flow.nodes.push(login8731);

// 4. Create Login 70532
let login70532 = JSON.parse(JSON.stringify(oldLogin));
login70532.id = "login-70532-id";
login70532.name = "Login 70532";
login70532.parameters.jsonBody = `{\n  "email": "milenanogueira-itz-ma@hotmail.com",\n  "password": "vPT3KBftA28@Qo8X",\n  "codCliSponte": 70532\n}\n`;
login70532.position = [ifNode.position[0] + 200, ifNode.position[1] + 100];
flow.nodes.push(login70532);

// Remove old login
flow.nodes = flow.nodes.filter(n => n.name !== 'Login ');

// 5. Create Preparar Vars
oldPrepararVars.parameters.jsCode = `
const token = $input.item.json.accessToken || $input.item.json.token || $input.item.json.access_token || '';
let cpf = $('Validar CPF').first().json.cpf;
cpf = cpf.replace(/(\\d{3})(\\d{3})(\\d{3})(\\d{2})/, "$1.$2.$3-$4");
let escola = $('Validar CPF').first().json.escola;

const codCli = escola == 8731 ? 8731 : 70532;
const apiKey = escola == 8731 ? '87E821' : '0EA64A';

return [{ json: { token, cpf, codCli, apiKey } }];
`;
oldPrepararVars.position = [login70532.position[0] + 200, ifNode.position[1]];

// 6. Fix Connections
flow.connections["Validar CPF"].main = [[{ "node": "Qual Escola?", "type": "main", "index": 0 }]];
flow.connections["Qual Escola?"] = {
  "main": [
    [ { "node": "Login 8731", "type": "main", "index": 0 } ],
    [ { "node": "Login 70532", "type": "main", "index": 0 } ]
  ]
};
flow.connections["Login 8731"] = {
  "main": [ [ { "node": "Preparar Vars", "type": "main", "index": 0 } ] ]
};
flow.connections["Login 70532"] = {
  "main": [ [ { "node": "Preparar Vars", "type": "main", "index": 0 } ] ]
};
delete flow.connections["Login "];

fs.writeFileSync('Busca de Boletos SPONTE_IF.json', JSON.stringify(flow, null, 2));
console.log('Done');
