import React, { useState, useCallback, useRef, useEffect, type KeyboardEvent } from 'react';
// Importação de ícones
import { FaArrowLeft, FaRobot, FaPaperPlane, FaInfoCircle, FaSpinner } from 'react-icons/fa';

// Interfaces e Funções de utilidade
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

// Definições de Cores (Consistentes com o tema Health Unity)
const PRIMARY_COLOR = 'indigo-700'; // Roxo Escuro
const USER_MESSAGE_BG = 'bg-indigo-600'; // Roxo para mensagens do usuário
const BG_EMERALD_50 = 'bg-emerald-50'; // Fundo suave para a área de mensagens
const BOT_MESSAGE_BG = 'bg-white'; // Balão branco do bot

// --- Componente Principal ---
const ChatIA: React.FC<ChatIAProps> = ({ onBack, backendUrl }) => {
    const [inputQuestion, setInputQuestion] = useState<string>(''); 
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 0,
            text: "Olá! Sou a Una. Como posso ajudar-te hoje? Digite 'voltar' para retornar ao menu principal.",
            sender: 'bot',
            time: getTime(),
        },
    ]); 
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null); // 💡 Referência para o Foco Persistente

    // Efeito para rolar automaticamente
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]); // Adicionado isLoading para scroll após o fim do carregamento

    // Efeito para Focar o input ao montar
    useEffect(() => {
        inputRef.current?.focus();
    }, []);


    const enviarPergunta = useCallback(async () => {
        const questionText = inputQuestion.trim();
        if (!questionText || isLoading) return;
        if (questionText.toLowerCase() === 'voltar') {
            onBack();
            return;
        }

        setIsLoading(true);
        // 1. Mensagem do utilizador (ENVIADA)
        const userMessage: Message = { id: Date.now(), text: questionText, sender: 'user', time: getTime() };
        setMessages((prevMessages) => [...prevMessages, userMessage]);
        setInputQuestion(''); 
        
        // 💡 Foco Persistente (1/2): Retorna o foco antes da requisição



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
            const errorMessage: Message = { 
                id: Date.now() + 1, 
                text: `❌ **Erro de Comunicação:** Não foi possível conectar ao servidor IA (${backendUrl}).`, 
                sender: 'bot', 
                time: getTime() 
            };
            setMessages((prevMessages) => [...prevMessages, errorMessage]);
        } finally {
            setIsLoading(false);
            // 💡 Foco Persistente (2/2): Garante que o foco volte após a resposta
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100); // Pequeno delay para garantir que a UI seja atualizada
        }

    }, [inputQuestion, isLoading, onBack, backendUrl]); 
    
    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && !isLoading) {
            enviarPergunta();
        }
    };

    // Subcomponente MessageContent simplificado para IA (sem ícones complexos)
    const MessageContent: React.FC<{ text: string }> = ({ text }) => {
        return (
            <p className="mr-8 whitespace-pre-wrap">
                {text.split('**').flatMap((segment, index) => (
                    index % 2 === 1 ? <b key={index}>{segment}</b> : segment.split('\n').map((line, lineIndex) => (
                        <React.Fragment key={`${index}-${lineIndex}`}>
                            {line}
                            {lineIndex < segment.split('\n').length - 1 && <br />}
                        </React.Fragment>
                    ))
                ))}
            </p>
        );
    };


    return (
        // Container Principal (Fundo Verde Suave)
        <div className={`w-full h-full ${BG_EMERALD_50} flex flex-col overflow-hidden`}> 
            
            {/* 1. Header do Chat (TOPO - ROXO) */}
            <div className={`bg-${PRIMARY_COLOR} text-white p-4 flex items-center justify-between min-h-[70px] shadow-lg`}>
                <div className="flex items-center">
                    {/* Botão de VOLTAR (Com Ícone) */}
                    <button onClick={onBack} className="text-2xl mr-4 hover:text-gray-300 transition duration-150" aria-label="Voltar">
                        <FaArrowLeft />
                    </button> 
                    <div className={`w-10 h-10 bg-indigo-400 rounded-full mr-3 flex items-center justify-center text-xl`}>
                        <FaRobot className="text-white" /> {/* Ícone de Robô */}
                    </div>
                    <div className="text-left">
                        <span className="font-bold block text-lg">Una</span>
                        <span className={`text-xs ${isLoading ? 'text-indigo-200' : 'text-emerald-300'}`}>
                            {isLoading ? 'digitando...' : 'disponível'}
                        </span>
                    </div>
                </div>
            </div>

            {/* 2. Área de Mensagens (Scrollable) */}
            <div className={`flex-grow p-4 overflow-y-auto ${BG_EMERALD_50}`}> 
                {/* Mensagem de Serviço */}
                <div className={`bg-emerald-200 p-2 rounded-lg text-center text-xs text-gray-700 mb-6 border border-emerald-300`}>
                    <FaInfoCircle className="inline-block mr-2 text-emerald-700" /> Sua conversa com a Una é sigilosa e privada.
                </div>
                
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex mb-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`
                            max-w-[85%] p-3 rounded-xl shadow-md text-sm leading-relaxed relative
                            ${msg.sender === 'user' 
                                // Balão Enviado: Roxo principal
                                ? `${USER_MESSAGE_BG} text-white` 
                                // Balão Recebido: Fundo claro
                                : `${BOT_MESSAGE_BG} border border-gray-200 text-gray-800`
                            }
                        `}>
                            <MessageContent text={msg.text} />
                            <span className={`absolute bottom-1 right-2 text-xs ${msg.sender === 'user' ? 'text-gray-200' : 'text-gray-500'} whitespace-nowrap`}>
                                {msg.time}
                            </span>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* 3. Footer de Envio (Input com Foco Persistente) */}
            <div className="p-4 bg-gray-100 flex items-center border-t border-gray-300">
                <input
                    ref={inputRef} // 💡 Referência atribuída
                    type="text"
                    placeholder={isLoading ? "Aguarde a resposta..." : "Digite sua pergunta..."}
                    value={inputQuestion} 
                    onChange={(e) => setInputQuestion(e.target.value)} 
                    onKeyDown={handleKeyDown} 
                    disabled={isLoading} 
                    className="flex-grow p-3 border-2 border-gray-300 rounded-full mr-3 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none disabled:opacity-75"
                />
                <button onClick={enviarPergunta} disabled={!inputQuestion.trim() || isLoading}
                    // Botão de Envio: Roxo principal
                    className={`w-12 h-12 rounded-full bg-${PRIMARY_COLOR} text-white flex justify-center items-center text-xl transition duration-150 ease-in-out hover:bg-indigo-800 disabled:bg-gray-400`}
                    aria-label="Enviar mensagem"
                >
                    {/* Ícone de envio ou spinner de carregamento */}
                    {isLoading ? <FaSpinner className="animate-spin text-lg" /> : <FaPaperPlane className="transform -rotate-45 -translate-y-[1px] ml-1 text-lg" />}
                </button>
            </div>
        </div>
    );
};

export default ChatIA;