import React, { useEffect } from 'react';

// Define o contrato (interface) para a função que App.tsx passará
interface WelcomeScreenProps {
  // Chamada quando o tempo de boas-vindas termina
  onFinishLoading: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onFinishLoading }) => {

  // Efeito que executa apenas uma vez (ao montar o componente)
  useEffect(() => {
    // 💡 Define o timer de 3 segundos (3000ms)
    const timer = setTimeout(() => {
      // Chama a função passada pelo App.tsx para mudar o estado para 'menu'
      onFinishLoading();
    }, 3000); 

    // Função de limpeza: importante para garantir que o timer seja cancelado
    // se o usuário sair desta tela antes dos 3 segundos (evita erros)
    return () => clearTimeout(timer);
  }, [onFinishLoading]); 
  // O array de dependências garante que a função só execute se onFinishLoading mudar.

  return (
    // 💡 Tailwind: Estilo centralizado, limpo e com a cor principal (Violeta)
    <div className="flex flex-col h-full items-center justify-center p-8 bg-white text-violet-800 animate-fadeIn">
      
      <div className="text-6xl mb-6 animate-pulse">👋</div>
      
      <h1 className="text-3xl sm:text-4xl font-extrabold text-center mb-4">
        Bem-vindo ao Parceiro Uni-FACEF!
      </h1>
      
      <p className="text-xl text-gray-600 text-center mb-8">
        Seu sistema inteligente de Multi-Atendimento.
      </p>

      {/* Indicador de carregamento */}
      <div className="mt-8 text-lg font-semibold flex items-center">
        Aguarde, carregando o menu...
      </div>
      
    </div>
  );
};

export default WelcomeScreen;