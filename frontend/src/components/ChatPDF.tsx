import React, { useState, useCallback, useRef, useEffect, type KeyboardEvent } from 'react';

// Interfaces e Funções de utilidade
interface ChatProps {
  onBack: () => void;
  backendUrl: string; // http://localhost:3003
}
interface Message {
    id: number;
    text: string;
    sender: 'user' | 'bot'; 
    time: string; 
}
const getTime = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

const ChatPDF: React.FC<ChatProps> = ({ onBack, backendUrl }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputQuestion, setInputQuestion] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    // 💡 Estado de controle para alternar o input entre upload e texto
    const [pdfUploaded, setPdfUploaded] = useState<boolean>(false); 
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Mensagem inicial
    useEffect(() => {
        setMessages([{ 
            id: 0, 
            text: `Bem-vindo ao Leitor de Documentos (2º). Para começar, envie seu arquivo PDF através do botão abaixo. Digite 'voltar' para o menu.`, 
            sender: 'bot', 
            time: getTime() 
        }]);
    }, []);
    
    // Efeito para rolar automaticamente
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = useCallback(async () => {
        const questionText = inputQuestion.trim();
        if (!questionText || isLoading) return;
        if (questionText.toLowerCase() === 'voltar') {
            onBack();
            return;
        }

        // Lógica de comunicação com o backend (Porta 3003)
        // O backend usará esta mensagem para consultar o PDF que foi carregado
        
        // 1. Mensagem do usuário
        const userMessage: Message = { id: Date.now(), text: questionText, sender: 'user', time: getTime() };
        setMessages((prevMessages) => [...prevMessages, userMessage]);
        setInputQuestion('');
        setIsLoading(true);
        
        // Simulação da resposta (substituir por requisição real no backend 3003)
        setTimeout(() => {
            const botMessage: Message = { id: Date.now() + 1, text: `Sua pergunta sobre "${questionText}" foi recebida. Preciso do backend (${backendUrl}) para processar a consulta no PDF.`, sender: 'bot', time: getTime() };
            setMessages((prevMessages) => [...prevMessages, botMessage]);
            setIsLoading(false);
        }, 1500);


    }, [inputQuestion, isLoading, onBack, backendUrl]);

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && !isLoading && pdfUploaded) {
            handleSendMessage();
        }
    };
    
    // 💡 Lógica de processamento de arquivo
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files ? event.target.files[0] : null;
        if (file) {
            if (file.type !== 'application/pdf') {
                alert("Por favor, envie apenas arquivos PDF.");
                return;
            }
            
            // Simulação de envio
            setIsLoading(true);
            
            // Aqui você enviaria o arquivo (FormData) para uma rota específica do backend (ex: /upload)
            // Após o sucesso do backend:
            setTimeout(() => {
                setMessages(prev => [...prev, { id: Date.now(), text: `✅ PDF "${file.name}" carregado e pronto para consultas. Agora, faça sua pergunta!`, sender: 'bot', time: getTime() }]);
                setPdfUploaded(true); // Altera o estado para mostrar o input de texto
                setIsLoading(false);
            }, 2500); 
        }
    };


    // Renderização com o design de chat web
    return (
        <div className="w-full h-full bg-white flex flex-col overflow-hidden"> 
            
            {/* Header: Cor de destaque LARANJA/AMARELO */}
            <div className="bg-amber-600 text-white p-4 flex items-center justify-between min-h-[70px] shadow-lg">
                <div className="flex items-center">
                    <button onClick={onBack} className="text-2xl mr-4 hover:text-gray-300 transition duration-150">←</button> 
                    <div className="w-10 h-10 bg-amber-400 rounded-full mr-3 flex items-center justify-center text-xl">📄</div>
                    <div className="text-left">
                        <span className="font-bold block text-lg">Leitor de PDF (2º Chat)</span>
                        <span className={`text-xs ${isLoading ? 'text-yellow-300' : 'text-green-300'}`}>{isLoading ? 'processando...' : 'online'}</span>
                    </div>
                </div>
            </div>

            {/* Área de Mensagens (Visual de chat web) */}
            <div className="flex-grow p-4 overflow-y-auto bg-gray-50"> 
                <div className="bg-gray-200 p-2 rounded-lg text-center text-xs text-gray-600 mb-6 border border-gray-300">
                    Sua conversa e documentos são processados com segurança.
                </div>
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex mb-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-xl shadow-md text-sm leading-relaxed ${msg.sender === 'user' 
                            ? 'bg-amber-600 text-white' // Cor LARANJA para mensagens enviadas
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

            {/* Footer de Input/Upload */}
            <div className="p-4 bg-gray-100 flex items-center border-t border-gray-300">
                {/* 💡 Lógica de alternância: Se não fez upload, mostra o botão de upload */}
                {!pdfUploaded ? (
                    <label htmlFor="pdf-upload" className="w-full">
                        <div className={`text-center p-3 text-white font-bold rounded-full transition ${isLoading ? 'bg-gray-400' : 'bg-amber-500 hover:bg-amber-600 cursor-pointer'}`}>
                            {isLoading ? 'Enviando PDF...' : 'Clique para UPLOAD de PDF'}
                        </div>
                        <input
                            id="pdf-upload"
                            type="file"
                            accept="application/pdf"
                            onChange={handleFileUpload}
                            className="hidden"
                            disabled={isLoading}
                        />
                    </label>
                ) : (
                    // 💡 Se o PDF foi enviado, mostra o input de texto normal
                    <>
                        <input
                            type="text"
                            value={inputQuestion} 
                            onChange={(e) => setInputQuestion(e.target.value)} 
                            onKeyDown={handleKeyDown} 
                            placeholder="Faça perguntas sobre o PDF..."
                            disabled={isLoading} 
                            className="flex-grow p-3 border-2 border-gray-300 rounded-full mr-3 bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none disabled:opacity-75"
                        />
                        <button onClick={handleSendMessage} disabled={!inputQuestion.trim() || isLoading}
                            className="w-12 h-12 rounded-full bg-amber-600 text-white flex justify-center items-center text-xl transition duration-150 ease-in-out hover:bg-amber-700 disabled:bg-gray-400"
                        >
                            <span className="transform -rotate-45 -translate-y-[1px] ml-1">➤</span> 
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default ChatPDF;