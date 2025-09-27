import Chatbot from './components/chatbot';

function App() {
  return (
    // Usa classes Tailwind para garantir que o container ocupa o espaço necessário
    <div className="w-full h-screen flex justify-center items-center">
      <Chatbot />
    </div>
  );
}

export default App;