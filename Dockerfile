FROM ghcr.io/puppeteer/puppeteer:latest

WORKDIR /home/pptruser/app

# Copiando os arquivos com as permissões corretas para o usuário pptruser (não-root)
COPY --chown=pptruser:pptruser package*.json ./

RUN npm install

COPY --chown=pptruser:pptruser . .

EXPOSE 3000

CMD ["node", "sponte_api.js"]
