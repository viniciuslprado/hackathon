// src/App.tsx

import { useState, useCallback } from 'react'; 
import WelcomeScreen from './components/WelcomeScreen'; 
import ChatMenu from './components/ChatMenu';
import ChatIA from './components/ChatIA'; 
import ChatPDF from './components/ChatPDF'; 
import ChatAgendamento from './components/ChatAgendamento'; 

// Tipos de destino (o que o Menu pode selecionar)
export type DestinationChatType = 'ia' | 'pdf' | 'agendamento';

// Tipos de telas da aplicação (inclui os estados de controle)
type AppScreenType = 'loading' | 'menu' | DestinationChatType;

function App() {
    const [currentChat, setCurrentChat] = useState<AppScreenType>('loading');
    
    // Função para voltar ao Menu
    const returnToMenu = useCallback(() => setCurrentChat('menu'), []);

    const renderContent = () => {
        
        if (currentChat === 'loading') {
            // Supondo que WelcomeScreen chama onFinishLoading após a animação
            return <WelcomeScreen onFinishLoading={() => setCurrentChat('menu')} />; 
        }
        
        if (currentChat === 'menu') {
            // O ChatMenu agora recebe uma função que pode definir o estado com DestinationChatType
            return <ChatMenu onSelectChat={setCurrentChat as (type: DestinationChatType) => void} />; 
        }
        
        // Se currentChat é 'ia', 'pdf' ou 'agendamento'
        switch (currentChat) {
            case 'ia':
                // CHAT IA: Mantém a porta 3000
                return <ChatIA onBack={returnToMenu} backendUrl="http://localhost:3000" />;
            
            case 'pdf':
                // CHAT PDF: Mantém a porta 3060
                return <ChatPDF onBack={returnToMenu} backendUrl="http://localhost:3060" />;

            case 'agendamento':
                // CHAT AGENDAMENTO: Corrigido para a porta 3030
                return <ChatAgendamento onBack={returnToMenu} backendUrl="http://localhost:3030" />;
                                        
            default:
                // Se cair em um estado inválido, retorna ao menu
                // (O TypeScript já ajuda a evitar este caso)
                return <ChatMenu onSelectChat={setCurrentChat as (type: DestinationChatType) => void} />;
        }
    };

    return (
        // Layout Tailwind para centralizar o container principal
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="w-full max-w-4xl h-[80vh] bg-white shadow-2xl rounded-xl flex flex-col overflow-hidden">
                {renderContent()}
            </div>
        </div>
    );
}

export default App;