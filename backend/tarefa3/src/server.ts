// src/index.ts

import express from 'express';
import cors from 'cors';
import bookingRoutes from './routes/BookingRoutes';

const app = express();
const PORT = 3030; 

// Configurações
app.use(express.json()); 
app.use(cors()); 

// Carrega as rotas
app.use('/api', bookingRoutes);

// Rota de teste simples
app.get('/', (req, res) => {
    res.send('API de Agendamento de Consultas rodando. Acesse /api/specialties');
});

// Inicialização
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});