import React, { useState, useCallback, useRef, useEffect, type KeyboardEvent } from 'react';
// ❌ REMOVIDO: import { Calendar, Send, ArrowLeft } from 'lucide-react'; 

// Interfaces e Funções de utilidade
interface ChatProps {
  onBack: () => void;
  backendUrl: string; // http://localhost:3030
}
interface Message {
    id: number;
    text: string;
    sender: 'user' | 'bot'; 
    time: string; 
}
const getTime = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

// --- SVG Components (Substitutos de lucide-react) ---
// Usamos componentes simples para não poluir o JSX
const SvgArrowLeft = (props: { className?: string }) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
);
const SvgCalendar = (props: { className?: string }) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
);
const SvgSend = (props: { className?: string }) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
);
// --------------------------------------------------------

const ChatAgendamento: React.FC<ChatProps> = ({ onBack, backendUrl }) => {
    // ... (restante do seu state e lógica)
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputQuestion, setInputQuestion] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [sessionId] = useState<string>(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // ... (suas funções useEffect, handleSendMessage, handleKeyDown)
    // ... (a lógica de comunicação permanece a mesma)

    const handleSendMessage = useCallback(async (initialMessage = '', isInit = false) => {
        // ... (a lógica de comunicação permanece a mesma)
        const questionText = isInit ? initialMessage : inputQuestion.trim();
        
        if (!questionText && !isInit || isLoading) return;
        if (questionText.toLowerCase() === 'voltar') {
            onBack();
            return;
        }
        
        // ... (resto da lógica de adicionar mensagem e chamada fetch)
        if (!isInit) {
            const userMessage: Message = { id: Date.now(), text: questionText, sender: 'user', time: getTime() };
            setMessages((prevMessages) => [...prevMessages, userMessage]);
        }
        setInputQuestion('');
        setIsLoading(true);

        try {
            const response = await fetch(`${backendUrl}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: questionText }), 
            });

            if (!response.ok) throw new Error(`Erro de rede: ${response.status}`);
            const data = await response.json();
            
            const botMessage: Message = { id: Date.now() + 1, text: data.reply || 'Ops, algo deu errado no agendamento.', sender: 'bot', time: getTime() };
            setMessages((prevMessages) => [...prevMessages, botMessage]);

        } catch (error) {
            console.error('Erro na requisição de agendamento:', error);
            const errorMessage: Message = { id: Date.now() + 1, text: `❌ Erro de conexão com o backend de Agendamento (tarefa3: ${backendUrl}).`, sender: 'bot', time: getTime() };
            setMessages((prevMessages) => [...prevMessages, errorMessage]);
        } finally {
            setIsLoading(false);
        }

    }, [inputQuestion, isLoading, onBack, backendUrl, sessionId]); 

    // ... (useEffect para iniciar e rolar)
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
    useEffect(() => { handleSendMessage('', true); }, [handleSendMessage]);

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && !isLoading) {
            handleSendMessage();
        }
    };


    // Renderização com os novos SVGs
    return (
        <div className="w-full h-full bg-white flex flex-col overflow-hidden"> 
            
            {/* Header: Cor de destaque VERDE ESMERALDA */}
            <div className="bg-emerald-600 text-white p-4 flex items-center justify-between min-h-[70px] shadow-lg">
                <div className="flex items-center">
                    {/* 💡 SUBSTITUIÇÃO: ArrowLeft */}
                    <button onClick={onBack} className="text-2xl mr-4 hover:text-gray-300 transition duration-150">
                        <SvgArrowLeft className="w-6 h-6" />
                    </button> 
                    <div className="w-10 h-10 bg-emerald-400 rounded-full mr-3 flex items-center justify-center text-xl">
                        {/* 💡 SUBSTITUIÇÃO: Calendar */}
                        <SvgCalendar className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                        <span className="font-bold block text-lg">Agendamento (3º Chat)</span>
                        <span className={`text-xs ${isLoading ? 'text-yellow-300' : 'text-green-300'}`}>{isLoading ? 'processando...' : 'disponível'}</span>
                    </div>
                </div>
            </div>

            {/* Área de Mensagens (Visual de chat web) */}
            <div className="flex-grow p-4 overflow-y-auto bg-gray-50"> 
                {/* ... (restante do JSX de mensagens) */}
                <div className="bg-gray-200 p-2 rounded-lg text-center text-xs text-gray-600 mb-6 border border-gray-300">
                    Processo de agendamento passo a passo. Digite 'voltar' para sair.
                </div>
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex mb-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-xl shadow-md text-sm leading-relaxed relative ${msg.sender === 'user' 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-white border border-gray-200 text-gray-800'}`}>
                            <p className="mr-4 whitespace-pre-wrap">{msg.text}</p>
                            <span className={`absolute bottom-1 right-2 text-xs ${msg.sender === 'user' ? 'text-gray-200' : 'text-gray-500'} whitespace-nowrap`}>
                                {msg.time}
                            </span>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Footer de Input (Input moderno) */}
            <div className="p-4 bg-gray-100 flex items-center border-t border-gray-300">
                <input
                    type="text"
                    value={inputQuestion} 
                    onChange={(e) => setInputQuestion(e.target.value)} 
                    onKeyDown={handleKeyDown} 
                    placeholder="Responda para prosseguir..."
                    disabled={isLoading} 
                    className="flex-grow p-3 border-2 border-gray-300 rounded-full mr-3 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none disabled:opacity-75"
                />
                <button onClick={() => handleSendMessage()} disabled={!inputQuestion.trim() || isLoading}
                    className="w-12 h-12 rounded-full bg-emerald-600 text-white flex justify-center items-center text-xl transition duration-150 ease-in-out hover:bg-emerald-700 disabled:bg-gray-400"
                >
                    {/* 💡 SUBSTITUIÇÃO: Send */}
                    <SvgSend className="w-5 h-5 -translate-x-0.5" /> 
                </button>
            </div>
        </div>
    );
};

export default ChatAgendamento;