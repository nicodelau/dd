import { ITranscriptionService } from '../../core/interfaces/ITranscriptionService.js';

export class OpenAIWhisperService implements ITranscriptionService {
  private readonly apiKey: string;
  private readonly endpoint: string;

  constructor(
    apiKey: string,
    endpoint: string = 'https://api.openai.com/v1/audio/transcriptions'
  ) {
    if (!apiKey) {
      throw new Error('API key is required for OpenAIWhisperService');
    }
    this.apiKey = apiKey;
    this.endpoint = endpoint;
  }

  public async transcribe(audioBuffer: Buffer): Promise<string> {
    if (!audioBuffer || audioBuffer.length === 0) {
      return '';
    }

    const formData = new FormData();
    const blob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/wav' });
    formData.append('file', blob, 'audio.wav');
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'json');

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI Whisper API error ${response.status}: ${errorText}`);
    }

    interface WhisperResponse {
      text?: string;
    }
    const data = (await response.json()) as WhisperResponse;
    return (data.text || '').trim();
  }
}
