import React, { useEffect } from 'react';
import { FaStethoscope } from 'react-icons/fa';

interface WelcomeScreenProps {
    onFinishLoading: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onFinishLoading }) => {

    // Efeito para o timer de 2 segundos (2000ms)
    useEffect(() => {
        const timer = setTimeout(() => {
            onFinishLoading();
        }, 2000); 

        return () => clearTimeout(timer);
    }, [onFinishLoading]); 
    

    return (
        // MUDANÇA: Fundo Roxo Sólido (bg-indigo-100)
        <div className="relative flex flex-col items-center justify-center p-8 
                        h-full w-full text-center
                        bg-emerald-100 
                        overflow-hidden">
            
            {/* Ícone: Fundo Roxo Escuro (bg-indigo-700) */}
            <div className={`w-20 h-20 mb-6 flex items-center justify-center 
                            rounded-2xl bg-indigo-700 shadow-xl 
                            transform transition-all duration-700 ease-out 
                            opacity-0 translate-y-4 animate-fade-in-up-100`}> 
                {/* SUBSTITUIÇÃO DO EMOJI PELO COMPONENTE DE ÍCONE */}
                <FaStethoscope className="text-5xl text-white" /> 
            </div>
            
            {/* Título: Roxo Escuro (text-indigo-800) */}
            <h1 className={`text-4xl sm:text-5xl font-extrabold mb-2 
                            text-indigo-800
                            transition-all duration-700 ease-out 
                            opacity-0 translate-y-4 animate-fade-in-up-200`}> 
                Bem-vindo ao Health Unity
            </h1>
            
            {/* Subtítulo: Cinza Escuro para leitura fácil */}
            <p className={`text-xl text-gray-700 mb-8 max-w-lg leading-relaxed 
                           transition-all duration-700 ease-out 
                           opacity-0 translate-y-4 animate-fade-in-up-300`}> 
                Sua central inteligente e segura para saúde, agendamentos e suporte documental.
            </p>


            {/* Rodapé da Marca: Roxo Escuro */}
            <div className="absolute bottom-6 left-0 right-0 text-center text-sm text-gray-500">
                Desenvolvido por <span className={`font-bold text-indigo-800`}>DevUnity</span>
            </div>
        </div>
    );
};

export default WelcomeScreen;