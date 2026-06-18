const http = require('http');
const https = require('https');

async function testCPF(cpf) {
  const url1 = `http://api.sponteeducacional.net.br/WSAPIEdu.asmx/GetAlunos?nCodigoCliente=8731&sToken=6431N2408H2024R&sParametrosBusca=cpf=${cpf}`;
  
  return new Promise((resolve) => {
    http.get(url1, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
  });
}

testCPF("61076332358").then(console.log);
