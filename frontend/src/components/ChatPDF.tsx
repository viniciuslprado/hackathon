import React, { useState, useRef, useEffect } from 'react';
// Ícones da react-icons
import { FaArrowLeft, FaFileMedicalAlt, FaSpinner, FaUpload } from 'react-icons/fa'; 

// Interfaces e Funções de utilidade
interface ChatProps {
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

// Definições de Cores
const PRIMARY_COLOR = 'indigo-700'; // Roxo Escuro
const SECONDARY_COLOR = 'emerald-500'; // Verde Principal

const ChatPDF: React.FC<ChatProps> = ({ onBack, backendUrl }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Mensagem inicial
    useEffect(() => {
        setMessages([{ 
            id: 0, 
            text: `Bem-vindo ao Analisador de Procedimentos Médicos! \n\nEnvie um PDF contendo a solicitação médica e eu analisarei:\n• Se o procedimento precisa de auditoria\n• Quantos dias úteis para aprovação\n• Se é autorizado automaticamente\n\nDigite 'voltar' para retornar ao menu principal.`, 
            sender: 'bot', 
            time: getTime() 
        }]);
    }, []);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]); // Adicionei isLoading ao array de dependências por segurança
    
    // Lógica de processamento de arquivo
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        // CORRIGIDO: Tipagem de 'file' para 'File'
        const file: File | null = event.target.files ? event.target.files[0] : null;
        if (!file) return;

        if (file.type !== 'application/pdf') {
            alert("Por favor, envie apenas arquivos PDF.");
            if (event.target) event.target.value = '';
            return;
        }
        
        setIsLoading(true);
        
        // Adicionar mensagem de upload iniciado
        setMessages(prev => [...prev, { 
            id: Date.now(), 
            text: `📄 Processando arquivo "${file.name}"...`, 
            sender: 'bot', 
            time: getTime() 
        }]);

        try {
            // Criar FormData para enviar o arquivo
            const formData = new FormData();
            formData.append('file', file);

            // Enviar para o backend na porta 3030
            const response = await fetch(`${backendUrl.replace(':3000', ':3030')}/api/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const result = await response.json();
            
            let resultMessage = '';
            
            if (result.found) {
                // Procedimento encontrado
                const procedureName = result.matched.name;
                const procedureCode = result.matched.code;
                
                if (result.audit_required) {
                    // Precisa de auditoria
                    resultMessage = `📋 Procedimento Identificado:
${procedureName} (Código: ${procedureCode})\n\n
⏰ Status: Requer Auditoria\n📅 Tempo estimado: ${result.estimated_days} dias úteis\n📝 Motivo: ${result.reason}`;
                } else if (result.authorized) {
                    // Autorizado automaticamente
                    resultMessage = `📋 Procedimento Identificado:
${procedureName} (Código: ${procedureCode})\n\n
✅ Status: Autorizado Automaticamente\n📝 Motivo: ${result.reason}`;
                } else {
                    // Negado
                    resultMessage = `📋 Procedimento Identificado:
${procedureName} (Código: ${procedureCode})\n\n
❌ Status: Não Autorizado\n📝 Motivo: ${result.reason}`;
                }
            } else {
                // Procedimento não encontrado
                resultMessage = `❌ Procedimento Não Identificado\n\n
O procedimento mencionado no documento não foi encontrado em nossa base de dados. Verifique se o documento contém informações claras sobre o procedimento solicitado.`;
            }

            setMessages(prev => [...prev, { 
                id: Date.now() + 1, 
                text: resultMessage, 
                sender: 'bot', 
                time: getTime() 
            }]);

        } catch (error: unknown) {
            console.error('Erro ao enviar arquivo:', error);
            
            let errorMessage = '';
            if (error instanceof Error) {
                // Lógica de erro mantida...
                errorMessage = `❌Erro de Conexão\n\nNão foi possível conectar ao servidor...`;
            } else {
                errorMessage = `❌ **Erro ao processar arquivo**\n\nOcorreu um erro ao analisar o documento...`;
            }

            setMessages(prev => [...prev, { 
                id: Date.now() + 2, 
                text: errorMessage, 
                sender: 'bot', 
                time: getTime() 
            }]);
        } finally {
            setIsLoading(false);
            // Limpar o input file para permitir reenvio do mesmo arquivo
            if (event.target) {
                event.target.value = '';
            }
        }
    };


    // Renderização com o design de chat web
    return (
        <div className={`w-full h-full bg-white flex flex-col overflow-hidden`}> 
            
            {/* Header: Cor de destaque Roxo Escuro */}
            <div className={`bg-${PRIMARY_COLOR} text-white p-4 flex items-center justify-between min-h-[70px] shadow-lg`}>
                <div className="flex items-center">
                    {/* Botão Voltar (Ícone) */}
                    <button onClick={onBack} className="text-2xl mr-4 hover:text-gray-300 transition duration-150" aria-label="Voltar">
                        <FaArrowLeft />
                    </button> 
                    {/* Ícone do Chat (Roxo) */}
                    <div className={`w-10 h-10 bg-indigo-500 rounded-full mr-3 flex items-center justify-center text-xl`}>
                        <FaFileMedicalAlt className="text-white" /> {/* Ícone Médico/PDF */}
                    </div>
                    <div className="text-left">
                        <span className="font-bold block text-lg">Análise de Procedimentos</span>
                        <span className={`text-xs ${isLoading ? 'text-indigo-200' : 'text-emerald-300'}`}>{isLoading ? 'analisando...' : 'pronto'}</span>
                    </div>
                </div>
            </div>

            {/* Área de Mensagens (Fundo Verde Suave) */}
            <div className={`flex-grow p-4 overflow-y-auto bg-emerald-50`}> 
                {/* Mensagem de Serviço (Fundo Verde) */}
                <div className={`bg-emerald-200 p-2 rounded-lg text-center text-xs text-gray-700 mb-6 border border-emerald-300`}>
                    Sua conversa e documentos são processados com segurança.
                </div>
                
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex mb-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-xl shadow-md text-sm leading-relaxed ${msg.sender === 'user' 
                            // Mensagem do Usuário (Roxo)
                            ? 'bg-indigo-600 text-white' 
                            // Mensagem do Bot (Branco)
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

            {/* Footer de Input/Upload (Fundo Cinza) */}
            <div className="p-4 bg-gray-100 flex items-center border-t border-gray-300">
                <label htmlFor="pdf-upload" className="w-full">
                    <div className={`text-center p-3 text-white font-bold rounded-full transition 
                        ${isLoading ? 'bg-indigo-400' : `bg-${SECONDARY_COLOR} hover:bg-emerald-600 cursor-pointer`}`}>
                        {isLoading ? (
                            <FaSpinner className="animate-spin inline-block mr-2" />
                        ) : (
                            <FaUpload className="inline-block mr-2" />
                        )}
                        {isLoading ? 'Analisando PDF...' : 'Enviar PDF para Análise'}
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
            </div>
        </div>
    );
};

export default ChatPDF;