import React from 'react';

type ChatSelection = 'ia' | 'pdf' | 'agendamento'; 

interface ChatMenuProps {
  onSelectChat: (chatType: ChatSelection) => void; 
}

const ChatMenu: React.FC<ChatMenuProps> = ({ onSelectChat }) => {
  return (
    <div className="flex flex-col h-full items-center justify-center p-8 bg-gray-50">
      
      <h1 className="text-2xl font-extrabold text-indigo-900 mb-6">
        Selecione um Serviço
      </h1>

      <p className="text-gray-600 text-center mb-8">
        Escolha a área de atendimento que você deseja interagir.
      </p>

      <div className="w-full space-y-4">
        
        {/* Opção 1: Chat de IA (Indigo) */}
        <button
          onClick={() => onSelectChat('ia')}
          className="w-full flex items-center justify-start p-4 bg-indigo-700 text-white rounded-xl shadow-lg hover:bg-indigo-800 transition duration-200"
        >
          {/* 💡 ÍCONE SVG: Zap / Lightning Bolt */}
          <svg className="w-6 h-6 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          <span className="font-semibold text-left">1. Tira-dúvidas com **IA Generativa**</span>
        </button>

        {/* Opção 2: Leitor de PDF (Indigo Suave) */}
        <button
          onClick={() => onSelectChat('pdf')}
          className="w-full flex items-center justify-start p-4 bg-indigo-500 text-white rounded-xl shadow-lg hover:bg-indigo-600 transition duration-200"
        >
          {/* 💡 ÍCONE SVG: File / Document */}
          <svg className="w-6 h-6 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 2H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          <span className="font-semibold text-left">2. Leitura e Consulta de **Documentos PDF**</span>
        </button>

        {/* Opção 3: Chat de Agendamento (VERDE de Ação) */}
        <button
          onClick={() => onSelectChat('agendamento')}
          className="w-full flex items-center justify-start p-4 bg-emerald-600 text-white rounded-xl shadow-lg hover:bg-emerald-700 transition duration-200"
        >
          {/* 💡 ÍCONE SVG: Calendar / Agendamento */}
          <svg className="w-6 h-6 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          <span className="font-semibold text-left">3. Agendar **Consultas** (PostgreSQL)</span>
        </button>
        
      </div>

    </div>
  );
};

export default ChatMenu;