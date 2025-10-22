import React, { useState } from 'react';
import { Topic } from '../types';
import { BrainIcon } from './icons/BrainIcon';
import { ChevronIcon } from './icons/ChevronIcon';
import { CheckmarkIcon } from './icons/CheckmarkIcon';


interface TopicCardProps {
  topic: Topic;
  onGenerateClick: (topic: Topic) => void;
  isCompleted: boolean;
}

export const TopicCard: React.FC<TopicCardProps> = ({ topic, onGenerateClick, isCompleted }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-xl shadow-lg flex flex-col transition-all duration-300 hover:shadow-cyan-500/20 hover:border-cyan-500/50 ${isCompleted ? 'border-emerald-500/50' : ''}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-6 text-left w-full flex justify-between items-center cursor-pointer"
        aria-expanded={isExpanded}
      >
        <div className="flex-1 pr-4">
            <h3 className="text-xl font-bold text-gray-100 ">{topic.title}</h3>
            {isCompleted && (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-1">
                    <CheckmarkIcon className="w-4 h-4" />
                    BRIEFING CONCLUÍDO
                </span>
            )}
        </div>
        <ChevronIcon isExpanded={isExpanded} />
      </button>

      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-96' : 'max-h-0'
        }`}
      >
        <div className="px-6 pb-6">
          <p className="text-sm text-gray-400 mb-2 font-semibold">Pontos de Inteligência:</p>
          <ul className="space-y-2 list-disc list-inside text-gray-400">
            {topic.subtopics.map((sub, index) => (
              <li key={index}>{sub}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-auto p-6 bg-gray-800/50 rounded-b-xl border-t border-gray-700/50">
        <button
          onClick={() => onGenerateClick(topic)}
          className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500"
        >
          <BrainIcon className="w-5 h-5" />
          Gerar Briefing com IA
        </button>
      </div>
    </div>
  );
};