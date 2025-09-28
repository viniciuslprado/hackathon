import React, { useState, useCallback, useRef, useEffect, type KeyboardEvent } from 'react';
import axios from 'axios';

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

// Tipos de Estado do Chat (Finite State Machine simplificada)
type Steps =
    | 'INITIAL'
    | 'WAITING_SPECIALTY'
    | 'WAITING_BIRTHDATE'
    | 'WAITING_NAME'
    | 'WAITING_SLOT'
    | 'WAITING_REASON'
    | 'CONFIRMATION'
    | 'FINISHED'
    | 'ERROR';

interface BookingData {
    specialtyId?: number;
    specialtyName?: string;
    patientBirth?: string;
    selectedSlot?: AvailableSlot;
    reasonConsultation?: string;
    patientName?: string;
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

// ====================================================================
// COMPONENTES SVG SIMPLES
// ====================================================================

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

// ====================================================================
// COMPONENTES INTERATIVOS DO BOT
// ====================================================================

const SpecialtyOptions: React.FC<{ specialties: Specialty[]; onSelect: (id: number, name: string) => void }> = ({ specialties, onSelect }) => (
    <div className="flex flex-wrap gap-2 mt-2">
        {specialties.map(spec => (
            <button
                key={spec.id}
                onClick={() => onSelect(spec.id, spec.name)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium py-2 px-3 rounded-lg transition duration-150 shadow-md"
            >
                {spec.name}
            </button>
        ))}
    </div>
);

const SlotOptions: React.FC<{ groupedSlots: GroupedSchedules; onSelect: (slot: AvailableSlot) => void }> = ({ groupedSlots, onSelect }) => {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
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
                    <h4 className="font-semibold text-emerald-700 text-sm mb-1">{formatDate(dateKey)}</h4>
                    <div className="flex flex-wrap gap-2">
                        {groupedSlots[dateKey].map(slot => (
                            <button
                                key={slot.id}
                                onClick={() => onSelect(slot)}
                                className="flex flex-col items-center bg-white border border-emerald-400 text-emerald-700 text-xs py-1 px-2 rounded-lg hover:bg-emerald-100 transition duration-150 shadow-sm"
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

// ====================================================================
// COMPONENTE PRINCIPAL: CHAT AGENDAMENTO
// ====================================================================

const ChatAgendamento: React.FC<ChatProps> = ({ onBack, backendUrl }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [hasInitialized, setHasInitialized] = useState<boolean>(false);

    const [currentStep, setCurrentStep] = useState<Steps>('INITIAL');
    const [bookingData, setBookingData] = useState<BookingData>({});

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const addMessage = (text: string | React.ReactNode, sender: 'user' | 'bot') => {
        const newMessage: Message = { id: Date.now() + Math.random(), text, sender, time: getTime() };
        setMessages(prev => [...prev, newMessage]);
    };

    // --- LÓGICA DE COMUNICAÇÃO COM O BACKEND ---

    const fetchSpecialties = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axios.get<Specialty[]>(`${backendUrl}/api/specialties`);
            const specialties = response.data;

            if (specialties.length === 0) {
                addMessage("Desculpe, não encontrei nenhuma especialidade disponível no momento. Tente mais tarde.", 'bot');
                setCurrentStep('ERROR');
                return;
            }

            addMessage(
                <>Olá! Bem-vindo(a) ao sistema de agendamento. Para começar, por favor, <strong>escolha a especialidade</strong> desejada:
                    <SpecialtyOptions
                        specialties={specialties}
                        onSelect={handleSpecialtySelect}
                    />
                </>,
                'bot'
            );
            setCurrentStep('WAITING_SPECIALTY');

        } catch (error) {
            console.error('Erro ao buscar especialidades:', error);
            addMessage("❌ Erro ao conectar com o servidor. Tente novamente mais tarde.", 'bot');
            setCurrentStep('ERROR');
        } finally {
            setIsLoading(false);
        }
    }, [backendUrl]);

    const fetchSchedules = useCallback(async (specialtyId: number) => {
        setIsLoading(true);
        try {
            const response = await axios.get<{ schedules: GroupedSchedules, message: string }>(`${backendUrl}/api/schedules?specialtyId=${specialtyId}`);
            const { schedules, message } = response.data;

            addMessage(
                <>
                    Ótimo! Encontrei as seguintes datas e horários disponíveis para <strong>{bookingData.specialtyName}</strong>:
                    <SlotOptions
                        groupedSlots={schedules}
                        onSelect={handleSlotSelect}
                    />
                    {Object.keys(schedules).length === 0 && <p className="text-sm text-red-600 mt-2">{message}</p>}
                </>,
                'bot'
            );
            setCurrentStep('WAITING_SLOT');

        } catch (error) {
            console.error('Erro ao buscar agendas:', error);
            addMessage("❌ Não foi possível carregar a agenda. Tente recomeçar.", 'bot');
            setCurrentStep('ERROR');
        } finally {
            setIsLoading(false);
        }
    }, [backendUrl, bookingData.specialtyName]);

    const submitBooking = useCallback(async () => {
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

            addMessage(
                <>
                    ✅ <strong>Agendamento Confirmado com Sucesso!</strong>
                    <div className="mt-2 p-3 bg-green-50 border border-green-300 rounded-lg text-sm text-gray-800">
                        <p><strong>Protocolo:</strong> <span className="font-mono text-lg">{confirmation.protocol}</span></p>
                        <p><strong>Paciente:</strong> {confirmation.patientName}</p>
                        <p><strong>Médico(a):</strong> {confirmation.doctorName}</p>
                        <p><strong>Data/Hora:</strong> {new Date(confirmation.dateTime).toLocaleDateString('pt-BR')} às {new Date(confirmation.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <p className="mt-2">Você receberá a confirmação por e-mail/SMS (simulado). Obrigado!</p>
                </>,
                'bot'
            );
            setCurrentStep('FINISHED');

        } catch (error) {
            let errorMsg = "Erro ao finalizar o agendamento. Tente novamente.";
            if (axios.isAxiosError(error) && error.response) {
                if (axios.isAxiosError(error) && error.response?.data) {
                    errorMsg = `❌ Falha no agendamento: ${error.response.data.error || error.response.data.message || errorMsg}`;
                }
            } else if (error instanceof Error) {
                errorMsg = `❌ Erro de conexão: ${error.message}`;
            }

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

        addMessage("Ótimo! Por favor, digite seu <strong>nome completo</strong>:", 'bot');
        setCurrentStep('WAITING_NAME');
    };

    const handleSlotSelect = (slot: AvailableSlot) => {
        const dateStr = new Date(slot.dateTime).toLocaleDateString('pt-BR');
        const timeStr = new Date(slot.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        const doctorName = slot.doctor.name.split(' ')[1] || slot.doctor.name;

        addMessage(`Horário escolhido: ${dateStr} às ${timeStr} com Dr(a). ${doctorName}`, 'user');
        setBookingData(prev => ({ ...prev, selectedSlot: slot }));

        addMessage("Quase lá! Por favor, digite o <strong>motivo da sua consulta</strong> em poucas palavras:", 'bot');
        setCurrentStep('WAITING_REASON');
    };

    // Lógica para processar o INPUT de TEXTO
    const processTextInput = useCallback((text: string) => {
        if (text.length < 3 && currentStep !== 'CONFIRMATION') {
            addMessage("Resposta muito curta. Por favor, digite uma resposta completa.", 'bot');
            return;
        }

        if (currentStep === 'WAITING_NAME') {
            setBookingData(prev => ({ ...prev, patientName: text }));

            addMessage(`Obrigado, ${text.split(' ')[0]}. Agora, por favor, digite sua <strong>data de nascimento</strong> no formato DD/MM/AAAA:`, 'bot');
            setCurrentStep('WAITING_BIRTHDATE');
            return;
        }

        if (currentStep === 'WAITING_BIRTHDATE') {
            const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
            const match = text.match(dateRegex);

            if (match) {
                const isoDate = `${match[3]}-${match[2]}-${match[1]}`;
                setBookingData(prev => ({ ...prev, patientBirth: isoDate }));

                addMessage(`Data de nascimento confirmada. Buscando agendas para ${bookingData.specialtyName}...`, 'bot');
                if (bookingData.specialtyId) {
                    fetchSchedules(bookingData.specialtyId);
                } else {
                    addMessage("Por favor, escolha uma especialidade primeiro.", 'bot');
                }
            } else {
                addMessage("Data inválida. Por favor, use o formato DD/MM/AAAA (Ex: 15/03/1990).", 'bot');
            }
            return;
        }

        if (currentStep === 'WAITING_REASON') {
            setBookingData(prev => ({ ...prev, reasonConsultation: text }));

            setCurrentStep('CONFIRMATION');
            addMessage(
                <>
                    <strong>Revisão Final:</strong>
                    <ul className="list-disc list-inside mt-2 text-gray-700">
                        <li><strong>Paciente:</strong> {bookingData.patientName}</li>
                        <li><strong>Especialidade:</strong> {bookingData.specialtyName}</li>
                        <li><strong>Médico:</strong> {bookingData.selectedSlot?.doctor.name}</li>
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
            if (text.toLowerCase() === 'sim' || text.toLowerCase() === 's') {
                submitBooking();
            } else {
                addMessage("Resposta não reconhecida. Digite <strong>SIM</strong> para confirmar ou 'recomeçar'.", 'bot');
            }
            return;
        }

        addMessage("Por favor, selecione uma opção válida ou digite 'recomeçar' para iniciar o agendamento.", 'bot');
    }, [currentStep, bookingData, fetchSchedules, submitBooking]);

    const sendMessage = useCallback((messageText: string = '', isInit: boolean = false) => {
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
            setHasInitialized(false);
            return;
        }

        if (!isInit && text) {
            addMessage(text, 'user');
        }

        setInputText('');
        processTextInput(text);

    }, [inputText, isLoading, onBack, processTextInput]);

    useEffect(() => {
        if (!hasInitialized) {
            setHasInitialized(true);
            addMessage("Iniciando Agendamento...", 'bot');
            fetchSpecialties();
        }
    }, [hasInitialized, fetchSpecialties]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        if (!isLoading) {
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [messages, isLoading]);

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && !isLoading) {
            sendMessage();
        }
    };

    const isInputDisabled = isLoading ||
        currentStep === 'WAITING_SLOT' ||
        currentStep === 'WAITING_SPECIALTY' ||
        currentStep === 'FINISHED' ||
        currentStep === 'ERROR';

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
                    Sistema de agendamento. Digite <strong>'voltar'</strong> para sair ou <strong>'recomeçar'</strong> para reiniciar.
                </div>

                {messages.map((msg) => (
                    <div key={msg.id} className={`flex mb-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-xl shadow-md text-sm leading-relaxed relative ${msg.sender === 'user'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white border border-gray-200 text-gray-800'
                            }`}>
                            <p className="mr-4 whitespace-pre-wrap">
                                {msg.text}
                            </p>
                            <span className={`absolute bottom-1 right-2 text-xs ${msg.sender === 'user' ? 'text-gray-200' : 'text-gray-500'
                                } whitespace-nowrap`}>
                                {msg.time}
                            </span>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start mb-4">
                        <div className="p-3 rounded-xl shadow-md bg-white border border-gray-200 text-gray-800 text-sm">
                            <div className="flex space-x-1">
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></span>
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-300"></span>
                            </div>
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
                    className="flex-grow p-3 border-2 border-gray-300 rounded-full mr-3 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none disabled:opacity-75"
                />
                <button
                    onClick={() => sendMessage()}
                    disabled={!inputText.trim() || isInputDisabled}
                    className="w-12 h-12 rounded-full bg-emerald-600 text-white flex justify-center items-center text-xl transition duration-150 ease-in-out hover:bg-emerald-700 disabled:bg-gray-400"
                >
                    <SvgSend className="w-5 h-5 -translate-x-0.5" />
                </button>
            </div>
        </div>
    );
};

export default ChatAgendamento;