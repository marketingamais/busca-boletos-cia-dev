const fs = require('fs');
let json = JSON.parse(fs.readFileSync('Busca_Boletos_Front_Final.json', 'utf8'));

let optionsNode = json.nodes.find(n => n.name === 'Webhook OPTIONS CORS');
optionsNode.parameters.responseMode = 'onReceived';
optionsNode.parameters.options = {
  "responseHeaders": {
    "entries": [
      { "name": "Access-Control-Allow-Origin", "value": "*" },
      { "name": "Access-Control-Allow-Methods", "value": "POST, OPTIONS" },
      { "name": "Access-Control-Allow-Headers", "value": "Content-Type" }
    ]
  }
};

let postNode = json.nodes.find(n => n.name === 'Webhook POST Frontend');
postNode.parameters.options = {
  "responseHeaders": {
    "entries": [
      { "name": "Access-Control-Allow-Origin", "value": "*" },
      { "name": "Access-Control-Allow-Methods", "value": "POST, OPTIONS" },
      { "name": "Access-Control-Allow-Headers", "value": "Content-Type" }
    ]
  }
};

fs.writeFileSync('Busca_Boletos_Front_Final.json', JSON.stringify(json, null, 2));
console.log('JSON headers readicionados!');
