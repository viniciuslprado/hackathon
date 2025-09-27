import React, { useState, useEffect } from 'react';

// Componente de teste simples para diagnosticar problemas
const TestChat: React.FC<{ onBack: () => void; backendUrl: string }> = ({ onBack, backendUrl }) => {
    const [status, setStatus] = useState<string>('Testando...');
    const [response, setResponse] = useState<any>(null);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const testConnection = async () => {
            try {
                setStatus('Conectando ao backend...');
                
                const sessionId = `test_${Date.now()}`;
                
                const res = await fetch(`${backendUrl}/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        message: "", 
                        sessionId: sessionId 
                    })
                });

                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                }

                const data = await res.json();
                setResponse(data);
                setStatus('✅ Conexão funcionando!');
                
            } catch (err: any) {
                setError(err.message);
                setStatus('❌ Erro na conexão');
            }
        };

        testConnection();
    }, [backendUrl]);

    return (
        <div className="p-8 bg-white min-h-screen">
            <button 
                onClick={onBack}
                className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                ← Voltar
            </button>
            
            <h1 className="text-2xl font-bold mb-4">Teste de Conexão - Agendamento</h1>
            
            <div className="space-y-4">
                <div className="p-4 border rounded">
                    <h3 className="font-semibold">Backend URL:</h3>
                    <p className="text-gray-600">{backendUrl}</p>
                </div>
                
                <div className="p-4 border rounded">
                    <h3 className="font-semibold">Status:</h3>
                    <p className={status.includes('❌') ? 'text-red-600' : 'text-green-600'}>
                        {status}
                    </p>
                </div>
                
                {error && (
                    <div className="p-4 border border-red-300 rounded bg-red-50">
                        <h3 className="font-semibold text-red-800">Erro:</h3>
                        <p className="text-red-700">{error}</p>
                    </div>
                )}
                
                {response && (
                    <div className="p-4 border border-green-300 rounded bg-green-50">
                        <h3 className="font-semibold text-green-800">Resposta do Backend:</h3>
                        <pre className="text-green-700 text-sm mt-2">
                            {JSON.stringify(response, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TestChat;