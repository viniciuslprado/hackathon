import React from 'react';
import { FaCalendarAlt, FaRobot, FaFilePdf } from 'react-icons/fa'; 

// Ajuste a tipagem: EXPORTANDO para que o App.tsx possa usá-la
export type SelectableChatType = 'ia' | 'pdf' | 'agendamento';

interface ChatMenuProps {
    onSelectChat: (chatType: SelectableChatType) => void;
    backendUrl: string; // Mantido para compatibilidade
}

// Interface para os dados de cada botão (Não precisa ser exportada)
interface MenuItem {
    type: SelectableChatType;
    title: string;
    subtitle: string;
    icon: React.ElementType; 
}

// Definições de Cores
const PRIMARY_COLOR = 'indigo-700'; // Roxo Escuro
const SECONDARY_COLOR = 'emerald-700'; // Verde Escuro

// DADOS DOS SERVIÇOS
const menuItems: MenuItem[] = [
    { type: 'ia', title: 'Chat IA', subtitle: 'Perguntas e informações gerais', icon: FaRobot },
    { type: 'agendamento', title: 'Agendamento', subtitle: 'Consultas médicas e protocolo', icon: FaCalendarAlt },
    { type: 'pdf', title: 'Leitor PDF', subtitle: 'Consultar documentos e exames', icon: FaFilePdf },
];

// --- Subcomponente do Botão de Menu (CORRIGIDO) ---
// Passamos explicitamente todas as props para evitar a quebra de tipagem
const MenuButton: React.FC<MenuItem & { onClick: () => void }> = ({ title, subtitle, icon: IconComponent, onClick, type }) => (
    <button
        onClick={onClick}
        // Design do Botão: Fundo Branco, Sombra suave, Hover com Borda Roxa
        className={`flex flex-col items-center justify-center p-8 bg-white 
                    border-2 border-transparent rounded-xl shadow-lg 
                    hover:border-2 hover:border-indigo-700 hover:shadow-xl transition 
                    duration-300 ease-in-out transform hover:scale-[1.03]`}
        aria-label={`Iniciar serviço: ${title}`}
    >
        {/* Ícone: Roxo Escuro (text-indigo-700) */}
        <IconComponent className={`text-5xl mb-4 text-${PRIMARY_COLOR}`} />
        
        {/* Título: Roxo Escuro (font-bold) */}
        <span className={`text-xl font-extrabold text-${PRIMARY_COLOR} mb-1`}>{title}</span>
        
        {/* Subtítulo: Cinza sutil */}
        <span className="text-sm text-gray-500 text-center">{subtitle}</span>
    </button>
);

// --- Componente Principal ---
const ChatMenu: React.FC<ChatMenuProps> = ({ onSelectChat }) => {
    return (
        // Fundo Verde Suave (bg-emerald-100) preenchendo a tela toda (h-full w-full)
        <div className="flex flex-col h-full w-full p-8 bg-emerald-100">
            
            {/* Título Principal: Cor Roxo Escuro para melhor contraste com fundo verde */}
            <h2 className={`text-4xl font-extrabold text-${PRIMARY_COLOR} mb-12 text-center mt-6`}>
                Selecione o Serviço
            </h2>
            
            {/* Grade dos Botões */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto w-full">
                {menuItems.map((item) => (
                    <MenuButton 
                        key={item.type}
                        // CORREÇÃO: Passando as propriedades individualmente
                        title={item.title}
                        subtitle={item.subtitle}
                        icon={item.icon}
                        type={item.type} // Passamos o tipo para satisfazer o MenuButton
                        onClick={() => onSelectChat(item.type)} 
                    />
                ))}
            </div>
            
            {/* Rodapé */}
            <footer className={`mt-auto pb-4 pt-8 text-center text-sm text-gray-600`}>
                Desenvolvido por <span className={`font-bold text-${PRIMARY_COLOR}`}>DevUnity</span> | Parceiro de Programação v1.0
            </footer>
        </div>
    );
};

export default ChatMenu;