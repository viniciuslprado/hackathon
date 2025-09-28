import React, { useState, useRef, useEffect } from 'react';

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

const ChatPDF: React.FC<ChatProps> = ({ onBack, backendUrl }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Mensagem inicial
    useEffect(() => {
        setMessages([{ 
            id: 0, 
            text: `Bem-vindo ao Analisador de Procedimentos Médicos! 

Envie um PDF contendo a solicitação médica e eu analisarei:
• Se o procedimento precisa de auditoria
• Quantos dias úteis para aprovação
• Se é autorizado automaticamente

Digite 'voltar' para retornar ao menu principal.`, 
            sender: 'bot', 
            time: getTime() 
        }]);
    }, []);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    // Lógica de processamento de arquivo
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files ? event.target.files[0] : null;
        if (!file) return;

        if (file.type !== 'application/pdf') {
            alert("Por favor, envie apenas arquivos PDF.");
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

            // Enviar para o backend na porta 3060
            const response = await fetch(`${backendUrl.replace(':3000', ':3060')}/api/upload`, {
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
                    resultMessage = `📋 **Procedimento Identificado:**
${procedureName} (Código: ${procedureCode})

⏰ **Status:** Requer Auditoria
📅 **Tempo estimado:** ${result.estimated_days} dias úteis
📝 **Motivo:** ${result.reason}`;
                } else if (result.authorized) {
                    // Autorizado automaticamente
                    resultMessage = `📋 **Procedimento Identificado:**
${procedureName} (Código: ${procedureCode})

✅ **Status:** Autorizado Automaticamente
📝 **Motivo:** ${result.reason}`;
                } else {
                    // Negado
                    resultMessage = `📋 **Procedimento Identificado:**
${procedureName} (Código: ${procedureCode})

❌ **Status:** Não Autorizado
📝 **Motivo:** ${result.reason}`;
                }
            } else {
                // Procedimento não encontrado
                resultMessage = `❌ **Procedimento Não Identificado**

O procedimento mencionado no documento não foi encontrado em nossa base de dados. Verifique se o documento contém informações claras sobre o procedimento solicitado.`;
            }

            setMessages(prev => [...prev, { 
                id: Date.now() + 1, 
                text: resultMessage, 
                sender: 'bot', 
                time: getTime() 
            }]);

            // Upload concluído - pode fazer nova análise
            
        } catch (error) {
            console.error('Erro ao enviar arquivo:', error);
            
            let errorMessage = '';
            if (error instanceof Error) {
                if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                    errorMessage = `❌ **Erro de Conexão**

Não foi possível conectar ao servidor. Verifique se:
- O servidor backend está rodando na porta 3060
- URL do backend: ${backendUrl.replace(':3000', ':3060')}/api/upload
- Sua conexão com a internet está funcionando

**Para desenvolvedores:** Execute o servidor backend com: \`cd backend/tarefa2 && npm start\``;
                } else if (error.message.includes('Erro HTTP: 500')) {
                    errorMessage = `❌ **Erro no Servidor**

O servidor encontrou um erro interno. Possíveis causas:
- Banco de dados não está conectado
- Erro ao processar o PDF
- Problemas com as dependências do servidor

**Detalhes técnicos:** ${error.message}`;
                } else if (error.message.includes('Erro HTTP: 400')) {
                    errorMessage = `❌ **Arquivo Inválido**

O arquivo enviado não pôde ser processado. Verifique se:
- O arquivo é um PDF válido
- O arquivo não está corrompido
- O arquivo tem menos de 10MB

**Detalhes técnicos:** ${error.message}`;
                } else {
                    errorMessage = `❌ **Erro Desconhecido**

Ocorreu um erro inesperado: ${error.message}

Tente novamente em alguns instantes ou contate o suporte técnico.`;
                }
            } else {
                errorMessage = `❌ **Erro ao processar arquivo**

Ocorreu um erro ao analisar o documento. Verifique se:
- O arquivo é um PDF válido
- O servidor está funcionando
- Há conexão com a internet

Tente novamente em alguns instantes.`;
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
        <div className="w-full h-full bg-white flex flex-col overflow-hidden"> 
            
            {/* Header: Cor de destaque LARANJA/AMARELO */}
            <div className="bg-amber-600 text-white p-4 flex items-center justify-between min-h-[70px] shadow-lg">
                <div className="flex items-center">
                    <button onClick={onBack} className="text-2xl mr-4 hover:text-gray-300 transition duration-150">←</button> 
                    <div className="w-10 h-10 bg-amber-400 rounded-full mr-3 flex items-center justify-center text-xl">🏥</div>
                    <div className="text-left">
                        <span className="font-bold block text-lg">Análise de Procedimentos</span>
                        <span className={`text-xs ${isLoading ? 'text-yellow-300' : 'text-green-300'}`}>{isLoading ? 'analisando...' : 'pronto'}</span>
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
                <label htmlFor="pdf-upload" className="w-full">
                    <div className={`text-center p-3 text-white font-bold rounded-full transition ${isLoading ? 'bg-gray-400' : 'bg-amber-500 hover:bg-amber-600 cursor-pointer'}`}>
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