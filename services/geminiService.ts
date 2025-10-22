import { GoogleGenAI, Modality } from "@google/genai";
import { Topic } from '../types';

// Audio decoding utilities
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
): Promise<AudioBuffer> {
  // Raw PCM data from the API is 16-bit, 24000Hz, single-channel
  const sampleRate = 24000;
  const numChannels = 1;
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}


const getGenAI = () => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export const generateContentPlan = async (topic: Topic): Promise<string> => {
  const ai = getGenAI();

  const prompt = `
    **MISSÃO: CRIAÇÃO DE BRIEFING DE INTELIGÊNCIA**

    **PARA:** Agente de Campo (Usuário)
    **DE:** Comando Central de Análise Geopolítica (IA)
    **ASSUNTO:** Desenvolvimento de Plano de Conteúdo

    **DIRETIVA:**
    Você é um estrategista sênior do Comando Central, especializado em geopolítica e operações de informação. Sua tarefa é criar um briefing de inteligência detalhado, que servirá como um plano de conteúdo para um documentário investigativo ou uma série de reportagens.

    **ALVO DA MISSÃO (Tópico Principal):** "${topic.title}"

    **PONTOS-CHAVE DE INTELIGÊNCIA (Sub-tópicos a serem cobertos):**
    ${topic.subtopics.map(sub => `- ${sub}`).join('\n')}

    **ESTRUTURA DO BRIEFING (Formato Markdown):**

    1.  **NOME DA OPERAÇÃO (Título Sugerido):** Crie um título impactante e confidencial.
    2.  **SUMÁRIO EXECUTIVO (Sinopse):** Em um parágrafo, resuma a premissa central da operação de forma envolvente e direta.
    3.  **MODUS OPERANDI (Formato Recomendado):** Sugira o melhor formato (ex: Documentário de 60 min, Série de Podcast com 3 episódios, Dossiê Interativo para portal de notícias). Justifique a escolha tática.
    4.  **PROTOCOLO DA MISSÃO (Estrutura/Roteiro Detalhado):**
        *   Divida a narrativa em fases lógicas (ex: Fase I: Infiltração e Contexto, Fase II: A Conexão, Fase III: O Impacto).
        *   Para cada fase, detalhe os pontos a serem cobertos, conectando os sub-tópicos de forma coesa.
        *   Sugira "fontes humanas e materiais" (entrevistados, documentos) e "recursos visuais" (arquivos, infográficos) para enriquecer cada parte.
    5.  **PÚBLICO-ALVO ESTRATÉGICO:** Descreva o perfil do público que deve ser alcançado por esta operação de informação.

    **EXECUÇÃO:**
    Seja criativo, analítico e apresente a informação de forma clara e convincente. O objetivo é criar um plano de ação que possa ser executado imediatamente por uma equipe de produção no campo.
    `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API for content plan:", error);
    throw new Error("Failed to generate content plan from Gemini API.");
  }
};


export const generateTopicImage = async (topic: Topic): Promise<string> => {
    const ai = getGenAI();
    const prompt = `Crie uma arte conceitual dramática e investigativa para um documentário de geopolítica com o tema: "${topic.title}". Use um estilo de thriller de espionagem, com cores escuras, contrastes fortes e elementos simbólicos como mapas, documentos sigilosos, e silhuetas. A imagem deve ser cinematográfica e instigante.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return `data:image/png;base64,${base64ImageBytes}`;
            }
        }
        throw new Error("Nenhuma imagem foi gerada.");
    } catch (error) {
        console.error("Error calling Gemini API for image generation:", error);
        throw new Error("Failed to generate topic image from Gemini API.");
    }
};

export const generateSpeechFromText = async (text: string, audioContext: AudioContext): Promise<AudioBuffer> => {
  const ai = getGenAI();
  const cleanText = text.replace(/<[^>]*>?/gm, ''); // Remove HTML tags for better TTS

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Narração do briefing: ${cleanText}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // A voice that fits a serious tone
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data received from API.");
    }

    const decodedBytes = decodeBase64(base64Audio);
    return await decodeAudioData(decodedBytes, audioContext);

  } catch (error) {
    console.error("Error calling Gemini API for TTS:", error);
    throw new Error("Failed to generate speech from Gemini API.");
  }
};