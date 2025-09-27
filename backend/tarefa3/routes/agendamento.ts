// tarefa3/routes/agendamento.ts

import { Router } from 'express';
// Importa a função principal do controlador
import { handleChat } from '../controllers/chatController'; 

const router = Router();

/**
 * Rota POST /
 * Endpoint esperado pelo front-end: POST http://localhost:3030/api/agendamento
 * Objetivo: Receber a mensagem e o sessionId, e retornar a próxima resposta do fluxo.
 */
router.post('/', handleChat);

export default router;