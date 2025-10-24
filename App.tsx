import React, { useState, useCallback, useEffect, useRef } from 'react';
import { TopicCard } from './components/TopicCard';
import { TOPICS_DATA } from './constants';
import { generateContentPlan, generateTopicImage, generateSpeechFromText } from './services/geminiService';
import { Topic, StoredBriefing } from './types';
import { BrainIcon } from './components/icons/BrainIcon';
import { PlayIcon } from './components/icons/PlayIcon';
import { PauseIcon } from './components/icons/PauseIcon';

declare global {
  interface Window {
    marked: any;
  }
}

const App: React.FC = () => {
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<string>('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const [storedBriefings, setStoredBriefings] = useState<{ [id: number]: StoredBriefing }>({});
  
  // Audio state
  const [isAudioLoading, setIsAudioLoading] = useState<boolean>(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  // Load stored briefings from localStorage on initial mount & initialize AudioContext
  useEffect(() => {
    try {
      const storedData = localStorage.getItem('storedBriefings');
      if (storedData) {
        const parsedBriefings = JSON.parse(storedData);
        setStoredBriefings(parsedBriefings);
      }
    } catch (error) {
      console.error("Failed to parse stored briefings from localStorage", error);
      localStorage.removeItem('storedBriefings'); // Clear corrupted data
    }
    
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  // Save stored briefings to localStorage whenever the state changes
  useEffect(() => {
    try {
      // Only save if there's something to save to avoid empty entries
      if (Object.keys(storedBriefings).length > 0) {
        localStorage.setItem('storedBriefings', JSON.stringify(storedBriefings));
      }
    } catch (error) {
      console.error("Failed to save briefings to localStorage", error);
    }
  }, [storedBriefings]);
  
  const completedTopics = Object.keys(storedBriefings).map(Number);

  const handleGenerateClick = useCallback(async (topic: Topic) => {
    setSelectedTopic(topic);
    setIsLoading(true);
    setError(null);
    setGeneratedPlan('');
    setGeneratedImageUrl(null);
    audioBufferRef.current = null;
    setIsAudioPlaying(false);

    const loadingMessages = [
        'Processando diretivas...',
        'Consultando fontes de inteligência...',
        'Compilando dados...',
        'Renderizando recursos...'
    ];
    let messageIndex = 0;
    const intervalId = setInterval(() => {
        setLoadingStep(loadingMessages[messageIndex]);
        messageIndex = (messageIndex + 1) % loadingMessages.length;
    }, 2500);

    try {
      setLoadingStep('Gerando plano de conteúdo detalhado...');
      const plan = await generateContentPlan(topic);
      setGeneratedPlan(plan);

      let imageUrl: string | null = null;
      try {
        setLoadingStep('Criando material visual para o briefing...');
        imageUrl = await generateTopicImage(topic);
        setGeneratedImageUrl(imageUrl);
      } catch (imageErr) {
        console.error("Falha ao gerar a imagem, mas o plano foi criado:", imageErr);
        setGeneratedImageUrl(null); 
      }

      // Save the complete briefing
      const newBriefing: StoredBriefing = { plan, imageUrl };
      setStoredBriefings(prev => ({ ...prev, [topic.id]: newBriefing }));

    } catch (err: any) {
      setError('Falha ao gerar o briefing. A inteligência inimiga pode estar interferindo. Tente novamente.');
      console.error(err);
    } finally {
      clearInterval(intervalId);
      setIsLoading(false);
      setLoadingStep('');
    }
  }, []);

  const handleViewClick = useCallback((topic: Topic) => {
    const briefing = storedBriefings[topic.id];
    if (briefing) {
        setSelectedTopic(topic);
        setGeneratedPlan(briefing.plan);
        setGeneratedImageUrl(briefing.imageUrl);
        // Reset audio state for the new content
        audioBufferRef.current = null;
        setIsAudioPlaying(false);
    }
  }, [storedBriefings]);

  const handleAudioPlayback = async () => {
    if (!generatedPlan || !audioContextRef.current) return;
    
    if (isAudioPlaying) {
      audioSourceRef.current?.stop();
      setIsAudioPlaying(false);
      return;
    }

    if (audioBufferRef.current) {
        playAudio(audioBufferRef.current);
        return;
    }
    
    setIsAudioLoading(true);
    try {
      const audioBuffer = await generateSpeechFromText(generatedPlan, audioContextRef.current);
      audioBufferRef.current = audioBuffer;
      playAudio(audioBuffer);
    } catch (err: any) {
      setError('Falha ao sintetizar o áudio do briefing.');
      console.error(err);
    } finally {
        setIsAudioLoading(false);
    }
  };

  const playAudio = (buffer: AudioBuffer) => {
      if (!audioContextRef.current) return;
      if (audioSourceRef.current) {
          audioSourceRef.current.disconnect();
      }
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => {
          setIsAudioPlaying(false);
          audioSourceRef.current = null;
      };
      source.start(0);
      audioSourceRef.current = source;
      setIsAudioPlaying(true);
  };

  const closeModal = () => {
    if (isAudioPlaying && audioSourceRef.current) {
        audioSourceRef.current.stop();
    }
    setSelectedTopic(null);
    setGeneratedPlan('');
    setGeneratedImageUrl(null);
    setError(null);
    setIsAudioPlaying(false);
    audioBufferRef.current = null;
  };

  const renderedPlan = generatedPlan ? window.marked.parse(generatedPlan) : '';

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <main className="container mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <BrainIcon className="w-10 h-10 text-cyan-400" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 text-transparent bg-clip-text">
              HUB de Missões Geopolíticas
            </h1>
          </div>
          <p className="max-w-3xl mx-auto text-lg text-gray-400">
            Selecione uma missão para receber um briefing completo de inteligência, incluindo plano de conteúdo, material visual e áudio.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {TOPICS_DATA.map((topic) => (
            <TopicCard 
              key={topic.id} 
              topic={topic} 
              onGenerateClick={handleGenerateClick}
              onViewClick={handleViewClick}
              isCompleted={completedTopics.includes(topic.id)} 
            />
          ))}
        </div>
      </main>

      {selectedTopic && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-gray-700">
            <header className="p-4 md:p-6 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
              <h2 className="text-xl md:text-2xl font-semibold text-white">{selectedTopic.title}</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-700"
                aria-label="Fechar modal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </header>
            <div className="p-4 md:p-6 overflow-y-auto flex-grow relative">
              {isLoading && (
                <div className="absolute inset-0 bg-gray-800 bg-opacity-90 flex flex-col items-center justify-center text-center z-10">
                  <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-xl text-gray-300">{loadingStep}</p>
                  <p className="text-gray-400">A IA está processando os dados. Aguarde...</p>
                </div>
              )}
              {error && (
                <div className="text-center text-red-400 bg-red-900/50 p-4 rounded-lg">
                  <p className="font-bold">Ocorreu um erro</p>
                  <p>{error}</p>
                </div>
              )}
              {!isLoading && (generatedPlan || generatedImageUrl) && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  <div className="lg:col-span-2">
                     {generatedImageUrl ? (
                      <div className="mb-4">
                        <img 
                          src={generatedImageUrl} 
                          alt={`Visual conceitual para ${selectedTopic.title}`}
                          className="rounded-lg shadow-lg w-full object-cover aspect-video bg-black"
                        />
                      </div>
                    ) : (
                      <div className="mb-4 aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                        <p className="text-gray-500 text-sm">Visual não disponível</p>
                      </div>
                    )}
                    <button onClick={handleAudioPlayback} disabled={isAudioLoading || !generatedPlan} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-3 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-emerald-500 disabled:bg-gray-600 disabled:cursor-not-allowed">
                      {isAudioLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Sintetizando Áudio...
                        </>
                      ) : (
                        <>
                          {isAudioPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
                          {isAudioPlaying ? 'Pausar Briefing' : (audioBufferRef.current ? 'Continuar Briefing' : 'Ouvir Briefing')}
                        </>
                      )}
                    </button>
                  </div>
                  <div className="lg:col-span-3 prose prose-invert max-w-none prose-p:text-gray-300 prose-headings:text-cyan-300 prose-strong:text-white prose-li:text-gray-300 prose-a:text-emerald-400">
                     <div dangerouslySetInnerHTML={{ __html: renderedPlan }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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

export default App;