// Carrega as variáveis de ambiente do arquivo .env
require("dotenv").config();

// Módulos nativos do Node.js para manipulação de arquivos e caminhos
const fs = require("fs");
const path = require("path");

// Importa o cliente de inferência da Hugging Face (biblioteca oficial)
const { InferenceClient } = require("@huggingface/inference");

// Obtém a chave da API Hugging Face do arquivo .env
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;

// Cria um cliente de inferência autenticado
const client = new InferenceClient(HF_API_KEY);

// ===== Preparação do contexto institucional =====
// Lê o arquivo "contexto.txt" que contém informações institucionais
// Esse conteúdo será enviado como "system prompt" para o modelo
const contextPath = path.join(__dirname, "..", "contexto.txt");
const contextoInstitucional = fs.readFileSync(contextPath, "utf-8");

/**
 * Função responsável por enviar uma pergunta ao modelo de IA da Hugging Face
 * 
 * @param {string} question - Pergunta feita pelo usuário
 * @returns {Promise<string>} - Resposta gerada pela IA
 */
async function askHuggingFace(question) {
  try {
    // Faz a chamada ao endpoint de chat da Hugging Face
    const chatCompletion = await client.chatCompletion({
      provider: "fireworks-ai", // Provedor que hospeda o modelo
      model: "meta-llama/Llama-3.1-8B-Instruct", // Modelo utilizado
      messages: [
        {
          role: "system", // Define o contexto institucional como instrução de sistema
          content: contextoInstitucional,
        },
        {
          role: "user", // Pergunta do usuário
          content: question,
        },
      ],
    });

    // Retorna a resposta da IA (se existir), caso contrário "Sem resposta."
    return chatCompletion.choices?.[0]?.message?.content || "Sem resposta.";
  } catch (error) {
    // Em caso de erro, loga no console e retorna mensagem de erro
    console.error("Erro Hugging Face:", error);
    return "Erro ao obter resposta da IA.";
  }
}

// Exporta a função para ser utilizada em outros arquivos (ex.: rotas do Express)
module.exports = { askHuggingFace };