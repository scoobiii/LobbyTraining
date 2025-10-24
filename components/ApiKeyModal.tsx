import React, { useState } from 'react';
import { BrainIcon } from './icons/BrainIcon';

interface ApiKeyModalProps {
  onSave: (apiKey: string) => void;
  error?: string | null;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave, error }) => {
  const [key, setKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) {
      onSave(key.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700 p-8 text-center animate-fade-in">
        <div className="inline-flex items-center justify-center gap-3 mb-6">
          <BrainIcon className="w-8 h-8 text-cyan-400" />
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 text-transparent bg-clip-text">
            API Key Necessária
          </h2>
        </div>
        <p className="text-gray-400 mb-6">
          Para utilizar os recursos de IA generativa, por favor, insira sua chave de API do Google AI Studio.
        </p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Cole sua API Key aqui"
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 mb-4"
            aria-label="API Key Input"
          />
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <button
            type="submit"
            disabled={!key.trim()}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none"
          >
            Salvar e Continuar
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-6">
          Você pode obter sua chave no{' '}
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:underline"
          >
            Google AI Studio
          </a>. Sua chave é armazenada apenas no seu navegador.
        </p>
      </div>
       <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};
