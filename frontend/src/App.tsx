import { useState, useCallback } from 'react'; 
import WelcomeScreen from './components/WelcomeScreen'; 
import ChatMenu from './components/ChatMenu';
import ChatIA from './components/ChatIA'; 
import ChatPDF from './components/ChatPDF'; 
import ChatAgendamento from './components/ChatAgendamento'; 
import TestChat from './components/TestChat'; 


type ChatType = 'loading' | 'menu' | 'ia' | 'pdf' | 'agendamento';

function App() {
    const [currentChat, setCurrentChat] = useState<ChatType>('loading');
    const returnToMenu = useCallback(() => setCurrentChat('menu'), []);

    // 💡 CORREÇÃO 1: A função renderContent precisa de um return final
    const renderContent = () => {
        
        // 1. Caso de Loading / Boas-vindas
        if (currentChat === 'loading') {
            return <WelcomeScreen onFinishLoading={returnToMenu} />; 
        }
        
        // 2. Caso de Menu Principal
        if (currentChat === 'menu') {
            return <ChatMenu onSelectChat={setCurrentChat} />; 
        }
        
        // 3. Casos de Chats Específicos
        switch (currentChat) {
            case 'ia':
                // 1º CHAT: IA Generativa (Porta 3002)
                return <ChatIA onBack={returnToMenu} backendUrl="http://localhost:3002" />;
            
            case 'pdf':
                // 2º CHAT: Leitor de PDF (Porta 3003)
                return <ChatPDF onBack={returnToMenu} backendUrl="http://localhost:3003" />;

            case 'agendamento':
                // 3º CHAT: Agendamento de Consultas (Porta 3030)
                return <ChatAgendamento onBack={returnToMenu} backendUrl="http://localhost:3030" />;
                
            default:
                // Se cair em um estado inválido, volta para o menu
                return <ChatMenu onSelectChat={setCurrentChat} />;
        }
    }; // 💡 CORREÇÃO 2: Fechamento correto da função renderContent

    return (
        // Layout Tailwind
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="w-full max-w-4xl h-[80vh] bg-white shadow-2xl rounded-xl flex flex-col overflow-hidden">
                {/* 💡 CORREÇÃO 3: Aqui estava faltando o conteúdo do return */}
                {renderContent()}
            </div>
        </div>
    );
}

export default App;