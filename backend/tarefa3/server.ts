import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

// 💡 Importa os seus Controllers REST existentes
import * as doctorController from "./controllers/doctorController";
// 💡 NOVO: Importa o Controller de Fluxo do Chatbot
import { handleChat } from "./controllers/chatController"; 

const app = express();
const PORT = 3030; // A porta correta para o Agendamento

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// --- ROTAS DE SERVIÇO (REST) ---

app.get("/doctors", doctorController.getDoctors);
app.get("/doctors/:id/slots", doctorController.getDoctorSlots);
app.post("/book", doctorController.createBooking);
app.post("/chat", handleChat);


// Inicia o servidor na porta 3030
app.listen(PORT, () => 
    console.log(`🚀 Servidor de Agendamento rodando em http://localhost:${PORT}`)
);