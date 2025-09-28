import React from 'react';

// Ajuste a tipagem conforme o seu App.tsx (sem 'loading' ou 'menu')
type SelectableChatType = 'ia' | 'pdf' | 'agendamento';

interface ChatMenuProps {
    onSelectChat: (chatType: SelectableChatType) => void;
}

const MenuButton: React.FC<{ title: string; subtitle: string; onClick: () => void }> = ({ title, subtitle, onClick }) => (
    <button
        onClick={onClick}
        className="flex flex-col items-center justify-center p-6 bg-white border border-gray-300 rounded-lg shadow-md hover:bg-emerald-50 hover:border-emerald-500 transition duration-200 ease-in-out text-center"
    >
        <span className="text-xl font-bold text-gray-800">{title}</span>
        <span className="text-sm text-gray-500 mt-1">{subtitle}</span>
    </button>
);

const ChatMenu: React.FC<ChatMenuProps> = ({ onSelectChat }) => {
    return (
        <div className="flex flex-col h-full p-8 bg-gray-50">
            <h2 className="text-3xl font-extrabold text-emerald-700 mb-8 text-center">
                Selecione o Serviço
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-grow">
                
                <MenuButton 
                    title="Agendamento" 
                    subtitle="Consulta médica e protocolo" 
                    onClick={() => onSelectChat('agendamento')} 
                />
                
                <MenuButton 
                    title="Chat IA" 
                    subtitle="Perguntas gerais" 
                    onClick={() => onSelectChat('ia')} 
                />
                
                <MenuButton 
                    title="Leitor PDF" 
                    subtitle="Consultar documentos" 
                    onClick={() => onSelectChat('pdf')} 
                />
                
            </div>
            
            <footer className="mt-8 text-center text-sm text-gray-500">
                Parceiro de Programação v1.0
            </footer>
        </div>
    );
};

export default ChatMenu;