import React, { useState, useCallback, useRef, useEffect, type KeyboardEvent } from 'react';

// Interfaces simples
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

// SVG Components simples (Para evitar dependências externas)
const SvgArrowLeft = (props: { className?: string }) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
    </svg>
);

const SvgCalendar = (props: { className?: string }) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
    </svg>
);

const SvgSend = (props: { className?: string }) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
    </svg>
);

const ChatAgendamento: React.FC<ChatProps> = ({ onBack, backendUrl }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [hasInitialized, setHasInitialized] = useState<boolean>(false);
    const [sessionId] = useState<string>(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    
    // Referências
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null); // <-- REFERÊNCIA PARA O INPUT

    // Função para enviar mensagem
    const sendMessage = useCallback(async (messageText: string = '', isInit: boolean = false) => {
        const text = isInit ? messageText : inputText.trim();
        
        if (!text && !isInit || isLoading) return;
        
        // Comando voltar fecha o chat
        if (text.toLowerCase() === 'voltar' && !isInit) {
            onBack();
            return;
        }
        
        // Adiciona mensagem do usuário (exceto na inicialização)
        if (!isInit && text) {
            const userMessage: Message = { 
                id: Date.now(), 
                text: text, 
                sender: 'user', 
                time: getTime() 
            };
            setMessages(prev => [...prev, userMessage]);
        }
        
        setInputText('');
        setIsLoading(true);

        try {
            const endpoint = `${backendUrl}/api/agendamento`; 
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: text || "", 
                    sessionId: sessionId 
                })
            });

            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            const botMessage: Message = { 
                id: Date.now() + 1, 
                text: data.reply || 'Erro na resposta do servidor.', 
                sender: 'bot', 
                time: getTime() 
            };
            
            setMessages(prev => [...prev, botMessage]);
            
        } catch (error) {
            console.error('Erro detalhado na comunicação:', error);
            const errorMessage: Message = { 
                id: Date.now() + 1, 
                text: `❌ Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}.`, 
                sender: 'bot', 
                time: getTime() 
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [inputText, isLoading, onBack, backendUrl, sessionId]);

    // Scroll automático
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    // 🚀 HOOK CORRIGIDO: Foca no input após o carregamento terminar, garantindo que o elemento existe.
    useEffect(() => {
        if (!isLoading) {
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 0); // O timeout de 0ms empurra a execução para o final do ciclo de renderização
            
            return () => clearTimeout(timer); // Limpeza
        }
    }, [isLoading]);

    // Inicia a conversa APENAS uma vez
    useEffect(() => {
        if (!hasInitialized) {
            setHasInitialized(true);
            sendMessage('', true);
        }
    }, [hasInitialized, sendMessage]);

    // Enter para enviar
    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && !isLoading) {
            sendMessage();
        }
    };

    return (
        <div className="w-full h-full bg-white flex flex-col overflow-hidden"> 
            
            {/* Header */}
            <div className="bg-emerald-600 text-white p-4 flex items-center justify-between min-h-[70px] shadow-lg">
                <div className="flex items-center">
                    <button onClick={onBack} className="text-2xl mr-4 hover:text-gray-300 transition duration-150">
                        <SvgArrowLeft className="w-6 h-6" />
                    </button> 
                    <div className="w-10 h-10 bg-emerald-400 rounded-full mr-3 flex items-center justify-center text-xl">
                        <SvgCalendar className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                        <span className="font-bold block text-lg">Agendamento Médico</span>
                        <span className={`text-xs ${isLoading ? 'text-yellow-300' : 'text-green-300'}`}>
                            {isLoading ? 'processando...' : 'disponível'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Área de Mensagens */}
            <div className="flex-grow p-4 overflow-y-auto bg-gray-50"> 
                <div className="bg-gray-200 p-2 rounded-lg text-center text-xs text-gray-600 mb-6 border border-gray-300">
                    Sistema de agendamento médico. Digite 'voltar' para sair ou 'recomeçar' para reiniciar.
                </div>
                
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex mb-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-xl shadow-md text-sm leading-relaxed relative ${
                            msg.sender === 'user' 
                                ? 'bg-emerald-600 text-white' 
                                : 'bg-white border border-gray-200 text-gray-800'
                        }`}>
                            <p className="mr-4 whitespace-pre-wrap">{msg.text}</p>
                            <span className={`absolute bottom-1 right-2 text-xs ${
                                msg.sender === 'user' ? 'text-gray-200' : 'text-gray-500'
                            } whitespace-nowrap`}>
                                {msg.time}
                            </span>
                        </div>
                    </div>
                ))}
                
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-gray-100 flex items-center border-t border-gray-300">
                <input
                    ref={inputRef} // <-- ATRIBUIÇÃO DA REF
                    type="text"
                    value={inputText} 
                    onChange={(e) => setInputText(e.target.value)} 
                    onKeyDown={handleKeyDown} 
                    placeholder="Digite sua resposta..."
                    disabled={isLoading} 
                    className="flex-grow p-3 border-2 border-gray-300 rounded-full mr-3 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none disabled:opacity-75"
                />
                <button 
                    onClick={() => sendMessage()} 
                    disabled={!inputText.trim() || isLoading}
                    className="w-12 h-12 rounded-full bg-emerald-600 text-white flex justify-center items-center text-xl transition duration-150 ease-in-out hover:bg-emerald-700 disabled:bg-gray-400"
                >
                    <SvgSend className="w-5 h-5 -translate-x-0.5" /> 
                </button>
            </div>
        </div>
    );
};

export default ChatAgendamento;