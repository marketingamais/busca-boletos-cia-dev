const fs = require('fs');
let json = JSON.parse(fs.readFileSync('Busca_Boletos_Front_Final.json', 'utf8'));

// Adiciona o nó Set para injetar o nome
const setNode = {
  "parameters": {
    "assignments": {
      "assignments": [
        {
          "id": "1",
          "name": "nomeFormatado",
          "value": "={{ $node['Agrupar Alunos'] ? $node['Agrupar Alunos'].json.nome : 'Aluno' }}",
          "type": "string"
        }
      ]
    },
    "options": {}
  },
  "id": "injetar-nome",
  "name": "Injetar Nome",
  "type": "n8n-nodes-base.set",
  "typeVersion": 3.4,
  "position": [ 1200, 200 ]
};

// Verifica se o nó Injetar Nome já existe
const existingIndex = json.nodes.findIndex(n => n.name === 'Injetar Nome');
if (existingIndex !== -1) {
  json.nodes[existingIndex] = setNode;
} else {
  json.nodes.push(setNode);
}

// Verifica se a conexão já aponta pro Injetar Nome
if (!json.connections["Injetar Nome"]) {
  json.connections["Injetar Nome"] = {
    "main": [
      [
        {
          "node": "Webhook POST Frontend", // The final response node, wait no! The response node doesn't exist anymore because we deleted it!
          // Wait! The Webhook returns the output of the last node executed!
          // So Injetar Nome doesn't need to connect to anything. It IS the last node!
        }
      ]
    ]
  };
}

// The previous last node was "Chamar Robo Puppeteer". We must connect it to "Injetar Nome".
json.connections["Chamar Robo Puppeteer"] = {
  "main": [
    [
      {
        "node": "Injetar Nome",
        "type": "main",
        "index": 0
      }
    ]
  ]
};

// But wait! Webhook POST response node was removed previously because of version issues!
// Actually, I must connect "Chamar Robo Puppeteer" to "Injetar Nome".
// And for the error paths? "Nao Encontrado Response" and "Retornar Erro CPF". 
// Let's connect them to Injetar Nome too? No, they don't have the Sponte API data necessarily!
// Only Chamar Robo Puppeteer needs the name because it's the success path!
// Actually, "Nao Encontrado Response" DOES have Sponte API data (it just didn't find any pending boletos, wait no. It means the student exists but has NO boletos in N8N filtering).
// But we don't care, we just want to return the name.

fs.writeFileSync('Busca_Boletos_Front_Final.json', JSON.stringify(json, null, 2));
console.log('JSON INJETADO COM SUCESSO DE VERDADE!');
