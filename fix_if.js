const fs = require('fs');

let raw = fs.readFileSync('Busca de Boletos SPONTE_IF.json', 'utf8');
let flow = JSON.parse(raw);

// 1. Fix the IF node strictly typed error by converting escola to string
let validarCpf = flow.nodes.find(n => n.name === 'Validar CPF');
if (validarCpf) {
    validarCpf.parameters.jsCode = validarCpf.parameters.jsCode.replace('return [{ json: { cpf, escola } }];', 'return [{ json: { cpf, escola: escola.toString() } }];');
}

// 2. Or just set typeValidation to "loose" in IF node
let ifNode = flow.nodes.find(n => n.name === 'Qual Escola?');
if (ifNode) {
    ifNode.parameters.conditions.options.typeValidation = "loose";
}

fs.writeFileSync('Busca de Boletos SPONTE_IF.json', JSON.stringify(flow, null, 2));
console.log('Fixed');
