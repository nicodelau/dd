import { IImageGenerator } from '../../core/interfaces/IImageGenerator.js';

export class Dalle3ImageService implements IImageGenerator {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(apiKey: string, baseUrl: string = 'https://api.openai.com/v1') {
    if (!apiKey) {
      throw new Error('API key is required for Dalle3ImageService');
    }
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  public async generate(prompt: string): Promise<string> {
    if (!prompt || !prompt.trim()) {
      throw new Error('Prompt cannot be empty');
    }

    const response = await fetch(`${this.baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt.trim(),
        n: 1,
        size: '1024x1024',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI DALL-E 3 error ${response.status}: ${errorText}`);
    }

    interface DalleResponse {
      data?: Array<{ url?: string }>;
    }
    const data = (await response.json()) as DalleResponse;
    const imageUrl = data.data?.[0]?.url;

    if (!imageUrl) {
      throw new Error('Respuesta inválida de OpenAI: no se encontró URL de imagen');
    }

    return imageUrl;
  }
}
