import React, { useState, useCallback, useRef, useEffect, type KeyboardEvent } from 'react';

// Definição de tipo para uma mensagem
interface Message {
    id: number;
    text: string;
    sender: 'user' | 'bot'; 
    time: string; 
}

const Chatbot: React.FC = () => {
    const [inputQuestion, setInputQuestion] = useState<string>(''); 
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 0,
            text: "Olá! Sou o Chatbot Uni-FACEF. Como posso ajudar-te hoje?",
            sender: 'bot',
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        },
    ]); 
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Efeito para rolar automaticamente
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]); 

    const enviarPergunta = useCallback(async () => {
        const questionText = inputQuestion.trim();

        if (!questionText || isLoading) return;

        setIsLoading(true);
        setInputQuestion(''); 

        // 1. Mensagem do utilizador (ENVIADA: VERDE)
        const userMessage: Message = { id: Date.now(), text: questionText, sender: 'user', time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) };
        setMessages((prevMessages) => [...prevMessages, userMessage]);

        try {
             // 2. Requisição para o BACKEND
             const res = await fetch('http://localhost:3000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: questionText }),
            });

            if (!res.ok) throw new Error(`Erro de rede: ${res.status}`);

            const data = await res.json();
            const botResponseText = data.response || 'Não consegui obter uma resposta.';

            // 3. Resposta do bot (RECEBIDA: BRANCO)
            const botMessage: Message = { id: Date.now() + 1, text: botResponseText, sender: 'bot', time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) };
            setMessages((prevMessages) => [...prevMessages, botMessage]);
        } catch (err) {
            console.error('Erro na requisição:', err);
            const errorMessage: Message = { id: Date.now() + 1, text: 'Erro ao se comunicar com o servidor. Verifique o backend (porta 3000).', sender: 'bot', time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) };
            setMessages((prevMessages) => [...prevMessages, errorMessage]);
        } finally {
            setIsLoading(false);
        }

    }, [inputQuestion, isLoading]); 

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && !isLoading) {
            enviarPergunta();
        }
    };

    return (
        // Container Principal (Mockup do Telemóvel)
        <div className="w-full max-w-sm h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
            
            {/* 1. Header do Chat (TOPO - ROXO) */}
            <div className="bg-violet-700 text-white p-3 flex items-center justify-between min-h-[60px] z-10">
                <div className="flex items-center">
                    <span className="text-xl mr-4 transform rotate-180">➦</span> 
                    <div className="w-10 h-10 bg-violet-400 rounded-full mr-3"></div>
                    <div className="text-left">
                        <span className="font-bold block">Chatbot Uni-FACEF</span>
                        <span className={`text-xs ${isLoading ? 'text-yellow-300' : 'text-green-400'}`}>
                            {isLoading ? 'digitando...' : 'online'}
                        </span>
                    </div>
                </div>
                <div className="text-xl">...</div> 
            </div>

            {/* 2. Área de Mensagens (Scrollable) */}
            <div className="flex-grow p-3 overflow-y-auto bg-gray-200">
                {/* Mensagem de Criptografia (Roxo Claro) */}
                <div className="bg-violet-100 p-2 rounded-lg text-center text-xs text-gray-700 mb-4 shadow-sm border border-violet-300">
                     As mensagens e as chamadas são protegidas...
                </div>
                
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex mb-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`
                            max-w-[80%] p-2 rounded-lg relative shadow-md text-sm leading-tight
                            ${msg.sender === 'user' 
                                ? 'bg-green-300 rounded-br-none ml-auto' // Balão Enviado: VERDE
                                : 'bg-white rounded-bl-none' // Balão Recebido: BRANCO
                            }
                        `}>
                            <p className="mr-10 whitespace-pre-wrap">{msg.text}</p>
                            <span className="absolute bottom-1 right-2 text-xs text-gray-500 whitespace-nowrap">
                                {msg.time}
                            </span>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* 3. Footer de Envio (Fixo - Roxo e Verde) */}
            <div className="p-2 bg-gray-100 flex items-center">
                <input
                    type="text"
                    placeholder="Digite aqui..."
                    value={inputQuestion} 
                    onChange={(e) => setInputQuestion(e.target.value)} 
                    onKeyDown={handleKeyDown} 
                    disabled={isLoading} 
                    className="flex-grow p-3 border-none rounded-full mr-2 bg-white focus:ring-2 focus:ring-violet-500 focus:outline-none disabled:opacity-75"
                />
                <button onClick={enviarPergunta} disabled={isLoading}
                    // Botão de Envio: VERDE de Destaque
                    className="w-11 h-11 rounded-full bg-green-500 text-white flex justify-center items-center p-0 transition duration-150 ease-in-out hover:bg-green-600 disabled:bg-gray-400"
                >
                    <span className="text-xl transform rotate-45 -translate-y-[2px]">▲</span> 
                </button>
            </div>
        </div>
    );
};

export default Chatbot;