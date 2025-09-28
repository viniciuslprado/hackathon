// src/components/ChatIA.tsx (Design Web Moderno)

import React, { useState, useCallback, useRef, useEffect, type KeyboardEvent } from 'react';

interface ChatIAProps {
  onBack: () => void;           
  backendUrl: string;          
}
interface Message {
    id: number;
    text: string;
    sender: 'user' | 'bot'; 
    time: string; 
}
const getTime = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

const ChatIA: React.FC<ChatIAProps> = ({ onBack, backendUrl }) => {
    const [inputQuestion, setInputQuestion] = useState<string>(''); 
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 0,
            text: "Olá! Sou o Chatbot Uni-FACEF (IA). Como posso ajudar-te hoje? Digite **voltar** para retornar ao menu principal.",
            sender: 'bot',
            time: getTime(),
        },
    ]); 
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]); 

    const enviarPergunta = useCallback(async () => {
        const questionText = inputQuestion.trim();
        if (!questionText || isLoading) return;
        if (questionText.toLowerCase() === 'voltar') {
            onBack();
            return;
        }

        setIsLoading(true);
        setInputQuestion(''); 

        // 1. Mensagem do utilizador (ENVIADA)
        const userMessage: Message = { id: Date.now(), text: questionText, sender: 'user', time: getTime() };
        setMessages((prevMessages) => [...prevMessages, userMessage]);

        try {
             const res = await fetch(`${backendUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: questionText }),
            });
            if (!res.ok) throw new Error(`Erro de rede: ${res.status}`);
            const data = await res.json();
            const botResponseText = data.response || 'Não consegui obter uma resposta.';

            // 3. Resposta do bot (RECEBIDA)
            const botMessage: Message = { id: Date.now() + 1, text: botResponseText, sender: 'bot', time: getTime() };
            setMessages((prevMessages) => [...prevMessages, botMessage]);
        } catch (err) {
            console.error('Erro na requisição:', err);
            const errorMessage: Message = { id: Date.now() + 1, text: `Erro ao se comunicar com o serviço de IA. Verifique o backend (${backendUrl}).`, sender: 'bot', time: getTime() };
            setMessages((prevMessages) => [...prevMessages, errorMessage]);
        } finally {
            setIsLoading(false);
        }

    }, [inputQuestion, isLoading, onBack, backendUrl]); 
    
    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && !isLoading) {
            enviarPergunta();
        }
    };

    return (
        // Container Principal
        <div className="w-full h-full bg-white flex flex-col overflow-hidden"> 
            
            {/* 1. Header do Chat (TOPO - ROXO) */}
            <div className="bg-violet-700 text-white p-4 flex items-center justify-between min-h-[70px] shadow-lg">
                <div className="flex items-center">
                    {/* Botão de VOLTAR */}
                    <button onClick={onBack} className="text-2xl mr-4 hover:text-gray-300 transition duration-150">←</button> 
                    <div className="w-10 h-10 bg-violet-400 rounded-full mr-3 flex items-center justify-center text-xl">🤖</div>
                    <div className="text-left">
                        <span className="font-bold block text-lg">Chat IA Uni-FACEF</span>
                        <span className={`text-xs ${isLoading ? 'text-yellow-300' : 'text-green-300'}`}>
                            {isLoading ? 'digitando...' : 'disponível'}
                        </span>
                    </div>
                </div>
            </div>

            {/* 2. Área de Mensagens (Scrollable) */}
            <div className="flex-grow p-4 overflow-y-auto bg-gray-50"> 
                {/* Mensagem de Serviço (MAIS PROFISSIONAL) */}
                <div className="bg-gray-200 p-2 rounded-lg text-center text-xs text-gray-600 mb-6 border border-gray-300">
                     Sua conversa com a IA é sigilosa e privada.
                </div>
                
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex mb-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`
                            max-w-[85%] p-3 rounded-xl shadow-md text-sm leading-relaxed
                            ${msg.sender === 'user' 
                                // Balão Enviado: Roxo principal com bordas padrão
                                ? 'bg-violet-600 text-white' 
                                // Balão Recebido: Fundo claro
                                : 'bg-white border border-gray-200 text-gray-800'
                            }
                        `}>
                            <p className="mr-4 whitespace-pre-wrap">{msg.text}</p>
                            <span className={`absolute bottom-1 right-2 text-xs ${msg.sender === 'user' ? 'text-gray-200' : 'text-gray-500'} whitespace-nowrap`}>
                                {msg.time}
                            </span>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* 3. Footer de Envio (Input moderno) */}
            <div className="p-4 bg-gray-100 flex items-center border-t border-gray-300">
                <input
                    type="text"
                    placeholder="Digite sua pergunta..."
                    value={inputQuestion} 
                    onChange={(e) => setInputQuestion(e.target.value)} 
                    onKeyDown={handleKeyDown} 
                    disabled={isLoading} 
                    className="flex-grow p-3 border-2 border-gray-300 rounded-full mr-3 bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 focus:outline-none disabled:opacity-75"
                />
                <button onClick={enviarPergunta} disabled={!inputQuestion.trim() || isLoading}
                    // Botão de Envio: Roxo principal
                    className="w-12 h-12 rounded-full bg-violet-700 text-white flex justify-center items-center text-xl transition duration-150 ease-in-out hover:bg-violet-800 disabled:bg-gray-400"
                >
                    <span className="transform -rotate-45 -translate-y-[1px] ml-1">➤</span> 
                </button>
            </div>
        </div>
    );
};

export default ChatIA;