import React, { useState, useCallback, useRef, useEffect, type KeyboardEvent } from 'react';
import axios from 'axios';
// Importação de Ícones
import { FaArrowLeft, FaCalendarAlt, FaPaperPlane, FaInfoCircle, FaSpinner, FaCheckCircle, FaHourglassHalf } from 'react-icons/fa';


// ====================================================================
// TIPOS E INTERFACES
// ====================================================================

// Tipos da API (Baseados no seu backend)
interface Specialty { id: number; name: string; }
interface DoctorData { id: number; name: string; crm: string; }
interface AvailableSlot { id: number; dateTime: string; doctor: DoctorData; }
interface GroupedSchedules { [date: string]: AvailableSlot[]; }
interface BookingConfirmation {
    message: string;
    protocol: string;
    doctorName: string;
    dateTime: string;
    patientName: string;
}
type Steps = 'INITIAL' | 'WAITING_SPECIALTY' | 'WAITING_CITY' | 'WAITING_BIRTHDATE' | 'WAITING_NAME' | 'WAITING_DOCTOR_PREF' | 'WAITING_DOCTOR_SELECTION' | 'WAITING_SLOT' | 'WAITING_REASON' | 'CONFIRMATION' | 'FINISHED' | 'ERROR';
interface BookingData {
    specialtyId?: number;
    specialtyName?: string;
    city?: string;
    patientBirth?: string;
    selectedSlot?: AvailableSlot;
    reasonConsultation?: string;
    patientName?: string;
    doctorPref?: string;
    // ID do médico, caso tenha sido filtrado
    doctorId?: number; 
}
interface Message {
    id: number;
    text: string | React.ReactNode;
    sender: 'user' | 'bot';
    time: string;
}
interface ChatProps {
    onBack: () => void;
    backendUrl: string;
}

const getTime = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

// Definições de Cores
const PRIMARY_COLOR = 'indigo-700'; // Roxo Escuro
const USER_MESSAGE_BG = 'bg-indigo-600'; // Roxo para mensagens do usuário
const BOT_MESSAGE_BG = 'bg-white';
const BG_EMERALD_50 = 'bg-emerald-50'; // Fundo suave da área de mensagens


// ====================================================================
// COMPONENTES INTERATIVOS DO BOT
// ====================================================================

const SpecialtyOptions: React.FC<{ specialties: Specialty[]; onSelect: (id: number, name: string) => void }> = ({ specialties, onSelect }) => (
    <div className="flex flex-wrap gap-2 mt-2">
        {specialties.map(spec => (
            <button
                key={spec.id}
                onClick={() => onSelect(spec.id, spec.name)}
                className={`bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition duration-150 shadow-md`}
            >
                {spec.name}
            </button>
        ))}
    </div>
);

const DoctorOptions: React.FC<{ doctors: DoctorData[]; onSelect: (doctor: DoctorData) => void }> = ({ doctors, onSelect }) => (
    <div className="flex flex-wrap gap-2 mt-2">
        {doctors.map(doctor => (
            <button
                key={doctor.id}
                onClick={() => onSelect(doctor)}
                className={`bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition duration-150 shadow-md`}
            >
                Dr(a). {doctor.name}
                <span className="block text-xs opacity-75">CRM: {doctor.crm}</span>
            </button>
        ))}
    </div>
);

const SlotOptions: React.FC<{ groupedSlots: GroupedSchedules; onSelect: (slot: AvailableSlot) => void }> = ({ groupedSlots, onSelect }) => {
    // ✅ CORREÇÃO FUSO HORÁRIO: Usa getUTCDate para evitar que a data retroceda
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.getUTCDate().toString().padStart(2, '0') + '/' + (date.getUTCMonth() + 1).toString().padStart(2, '0');
    };

    const formatTime = (dateTimeString: string) => {
        const date = new Date(dateTimeString);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const days = Object.keys(groupedSlots);

    if (days.length === 0) {
        return <p className="text-sm text-red-600 mt-2">Nenhum horário disponível nos próximos 30 dias.</p>;
    }

    return (
        <div className="mt-2 space-y-3">
            {days.map(dateKey => (
                <div key={dateKey} className="border-b pb-2">
                    <h4 className="font-semibold text-indigo-700 text-sm mb-1">{formatDate(dateKey)}</h4>
                    <div className="flex flex-wrap gap-2">
                        {groupedSlots[dateKey].map(slot => (
                            <button
                                key={slot.id}
                                onClick={() => onSelect(slot)}
                                className="flex flex-col items-center bg-white border border-indigo-400 text-indigo-700 text-xs py-1 px-2 rounded-lg hover:bg-indigo-50 transition duration-150 shadow-sm"
                            >
                                <span className="font-bold">{formatTime(slot.dateTime)}</span>
                                <span className="text-[10px] text-gray-500">Dr(a). {slot.doctor.name.split(' ')[1] || slot.doctor.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- Subcomponente para renderizar conteúdo do chat (simples) ---
const MessageContent: React.FC<{ text: string | React.ReactNode }> = ({ text }) => {
    if (typeof text !== 'string') {
        return <>{text}</>; // Renderiza o componente JSX diretamente
    }

    // Lógica para tratar negrito (**) e quebras de linha
    return (
        <p className="mr-4 whitespace-pre-wrap">
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


// ====================================================================
// COMPONENTE PRINCIPAL: CHAT AGENDAMENTO
// ====================================================================

const ChatAgendamento: React.FC<ChatProps> = ({ onBack, backendUrl }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    
    const isMounted = useRef(false);

    const [currentStep, setCurrentStep] = useState<Steps>('INITIAL');
    const [bookingData, setBookingData] = useState<BookingData>({});
    
    // NOVO ESTADO: Lista de médicos para a especialidade atual
    const [doctorOptions, setDoctorOptions] = useState<DoctorData[]>([]); 

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const addMessage = (text: string | React.ReactNode, sender: 'user' | 'bot') => {
        const newMessage: Message = { id: Date.now() + Math.random(), text, sender, time: getTime() };
        setMessages(prev => [...prev, newMessage]);
    };

    // --- LÓGICA DE COMUNICAÇÃO COM O BACKEND ---

    // Função para buscar médicos por especialidade (NOVA FUNÇÃO)
    const fetchDoctors = useCallback(async (specialtyId: number) => {
        try {
            const response = await axios.get(`${backendUrl}/api/doctors?specialtyId=${specialtyId}`);
            const doctors = response.data;
            setDoctorOptions(doctors);
            
            if (doctors.length === 0) {
                addMessage('Não encontramos médicos disponíveis para esta especialidade. Redirecionando para o menu principal...', 'bot');
                // Volta ao menu após 3 segundos
                setTimeout(() => {
                    onBack();
                }, 3000);
                return;
            }
            
            // Sempre mostra a lista de médicos, mesmo que seja apenas um
            const messageText = doctors.length === 1 
                ? `Encontramos 1 médico disponível para esta especialidade. Por favor, confirme sua escolha:`
                : `Encontramos **${doctors.length} médicos** disponíveis para esta especialidade. Escolha sua preferência:`;
                
            addMessage(
                <div>
                    <p className="mb-2">{messageText}</p>
                    <DoctorOptions doctors={doctors} onSelect={(doctor) => handleDoctorSelect(doctor, specialtyId)} />
                </div>,
                'bot'
            );
            setCurrentStep('WAITING_DOCTOR_SELECTION');
            
        } catch (error) {
            console.error('Erro ao buscar médicos:', error);
            addMessage('Erro ao buscar médicos. Redirecionando para o menu principal...', 'bot');
            setTimeout(() => {
                onBack();
            }, 3000);
        }
    }, [backendUrl]);


    const fetchSpecialties = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axios.get<Specialty[]>(`${backendUrl}/api/specialties`);
            const specialties = response.data;

            if (specialties.length === 0) {
                addMessage("Desculpe, não encontrei nenhuma especialidade disponível no momento. Redirecionando para o menu principal...", 'bot');
                setTimeout(() => {
                    onBack();
                }, 3000);
                return;
            }

            // MENSAGEM INICIAL
            addMessage(
                <>Olá! Bem-vindo(a) ao sistema de agendamento. Para começar, por favor, <strong>escolha a especialidade</strong> desejada:
                    <SpecialtyOptions specialties={specialties} onSelect={handleSpecialtySelect} />
                </>,
                'bot'
            );
            setCurrentStep('WAITING_SPECIALTY');

        } catch (error) {
            console.error('Erro ao buscar especialidades:', error);
            addMessage("❌ Erro ao conectar com o servidor. Redirecionando para o menu principal...", 'bot');
            setTimeout(() => {
                onBack();
            }, 3000);
        } finally {
            setIsLoading(false);
        }
    }, [backendUrl]);

    const fetchSchedules = useCallback(async (specialtyId: number, doctorId?: number) => {
        setIsLoading(true);
        
        console.log('📅 fetchSchedules chamado com:', { specialtyId, doctorId });
        
        // ⚠️ NO MUNDO REAL: Ajuste a URL para incluir doctorId, se fornecido.
        const url = doctorId 
            ? `${backendUrl}/api/schedules?specialtyId=${specialtyId}&doctorId=${doctorId}`
            : `${backendUrl}/api/schedules?specialtyId=${specialtyId}`;
        
        console.log('🌐 URL da requisição:', url);
        
        try {
            const response = await axios.get<{ schedules: GroupedSchedules, message: string }>(url);
            const { schedules, message } = response.data;
            
            console.log('✅ Horários recebidos:', schedules);

            addMessage(
                <>
                    Ótimo! Encontrei as seguintes datas e horários disponíveis para <strong>{bookingData.specialtyName}</strong> 
                    {bookingData.city && ` em **${bookingData.city}** `}
                    {bookingData.doctorPref && bookingData.doctorPref !== 'Sem preferência' && ` com Dr(a). **${bookingData.doctorPref}**`}:

                    <SlotOptions groupedSlots={schedules} onSelect={handleSlotSelect} />
                    {Object.keys(schedules).length === 0 && (
                        <div>
                            <p className="text-sm text-red-600 mt-2">{message}</p>
                            <p className="text-sm text-gray-600 mt-2">Redirecionando para o menu principal...</p>
                        </div>
                    )}
                </>,
                'bot'
            );
            
            // Se não há horários disponíveis, volta ao menu após 3 segundos
            if (Object.keys(schedules).length === 0) {
                setTimeout(() => {
                    onBack(); // Volta ao menu principal
                }, 3000);
                return;
            }
            
            setCurrentStep('WAITING_SLOT');

        } catch (error) {
            console.error('❌ Erro ao buscar agendas:', error);
            addMessage("❌ Não foi possível carregar a agenda. Redirecionando para o menu principal...", 'bot');
            setTimeout(() => {
                onBack();
            }, 3000);
        } finally {
            setIsLoading(false);
        }
    }, [backendUrl, bookingData.specialtyName, bookingData.city, bookingData.doctorPref]);

    const submitBooking = useCallback(async () => {
        // ... (lógica de submit mantida)
        setIsLoading(true);
        addMessage("Processando seu agendamento, por favor, aguarde...", 'bot');

        if (!bookingData.selectedSlot || !bookingData.patientBirth || !bookingData.reasonConsultation || !bookingData.patientName) {
            addMessage("⚠️ Dados incompletos. Tente recomeçar.", 'bot');
            setCurrentStep('ERROR');
            setIsLoading(false);
            return;
        }

        try {
            const payload = {
                availableHourId: bookingData.selectedSlot.id,
                patientName: bookingData.patientName,
                patientBirth: bookingData.patientBirth,
                reasonConsultation: bookingData.reasonConsultation,
            };

            const response = await axios.post<BookingConfirmation>(`${backendUrl}/api/book`, payload);
            const confirmation = response.data;

            // ✅ CORREÇÃO FUSO HORÁRIO: Usando getUTC... para a data de confirmação
            const confirmationDate = new Date(confirmation.dateTime);

            addMessage(
                <>
                    <FaCheckCircle className="inline-block mr-2 text-emerald-600" /> <strong>Agendamento Confirmado com Sucesso!</strong>
                    <div className="mt-2 p-3 bg-indigo-50 border border-indigo-300 rounded-lg text-sm text-gray-800">
                        <p><strong>Protocolo:</strong> <span className="font-mono text-lg text-indigo-700">{confirmation.protocol}</span></p>
                        <p><strong>Paciente:</strong> {confirmation.patientName}</p>
                        <p><strong>Médico(a):</strong> {confirmation.doctorName}</p>
                        <p><strong>Data/Hora:</strong> 
                            {confirmationDate.getUTCDate().toString().padStart(2, '0')}/
                            {(confirmationDate.getUTCMonth() + 1).toString().padStart(2, '0')}/
                            {confirmationDate.getUTCFullYear()} 
                            às {confirmationDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                    <p className="mt-2">Você receberá a confirmação por e-mail/SMS (simulado). Obrigado!</p>
                </>,
                'bot'
            );
            setCurrentStep('FINISHED');

        } catch (error) {
            let errorMsg = "Erro ao finalizar o agendamento. Tente novamente.";
            // ... (tratamento de erro omitido por brevidade)

            addMessage(errorMsg, 'bot');
            setCurrentStep('ERROR');

        } finally {
            setIsLoading(false);
        }
    }, [backendUrl, bookingData]);

    // --- HANDLERS DE RESPOSTA DO USUÁRIO ---

    const handleSpecialtySelect = (id: number, name: string) => {
        addMessage(`Especialidade: ${name}`, 'user');
        setBookingData(prev => ({ ...prev, specialtyId: id, specialtyName: name }));

        // ⬇️ NOVO PASSO: Pergunta a cidade
        addMessage("Qual a **cidade** onde você gostaria de ser atendido?", 'bot');
        setCurrentStep('WAITING_CITY');
    };

    const handleDoctorSelect = async (doctor: DoctorData, specialtyId: number) => {
        addMessage(`Médico escolhido: Dr(a). ${doctor.name} (CRM: ${doctor.crm})`, 'user');
        setBookingData(prev => ({ ...prev, doctorId: doctor.id }));
        
        console.log('🔍 handleDoctorSelect - doctor:', doctor);
        console.log('🔍 handleDoctorSelect - specialtyId recebido:', specialtyId);
        
        console.log('📅 Buscando horários para specialtyId:', specialtyId, 'doctorId:', doctor.id);
        await fetchSchedules(specialtyId, doctor.id);
    };

    const handleSlotSelect = (slot: AvailableSlot) => {
        const dateStr = new Date(slot.dateTime).toLocaleDateString('pt-BR');
        const timeStr = new Date(slot.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        const doctorName = slot.doctor.name.split(' ')[1] || slot.doctor.name;

        addMessage(`Horário escolhido: ${dateStr} às ${timeStr} com Dr(a). ${doctorName}`, 'user');
        setBookingData(prev => ({ ...prev, selectedSlot: slot }));

        addMessage("Quase lá! Por favor, digite o **motivo da sua consulta** em poucas palavras:", 'bot');
        setCurrentStep('WAITING_REASON');
    };

    // Lógica para processar o INPUT de TEXTO
    const processTextInput = useCallback(async (text: string) => {
        if (text.length < 3 && currentStep !== 'CONFIRMATION') {
            addMessage("Resposta muito curta. Por favor, digite uma resposta completa.", 'bot');
            return;
        }

        // ⬇️ NOVO PASSO: WAITING_CITY
        if (currentStep === 'WAITING_CITY') {
            addMessage(text, 'user');
            setBookingData(prev => ({ ...prev, city: text }));

            // Vai para o nome
            addMessage(`Obrigado. Por favor, digite seu **nome completo**:`, 'bot');
            setCurrentStep('WAITING_NAME');
            return;
        }

        if (currentStep === 'WAITING_NAME') {
            addMessage(text, 'user');
            setBookingData(prev => ({ ...prev, patientName: text }));

            addMessage(`Ótimo! Agora, por favor, digite sua **data de nascimento** no formato DD/MM/AAAA:`, 'bot');
            setCurrentStep('WAITING_BIRTHDATE');
            return;
        }

        if (currentStep === 'WAITING_BIRTHDATE') {
            addMessage(text, 'user');
            const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
            const match = text.match(dateRegex);

            if (match) {
                const isoDate = `${match[3]}-${match[2]}-${match[1]}`;
                setBookingData(prev => ({ ...prev, patientBirth: isoDate }));

                // ⬇️ NOVO PASSO: Pergunta a preferência médica e busca a lista de médicos
                
                // MENSAGEM DE TRANSIÇÃO
                addMessage(`Data de nascimento confirmada.`, 'bot');
                
                addMessage(`Você tem **preferência por algum médico específico** para ${bookingData.specialtyName}? Digite **'sim'** se tiver ou **'não'** para qualquer médico disponível.`, 'bot');
                setCurrentStep('WAITING_DOCTOR_PREF');
                
            } else {
                addMessage("Data inválida. Por favor, use o formato DD/MM/AAAA (Ex: 15/03/1990).", 'bot');
            }
            return;
        }

        // ⬇️ NOVO PASSO: WAITING_DOCTOR_PREF
        if (currentStep === 'WAITING_DOCTOR_PREF') {
            const normalizedInput = text.toLowerCase().trim();
            addMessage(text, 'user');
            
            if (normalizedInput.includes('sim') || normalizedInput.includes('tenho') || normalizedInput.includes('prefiro')) {
                // Usuário tem preferência - busca lista de médicos
                setBookingData(prev => ({ ...prev, doctorPref: 'sim' }));
                addMessage('Perfeito! Vou buscar os médicos disponíveis para esta especialidade...', 'bot');
                
                if (bookingData.specialtyId) {
                    await fetchDoctors(bookingData.specialtyId);
                } else {
                    addMessage('Erro: Especialidade não encontrada. Reinicie o processo.', 'bot');
                    setCurrentStep('ERROR');
                }
            } else {
                // Usuário não tem preferência - vai direto para horários
                setBookingData(prev => ({ ...prev, doctorPref: 'não' }));
                addMessage('Entendido! Vou mostrar todos os horários disponíveis.', 'bot');
                
                if (bookingData.specialtyId) {
                    await fetchSchedules(bookingData.specialtyId);
                } else {
                    addMessage('Erro: Especialidade não encontrada. Reinicie o processo.', 'bot');
                    setCurrentStep('ERROR');
                }
            }
            return;
        }


        if (currentStep === 'WAITING_REASON') {
            addMessage(text, 'user');
            setBookingData(prev => ({ ...prev, reasonConsultation: text }));

            setCurrentStep('CONFIRMATION');
            addMessage(
                <>
                    <FaHourglassHalf className="inline-block mr-2 text-indigo-700" /> <strong>Revisão Final:</strong>
                    <ul className="list-disc list-inside mt-2 text-gray-700">
                        <li><strong>Paciente:</strong> {bookingData.patientName}</li>
                        <li><strong>Especialidade:</strong> {bookingData.specialtyName}</li>
                        <li><strong>Cidade:</strong> {bookingData.city}</li> 
                        <li><strong>Médico Agendado:</strong> {bookingData.selectedSlot?.doctor.name}</li>
                        <li><strong>Data/Hora:</strong> {bookingData.selectedSlot ? `${new Date(bookingData.selectedSlot.dateTime).toLocaleDateString('pt-BR')} às ${new Date(bookingData.selectedSlot.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : ''}</li>
                        <li><strong>Motivo:</strong> {text}</li>
                    </ul>
                    <p className="mt-2 font-semibold">Tudo correto? Digite <strong>SIM</strong> para confirmar e finalizar o agendamento.</p>
                </>,
                'bot'
            );
            return;
        }

        if (currentStep === 'CONFIRMATION') {
            addMessage(text, 'user');
            const lowerText = text.toLowerCase().trim();
            
            if (lowerText === 'sim' || lowerText === 's') {
                submitBooking();
            } else if (lowerText === 'não' || lowerText === 'nao' || lowerText === 'n' || lowerText === 'recomeçar') {
                // FLUXO DE CANCELAMENTO: Volta para a seleção de especialidade
                addMessage("Agendamento cancelado. Por favor, escolha uma especialidade para recomeçar.", 'bot');
                setMessages([]);
                setBookingData({});
                setCurrentStep('INITIAL');
                fetchSpecialties(); // Volta ao início
            } else {
                addMessage("Resposta não reconhecida. Digite **SIM** para confirmar ou **NÃO** para cancelar.", 'bot');
            }
            return;
        }

        addMessage("Por favor, selecione uma opção válida ou digite 'recomeçar' para iniciar o agendamento.", 'bot');
    }, [currentStep, bookingData, fetchSchedules, submitBooking, fetchSpecialties, doctorOptions]); // Adicionado doctorOptions

    const sendMessage = useCallback(async (messageText: string = '', isInit: boolean = false) => {
        const text = isInit ? messageText : inputText.trim();

        if ((!text && !isInit) || isLoading) return;

        if (text.toLowerCase() === 'voltar') {
            onBack();
            return;
        }
        if (text.toLowerCase() === 'recomeçar') {
            setMessages([]);
            setCurrentStep('INITIAL');
            setBookingData({});
            return;
        }

        setInputText('');
        await processTextInput(text);

    }, [inputText, isLoading, onBack, processTextInput]);


    // --- USE EFFECTS FINAIS ---

    // Efeito de inicialização CORRIGIDO
    useEffect(() => {
        if (!isMounted.current) {
            isMounted.current = true;
            fetchSpecialties();
        }
    }, [fetchSpecialties]);


    // Efeito para manter o foco e scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        if (!isLoading) {
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [messages, isLoading]);


    // Tecla Enter para enviar
    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && !isLoading) {
            sendMessage();
        }
    };


    // --- RENDERIZAÇÃO ---
    const isInputDisabled = isLoading ||
        currentStep === 'WAITING_SLOT' ||
        currentStep === 'WAITING_SPECIALTY' ||
        currentStep === 'WAITING_DOCTOR_SELECTION' ||
        currentStep === 'FINISHED' ||
        currentStep === 'ERROR';


    return (
        <div className={`w-full h-full ${BG_EMERALD_50} flex flex-col overflow-hidden`}>

            {/* Header: Roxo Escuro */}
            <div className={`bg-${PRIMARY_COLOR} text-white p-4 flex items-center justify-between min-h-[70px] shadow-lg`}>
                <div className="flex items-center">
                    <button onClick={onBack} className="text-2xl mr-4 hover:text-gray-300 transition duration-150" aria-label="Voltar">
                        <FaArrowLeft className="w-6 h-6" />
                    </button>
                    <div className={`w-10 h-10 bg-indigo-500 rounded-full mr-3 flex items-center justify-center text-xl`}>
                        <FaCalendarAlt className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                        <span className="font-bold block text-lg">Agendamento Médico</span>
                        <span className={`text-xs ${isLoading ? 'text-indigo-200' : 'text-emerald-300'}`}>
                            {isLoading ? 'processando...' : 'disponível'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Área de Mensagens */}
            <div className={`flex-grow p-4 overflow-y-auto ${BG_EMERALD_50}`}>
                <div className={`bg-emerald-200 p-2 rounded-lg text-center text-xs text-gray-700 mb-6 border border-emerald-300`}>
                    <FaInfoCircle className="inline-block mr-2 text-emerald-700" /> Sistema de agendamento. Digite <strong>'voltar'</strong> para sair ou <strong>'recomeçar'</strong> para reiniciar.
                </div>

                {messages.map((msg) => (
                    <div key={msg.id} className={`flex mb-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-xl shadow-md text-sm leading-relaxed relative ${msg.sender === 'user'
                                ? `${USER_MESSAGE_BG} text-white`
                                : `${BOT_MESSAGE_BG} border border-gray-200 text-gray-800'}`
                            }`}>
                            
                            <MessageContent text={msg.text} />
                            
                            <span className={`absolute bottom-1 right-2 text-xs ${msg.sender === 'user' ? 'text-gray-200' : 'text-gray-500'} whitespace-nowrap`}>
                                {msg.time}
                            </span>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start mb-4">
                        <div className="p-3 rounded-xl shadow-md bg-white border border-gray-200 text-gray-800 text-sm">
                            <FaSpinner className="animate-spin text-indigo-500" />
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-gray-100 flex items-center border-t border-gray-300">
                <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isInputDisabled ? "Aguarde ou escolha uma opção..." : "Digite sua resposta..."}
                    disabled={isInputDisabled}
                    className="flex-grow p-3 border-2 border-gray-300 rounded-full mr-3 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none disabled:opacity-75"
                />
                <button
                    onClick={() => sendMessage()}
                    disabled={!inputText.trim() || isInputDisabled}
                    className={`w-12 h-12 rounded-full bg-${PRIMARY_COLOR} text-white flex justify-center items-center text-xl transition duration-150 ease-in-out hover:bg-indigo-800 disabled:bg-gray-400`}
                    aria-label="Enviar"
                >
                    {isLoading ? <FaSpinner className="w-5 h-5 animate-spin" /> : <FaPaperPlane className="w-5 h-5 transform -rotate-45 -translate-x-0.5" />}
                </button>
            </div>
        </div>
    );
};

export default ChatAgendamento;