import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LlmPromptSynthesizer, EmptyContextError } from '../src/infrastructure/llm/LlmPromptSynthesizer.js';
import { GenerationRequest } from '../src/core/models/GenerationRequest.js';

describe('LlmPromptSynthesizer', () => {
  const mockApiKey = 'mock-api-key';
  let synthesizer: LlmPromptSynthesizer;

  beforeEach(() => {
    synthesizer = new LlmPromptSynthesizer({
      apiKey: mockApiKey,
      baseUrl: 'https://api.groq.com/openai/v1',
      model: 'llama-3.3-70b-versatile',
    });
  });

  it('should throw EmptyContextError if both transcripts and userPrompt are empty', async () => {
    const emptyRequest: GenerationRequest = {
      channelId: 'ch1',
      requestedBy: 'user1',
      userPrompt: '',
      recentTranscripts: [],
    };

    await expect(synthesizer.synthesize(emptyRequest)).rejects.toThrow(EmptyContextError);
  });

  it('should call LLM API and parse JSON response into prompt and summary', async () => {
    const request: GenerationRequest = {
      channelId: 'ch1',
      requestedBy: 'user1',
      userPrompt: 'Haz que el dragón se vea más amenazante',
      recentTranscripts: [
        {
          userId: 'u1',
          username: 'Gandalf',
          text: 'Entramos a la caverna volcánica y hay un dragón dormido',
          timestamp: new Date(),
        },
      ],
    };

    const mockResponsePayload = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              prompt: 'A menacing red dragon resting inside a dark volcanic cave with glowing magma, fantasy art style, 8k resolution',
              summary: 'Un dragón rojo acechando en una cueva volcánica.',
            }),
          },
        },
      ],
    };

    // Mock native global fetch
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponsePayload,
    } as unknown as Response);

    const result = await synthesizer.synthesize(request);

    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(result.prompt).toContain('menacing red dragon');
    expect(result.summary).toContain('dragón rojo');

    fetchSpy.mockRestore();
  });

  it('should handle LLM API HTTP error defensibly', async () => {
    const request: GenerationRequest = {
      channelId: 'ch1',
      requestedBy: 'user1',
      userPrompt: 'Generar paisaje',
      recentTranscripts: [],
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      text: async () => 'Rate limit reached',
    } as unknown as Response);

    await expect(synthesizer.synthesize(request)).rejects.toThrow(/Rate limit reached|429/);

    fetchSpy.mockRestore();
  });

  it('should include recognized lore characters and master art style in the LLM system prompt payload', async () => {
    const request: GenerationRequest = {
      channelId: 'ch1',
      requestedBy: 'user1',
      userPrompt: 'Timor y Siegarth se enfrentan cerca de Puerto',
      recentTranscripts: [],
    };

    let capturedBody: any = null;
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async (_url, options: any) => {
      capturedBody = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  prompt: 'Golden dragonborn Timor clashing with skeletal hooded Siegarth at the stormy docks of Puerto in Pilotes, chiaroscuro lighting',
                  summary: 'Timor y Siegarth en los muelles de Puerto.',
                }),
              },
            },
          ],
        }),
      } as unknown as Response;
    });

    const result = await synthesizer.synthesize(request);

    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(capturedBody).not.toBeNull();
    const systemMessage = capturedBody.messages.find((m: any) => m.role === 'system')?.content || '';
    expect(systemMessage).toContain('MASTER ART STYLE');
    expect(systemMessage).toContain('Timor');
    expect(systemMessage).toContain('Siegarth');
    expect(systemMessage).toContain('Puerto');
    expect(result.prompt).toContain('Timor');

    fetchSpy.mockRestore();
  });
});
