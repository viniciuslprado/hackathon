import React, { useEffect } from 'react';

interface WelcomeScreenProps {
    onFinishLoading: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onFinishLoading }) => {

    // Efeito para o timer de 2 segundos (2000ms)
    useEffect(() => {
        const timer = setTimeout(() => {
            onFinishLoading();
        }, 2000); 

        // Limpeza do timer ao desmontar
        return () => clearTimeout(timer);
    }, [onFinishLoading]); 
    

    return (
        // Garante que a tela ocupe 100% da altura do contêiner pai
        <div className="flex flex-col h-full items-center justify-center p-8 bg-white text-violet-800 transition-opacity duration-1000">
            
            <div className="text-6xl mb-6 animate-pulse">👋</div>
            
            <h1 className="text-3xl sm:text-4xl font-extrabold text-center mb-4 text-gray-900">
                Bem-vindo ao Parceiro Uni-FACEF!
            </h1>
            
            <p className="text-xl text-gray-600 text-center mb-8">
                Seu sistema inteligente de Multi-Atendimento.
            </p>

            {/* Indicador de Carregamento Otimizado */}
            <div className="w-full max-w-[250px] mt-8 flex flex-col items-center">
                <p className="text-sm font-medium text-gray-700 mb-2">
                    Aguarde, carregando o menu...
                </p>
                {/* Barra de Progresso Animada (Spinner) */}
                <div className="w-16 h-16 border-4 border-t-4 border-violet-200 border-t-violet-700 rounded-full animate-spin"></div>
            </div>
            
        </div>
    );
};

export default WelcomeScreen;