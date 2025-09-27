// Importa o framework Express (para criar o servidor web)
const express = require('express');

// Importa o middleware CORS (permite que outros domínios/portas acessem a API)
const cors = require('cors');

// Importa as rotas do chatbot definidas em outro arquivo
const chatRoutes = require('./routes/chat');

// Carrega variáveis de ambiente do arquivo .env (como PORT, API_KEY etc.)
require('dotenv').config();

// Cria a aplicação Express
const app = express();

// Habilita CORS para aceitar requisições de outros domínios (ex.: frontend rodando em outra porta)
app.use(cors());

// Configura o servidor para interpretar JSON no corpo das requisições
app.use(express.json());

// Define a rota principal do chatbot, prefixada com /api/chat
// Exemplo: POST http://localhost:3000/api/chat
app.use('/api/chat', chatRoutes);

// Define a porta: pega da variável de ambiente (.env) ou usa 3000 por padrão
const PORT = process.env.PORT || 3000;

// Inicia o servidor e exibe no console em qual porta está rodando
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});