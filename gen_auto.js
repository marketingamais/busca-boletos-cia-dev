const fs = require('fs');

let flow = {
  "name": "Busca de Boletos SPONTE (Automático)",
  "nodes": [
    {
      "parameters": {
        "respondWith": "text",
        "responseBody": "={{ $json.message }}"
      },
      "id": "webhook",
      "name": "Webhook Inicial",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [0, 200],
      "webhookId": "boleto-auto"
    },
    {
      "parameters": {
        "jsCode": "const cpf = ($input.first().json.query?.CPF || $input.first().json.body?.CPF || $input.first().json.CPF || '').toString().replace(/\\D/g, '');\nif (cpf.length !== 11) throw new Error('CPF invǭlido: informe 11 dgitos. Recebido: ' + cpf);\nlet formattedCpf = cpf.replace(/(\\d{3})(\\d{3})(\\d{3})(\\d{2})/, \"$1.$2.$3-$4\");\nreturn [{ json: { cpf: formattedCpf } }];"
      },
      "id": "validar-cpf",
      "name": "Validar CPF",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [200, 200]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://integracaopp.sponteweb.com.br/api/v3/Auth/login",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "{\n  \"email\": \"milenanogueira-itz-ma@hotmail.com\",\n  \"password\": \"vPT3KBftA28@Qo8X\",\n  \"codCliSponte\": 8731\n}",
        "options": {
          "ignoreResponseCode": true
        }
      },
      "id": "login-8731",
      "name": "Login 8731",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [400, 200]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://integracaopp.sponteweb.com.br/api/v3/Auth/login",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "{\n  \"email\": \"milenanogueira-itz-ma@hotmail.com\",\n  \"password\": \"vPT3KBftA28@Qo8X\",\n  \"codCliSponte\": 70532\n}",
        "options": {
          "ignoreResponseCode": true
        }
      },
      "id": "login-70532",
      "name": "Login 70532",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [600, 200]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "={{ 'https://webservices.sponteweb.com.br/WSApiSponteRest/api/students?CPF=' + $('Validar CPF').first().json.cpf }}",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "api_key", "value": "87E821" },
            { "name": "Accept", "value": "application/json" }
          ]
        },
        "options": {
          "ignoreResponseCode": true
        }
      },
      "id": "buscar-8731",
      "name": "Buscar Alunos 8731",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [800, 200]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "={{ 'https://webservices.sponteweb.com.br/WSApiSponteRest/api/students?CPF=' + $('Validar CPF').first().json.cpf }}",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "api_key", "value": "0EA64A" },
            { "name": "Accept", "value": "application/json" }
          ]
        },
        "options": {
          "ignoreResponseCode": true
        }
      },
      "id": "buscar-70532",
      "name": "Buscar Alunos 70532",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [1000, 200]
    },
    {
      "parameters": {
        "jsCode": "let token8731 = $('Login 8731').first().json.accessToken;\nlet token70532 = $('Login 70532').first().json.accessToken;\n\nlet res8731 = $('Buscar Alunos 8731').first().json || {};\nlet res70532 = $('Buscar Alunos 70532').first().json || {};\n\nlet alunos8731 = res8731.value || res8731 || [];\nif (!Array.isArray(alunos8731)) alunos8731 = [alunos8731];\n\nlet alunos70532 = res70532.value || res70532 || [];\nif (!Array.isArray(alunos70532)) alunos70532 = [alunos70532];\n\nlet result = [];\nfor (let a of alunos8731) {\n    if (a.student_id) result.push({ json: { alunoId: a.student_id, token: token8731, escola: 'CIA (8731)', nome: a.name } });\n}\nfor (let a of alunos70532) {\n    if (a.student_id) result.push({ json: { alunoId: a.student_id, token: token70532, escola: 'CIA KIDS (70532)', nome: a.name } });\n}\n\nif (result.length === 0) return [{ json: { error: true } }];\nreturn result;"
      },
      "id": "agrupar-alunos",
      "name": "Agrupar Alunos",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1200, 200]
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "loose",
            "version": 2
          },
          "conditions": [
            {
              "id": "cond-1",
              "leftValue": "={{ $json.error }}",
              "rightValue": "true",
              "operator": {
                "type": "boolean",
                "operation": "notEquals",
                "name": "filter.operator.notEquals"
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "id": "achou-alunos",
      "name": "Encontrou Alunos?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2.2,
      "position": [1400, 200]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "={{ 'https://integracaopp.sponteweb.com.br/api/v3/ContasReceber?AlunoID=' + $json.alunoId + '&Situacao=0' }}",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "Authorization", "value": "={{ 'Bearer ' + $json.token }}" }
          ]
        },
        "options": {
          "ignoreResponseCode": true
        }
      },
      "id": "buscar-boletos",
      "name": "Buscar Boletos V3",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [1600, 100]
    },
    {
      "parameters": {
        "jsCode": "let allItems = $input.all();\nlet today = new Date();\nlet hasOver6Days = false;\nlet boletosParaEnviar = [];\n\nfor (let item of allItems) {\n    let boletos = item.json.ContasReceber || item.json.data || item.json || [];\n    if (!Array.isArray(boletos)) {\n        if (boletos.DataVencimento) boletos = [boletos];\n        else boletos = [];\n    }\n    \n    for (let b of boletos) {\n        let sit = b.Situacao || b.situacao;\n        if (sit !== 0 && sit !== 'Aberto' && sit !== 'Pendente') continue;\n        \n        let vencimentoStr = b.DataVencimento || b.dataVencimento;\n        if (!vencimentoStr) continue;\n        \n        let vencimento = new Date(vencimentoStr);\n        let diffTime = today - vencimento;\n        let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); \n        \n        if (diffDays >= 6) {\n            hasOver6Days = true;\n        } else {\n            boletosParaEnviar.push(b.LinhaDigitavel || b.linhaDigitavel || b.ContaReceberID || 'Boleto sem linha digitǭvel');\n        }\n    }\n}\n\nlet message = \"VOCS EST? EM DIA!\";\nif (hasOver6Days) {\n    message = \"entre em contato com: 0800 886 0663\";\n} else if (boletosParaEnviar.length > 0) {\n    message = \"Aqui estǜo seus boletos:\\n\" + boletosParaEnviar.join(\"\\n\");\n}\n\nreturn [{ json: { message } }];"
      },
      "id": "processar-boletos",
      "name": "Processar Boletos",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1800, 100]
    },
    {
      "parameters": {
        "respondWith": "text",
        "responseBody": "Nǜo encontramos nenhum aluno com esse CPF em nenhuma das nossas escolas."
      },
      "id": "resposta-nao-encontrado",
      "name": "Nǜo Encontrado",
      "type": "n8n-nodes-base.formResponse",
      "typeVersion": 1,
      "position": [1600, 300]
    },
    {
      "parameters": {
        "respondWith": "text",
        "responseBody": "={{ $json.message }}"
      },
      "id": "resposta-boletos",
      "name": "Retornar Boletos",
      "type": "n8n-nodes-base.formResponse",
      "typeVersion": 1,
      "position": [2000, 100]
    }
  ],
  "connections": {
    "Webhook Inicial": {
      "main": [ [ { "node": "Validar CPF", "type": "main", "index": 0 } ] ]
    },
    "Validar CPF": {
      "main": [ [ { "node": "Login 8731", "type": "main", "index": 0 } ] ]
    },
    "Login 8731": {
      "main": [ [ { "node": "Login 70532", "type": "main", "index": 0 } ] ]
    },
    "Login 70532": {
      "main": [ [ { "node": "Buscar Alunos 8731", "type": "main", "index": 0 } ] ]
    },
    "Buscar Alunos 8731": {
      "main": [ [ { "node": "Buscar Alunos 70532", "type": "main", "index": 0 } ] ]
    },
    "Buscar Alunos 70532": {
      "main": [ [ { "node": "Agrupar Alunos", "type": "main", "index": 0 } ] ]
    },
    "Agrupar Alunos": {
      "main": [ [ { "node": "Encontrou Alunos?", "type": "main", "index": 0 } ] ]
    },
    "Encontrou Alunos?": {
      "main": [
        [ { "node": "Buscar Boletos V3", "type": "main", "index": 0 } ],
        [ { "node": "Nǜo Encontrado", "type": "main", "index": 0 } ]
      ]
    },
    "Buscar Boletos V3": {
      "main": [ [ { "node": "Processar Boletos", "type": "main", "index": 0 } ] ]
    },
    "Processar Boletos": {
      "main": [ [ { "node": "Retornar Boletos", "type": "main", "index": 0 } ] ]
    }
  }
};

fs.writeFileSync('Busca de Boletos SPONTE_Auto.json', JSON.stringify(flow, null, 2));
