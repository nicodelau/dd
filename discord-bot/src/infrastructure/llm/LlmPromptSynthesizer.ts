import { IPromptSynthesizer, SynthesizedPrompt } from '../../core/interfaces/IPromptSynthesizer.js';
import { GenerationRequest } from '../../core/models/GenerationRequest.js';
import { WorldLoreRegistry } from '../lore/WorldLoreRegistry.js';

export class EmptyContextError extends Error {
  constructor(message: string = 'No hay transcripciones recientes ni instrucción del usuario para generar una imagen.') {
    super(message);
    this.name = 'EmptyContextError';
  }
}

export interface LlmConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  worldLoreRegistry?: WorldLoreRegistry;
}

export class LlmPromptSynthesizer implements IPromptSynthesizer {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly worldLoreRegistry: WorldLoreRegistry;

  constructor(config: LlmConfig) {
    if (!config.apiKey) {
      throw new Error('API key is required for LlmPromptSynthesizer');
    }
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.groq.com/openai/v1';
    this.model = config.model || 'openai/gpt-oss-20b';
    this.worldLoreRegistry = config.worldLoreRegistry || new WorldLoreRegistry();
  }

  public async synthesize(request: GenerationRequest): Promise<SynthesizedPrompt> {
    const hasTranscripts = request.recentTranscripts && request.recentTranscripts.length > 0;
    const hasUserPrompt = request.userPrompt && request.userPrompt.trim().length > 0;

    if (!hasTranscripts && !hasUserPrompt) {
      throw new EmptyContextError();
    }

    const conversationLines = (request.recentTranscripts || []).map(
      (t) => `[${t.username}]: ${t.text}`
    );

    const fullConversationText = [
      conversationLines.join(' '),
      hasUserPrompt ? request.userPrompt!.trim() : '',
    ].join(' ');

    const loreContext = this.worldLoreRegistry.buildLorePromptContext(fullConversationText);

    const userMessageContent = [
      'Conversación reciente en canal de voz:',
      conversationLines.length > 0 ? conversationLines.join('\n') : '(Sin transcripciones previas)',
      '',
      'Instrucción adicional del usuario:',
      hasUserPrompt ? request.userPrompt!.trim() : '(Ninguna)',
    ].join('\n');

    const systemPrompt = [
      'Eres un experto director de arte para sesiones de rol (D&D) en el mundo de Pilotes y generador de prompts para modelos de difusión de imágenes (como FLUX, Midjourney o DALL-E 3).',
      'Tu tarea es sintetizar la conversación reciente del canal de voz y la instrucción del usuario en:',
      '1. "prompt": Un prompt visual altamente descriptivo en INGLÉS enfocado en composición, iluminación, estilo artístico (fantasy digital illustration, atmospheric lighting, detailed), personajes y entorno.',
      '2. "summary": Un resumen conciso en ESPAÑOL de una o dos oraciones describiendo la escena generada.',
      '',
      'DIRECTRICES DE LORE Y CONSISTENCIA VISUAL OBLIGATORIAS:',
      loreContext,
      '',
      'REGLAS DE GENERACIÓN:',
      '- Si se detectan o mencionan personajes de la campaña (Siegarth, Velyra, Olivar, Timor, Chiflo/Malaspulgas), debes incorporar obligatoriamente sus rasgos físicos fijos, vestimenta y accesorios detallados arriba.',
      '- Si se mencionan distritos o lugares de Pilotes (Palermo, Opus, Puerto, Lafe), ambienta la escena en ese entorno.',
      '- Respeta el estilo de arte maestro: Dark fantasy chiaroscuro dramatic lighting, contrastes lumínicos con faroles/antorchas/magia sobre sombras oscuras, texturas realistas.',
      '- Debes responder ÚNICAMENTE en formato JSON válido con las claves "prompt" y "summary".',
    ].join('\n');

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessageContent },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM API request failed with status ${response.status}: ${errorText}`);
    }

    interface ChatCompletionResponse {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    }
    const data = (await response.json()) as ChatCompletionResponse;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Respuesta vacía o inválida del servicio de LLM');
    }

    try {
      const parsed = JSON.parse(content);
      if (!parsed.prompt) {
        throw new Error('El JSON devuelto por el LLM no contiene la clave "prompt"');
      }
      return {
        prompt: String(parsed.prompt),
        summary: parsed.summary ? String(parsed.summary) : 'Escena generada a partir de la conversación.',
      };
    } catch (err) {
      if (err instanceof Error && err.message.includes('clave "prompt"')) {
        throw err;
      }
      throw new Error(`Error al parsear respuesta JSON del LLM: ${content}`);
    }
  }
}
