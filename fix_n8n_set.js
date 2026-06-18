const fs = require('fs');
let json = JSON.parse(fs.readFileSync('Busca_Boletos_Front_Final.json', 'utf8'));

// Troca o node 'Injetar Nome' (que era Code) por um Set Node!
for (let i = 0; i < json.nodes.length; i++) {
  if (json.nodes[i].name === 'Injetar Nome') {
    json.nodes[i] = {
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "id": "1",
              "name": "nomeCompleto",
              "value": "={{ \['Agrupar Alunos'] ? \['Agrupar Alunos'].json.nome : 'Aluno' }}",
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
  }
}

fs.writeFileSync('Busca_Boletos_Front_Final.json', JSON.stringify(json, null, 2));
console.log('JSON modificado para usar SET node!');
