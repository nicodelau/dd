import { describe, it, expect, vi } from 'vitest';
import { GroqWhisperService } from '../src/infrastructure/transcription/GroqWhisperService.js';

describe('GroqWhisperService', () => {
  it('should return empty string if audio buffer is empty', async () => {
    const service = new GroqWhisperService('mock-api-key');
    const result = await service.transcribe(Buffer.alloc(0));
    expect(result).toBe('');
  });

  it('should post audio to Groq API and return transcribed text', async () => {
    const service = new GroqWhisperService('mock-api-key');
    const dummyAudio = Buffer.alloc(1000);

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ text: 'Hola a todos los presentes' }),
    } as unknown as Response);

    const text = await service.transcribe(dummyAudio);

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, requestInit] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://api.groq.com/openai/v1/audio/transcriptions');
    expect(requestInit?.headers).toHaveProperty('Authorization', 'Bearer mock-api-key');
    expect(text).toBe('Hola a todos los presentes');

    fetchSpy.mockRestore();
  });

  it('should handle API failure gracefully', async () => {
    const service = new GroqWhisperService('mock-api-key');
    const dummyAudio = Buffer.alloc(1000);

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    } as unknown as Response);

    await expect(service.transcribe(dummyAudio)).rejects.toThrow(/Groq Whisper API error 500/);

    fetchSpy.mockRestore();
  });

  it('should retry automatically on 429 rate limit error and succeed', async () => {
    const service = new GroqWhisperService('mock-api-key', 'https://api.groq.com/openai/v1/audio/transcriptions', 'whisper-large-v3-turbo', 2);
    const dummyAudio = Buffer.alloc(1000);

    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => 'Rate limit reached. Please try again in 0.01s.',
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ text: 'Transcripción exitosa tras reintento' }),
      } as unknown as Response);

    const text = await service.transcribe(dummyAudio);

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(text).toBe('Transcripción exitosa tras reintento');

    fetchSpy.mockRestore();
  });
});
