import { ITranscriptionService } from '../../core/interfaces/ITranscriptionService.js';

export class GroqWhisperService implements ITranscriptionService {
  private readonly apiKey: string;
  private readonly endpoint: string;
  private readonly model: string;
  private readonly maxRetries: number;

  constructor(
    apiKey: string,
    endpoint: string = 'https://api.groq.com/openai/v1/audio/transcriptions',
    model: string = process.env.GROQ_WHISPER_MODEL || 'whisper-large-v3-turbo',
    maxRetries: number = 2
  ) {
    if (!apiKey) {
      throw new Error('API key is required for GroqWhisperService');
    }
    this.apiKey = apiKey;
    this.endpoint = endpoint;
    this.model = model;
    this.maxRetries = maxRetries;
  }

  public async transcribe(audioBuffer: Buffer): Promise<string> {
    if (!audioBuffer || audioBuffer.length === 0) {
      return '';
    }

    return this.executeWithRetry(audioBuffer, 0);
  }

  private async executeWithRetry(audioBuffer: Buffer, attempt: number): Promise<string> {
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/wav' });
    formData.append('file', blob, 'audio.wav');
    formData.append('model', this.model);
    formData.append('response_format', 'json');

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (response.status === 429 && attempt < this.maxRetries) {
      const errorText = await response.text();
      let waitSeconds = 3;
      const match = errorText.match(/try again in ([0-9]+(?:\.[0-9]+)?)s/i);
      if (match && match[1]) {
        waitSeconds = Math.ceil(parseFloat(match[1]));
      }

      console.warn(`[Groq Whisper] Rate limit 429 alcanzado. Reintentando intento ${attempt + 1}/${this.maxRetries} en ${waitSeconds}s...`);
      await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
      return this.executeWithRetry(audioBuffer, attempt + 1);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq Whisper API error ${response.status}: ${errorText}`);
    }

    interface WhisperResponse {
      text?: string;
    }
    const data = (await response.json()) as WhisperResponse;
    return (data.text || '').trim();
  }
}
