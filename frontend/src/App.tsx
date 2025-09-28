// src/App.tsx

import { useState, useCallback } from 'react'; 
import WelcomeScreen from './components/WelcomeScreen'; 
// CORREÇÃO: Importa o valor (o componente) e o tipo (SelectableChatType) separadamente
import ChatMenu from './components/ChatMenu'; 
import type { SelectableChatType } from './components/ChatMenu'; // <-- NOVO: Importa APENAS o tipo
import ChatIA from './components/ChatIA'; 
import ChatPDF from './components/ChatPDF'; 
import ChatAgendamento from './components/ChatAgendamento'; 

// Variável definida no escopo do MÓDULO
const BACKEND_URL_DEFAULT = "http://localhost:3000"; 

// Tipos de telas da aplicação
type AppScreenType = 'loading' | 'menu' | SelectableChatType; 

function App() {
    
    const [currentChat, setCurrentChat] = useState<AppScreenType>('loading');
    
    // Função para voltar ao Menu
    const returnToMenu = useCallback(() => setCurrentChat('menu'), []);

    const renderContent = () => {
        
        if (currentChat === 'loading') {
            return <WelcomeScreen onFinishLoading={() => setCurrentChat('menu')} />; 
        }
        
        if (currentChat === 'menu') {
            return <ChatMenu onSelectChat={setCurrentChat} backendUrl={BACKEND_URL_DEFAULT} />; 
        }
        
        switch (currentChat) {
            case 'ia':
                return <ChatIA onBack={returnToMenu} backendUrl="http://localhost:3000" />;
            
            case 'pdf':
                return <ChatPDF onBack={returnToMenu} backendUrl="http://localhost:3060" />;

            case 'agendamento':
                return <ChatAgendamento onBack={returnToMenu} backendUrl="http://localhost:3030" />;
                                        
            default:
                // Usamos a conversão de tipo para o setCurrentChat (função de valor)
                return (
                    <ChatMenu 
                        onSelectChat={setCurrentChat as (type: SelectableChatType) => void} 
                        backendUrl={BACKEND_URL_DEFAULT} 
                    />
                );
        }
    };

    return (
        <div className="flex items-center justify-center h-screen w-screen bg-gray-50 p-0 overflow-hidden"> 
            <div className="w-full h-full bg-white shadow-none flex flex-col overflow-hidden">
                {renderContent()}
            </div>
        </div>
    );
}

export default App;