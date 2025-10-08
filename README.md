# 🏥 Sistema de Agendamento Médico - Health Unity

## 📋 Descrição do Projeto

O Sistema de Agendamento Médico é uma aplicação completa desenvolvida durante o hackathon 2025 Unifacef pela equipe **DevUnity**. O projeto oferece uma plataforma moderna e intuitiva para gerenciamento de consultas médicas, combinando inteligência artificial, processamento de documentos e agendamento automatizado.

### ✨ Funcionalidades Principais

- 🤖 **Chat IA**: Assistente virtual inteligente para orientação médica
- 📄 **Leitor PDF**: Análise e consulta de documentos médicos e exames
- 📅 **Sistema de Agendamento**: Reserva de consultas médicas com protocolo automático

## 🚀 Tecnologias Utilizadas

### Frontend
- **React 19.1.1** - Framework principal
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e bundler
- **Tailwind CSS** - Framework CSS
- **React Icons** - Ícones
- **Axios** - Cliente HTTP

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **TypeScript** - Tipagem para o backend
- **Prisma** - ORM e gerenciamento de banco de dados
- **PostgreSQL** - Banco de dados principal

### Integrações
- **Hugging Face** - API de IA para processamento de linguagem natural
- **PDF-Parse** - Processamento de documentos PDF
- **Tesseract.js** - OCR para reconhecimento de texto
- **Multer** - Upload de arquivos
- **Fuse.js** - Busca fuzzy
- **Date-fns** - Manipulação de datas

## 👥 Equipe DevUnity

[@gi-cardoso](https://github.com/gi-cardoso)
[@Duda-dorigan](https://github.com/Duda-dorigan)
[@lanacarol](https://github.com/lanacarol)
[@viniciuslprado](https://github.com/viniciuslprado)

## ⚙️ Configuração do Ambiente

### Pré-requisitos

- Node.js (v18)
- PostgreSQL
- npm

### 1. Clone o Repositório

```bashn 
git clone https://github.com/gi-cardoso/hackathon.git 
cd hackathon
```

### 2. Configuração do Backend

#### Tarefa 1 - Chat IA
```bash
cd backend/tarefa1
npm install
```

Crie um arquivo `.env`:
```env
HUGGINGFACE_API_KEY=sua_chave_aqui
PORT=3001
```

#### Tarefa 2 - Serviço PDF
```bash
cd ../tarefa2
npm install
```

Configure o banco de dados:
```bash
npx prisma migrate dev
npx prisma generate
```

#### Tarefa 3 - Sistema de Agendamento
```bash
cd ../tarefa3
npm install
```

Crie um arquivo `.env`:
```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/agendamento"
PORT=3003
```

Configure o banco de dados:
```bash
npx prisma migrate dev
npx prisma db seed
```

### 3. Configuração do Frontend

```bash
cd frontend
npm install
```

## 🏃‍♂️ Executando a Aplicação

### Executar Backend (em terminais separados)

```bash
# Terminal 1 - Chat IA
cd backend/tarefa1
npm start

# Terminal 2 - Serviço PDF
cd backend/tarefa2
npm start

# Terminal 3 - Sistema de Agendamento
cd backend/tarefa3
npm run dev
```

### Executar Frontend

```bash
cd frontend
npm run dev
```

A aplicação estará disponível em:
- Frontend: `http://localhost:5173`
- Backend Chat IA: `http://localhost:3001`
- Backend PDF: `http://localhost:3002`
- Backend Agendamento: `http://localhost:3003`

## 🎯 Como Usar

### 1. Chat IA
- Clique em "Chat IA" no menu principal
- Faça perguntas sobre saúde e medicina
- Receba orientações do assistente virtual

### 2. Leitor PDF
- Selecione "Leitor PDF"
- Faça upload de documentos médicos
- Consulte informações extraídas automaticamente

### 3. Agendamento
- Acesse "Agendamento"
- Escolha especialidade, médico e horário
- Preencha os dados do paciente
- Receba o protocolo de confirmação

## 📊 Banco de Dados

### Schema do Sistema de Agendamento

- **Specialty**: Especialidades médicas
- **Doctor**: Cadastro de médicos
- **AvailableHour**: Horários disponíveis
- **Booking**: Agendamentos confirmados

### Comandos Úteis do Prisma

```bash
# Visualizar dados
npx prisma studio

# Reset do banco
npx prisma migrate reset

# Gerar cliente
npx prisma generate
```

## 🛠️ Scripts Disponíveis

### Frontend
```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build para produção
npm run preview  # Preview da build
npm run lint     # Verificação de código
```

### Backend
```bash
npm start        # Produção
npm run dev      # Desenvolvimento
npm run seed     # Popular banco de dados
```

## 📝 Licença

Este projeto foi desenvolvido durante o hackathon Uni-facef 2025  e está disponível sob a licença MIT.
