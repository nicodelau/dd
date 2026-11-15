import { describe, it, expect, vi } from 'vitest';
import { SceneGenerationUseCase } from '../src/application/SceneGenerationUseCase.js';
import { IPromptSynthesizer } from '../src/core/interfaces/IPromptSynthesizer.js';
import { IImageGenerator } from '../src/core/interfaces/IImageGenerator.js';
import { IWebhookNotifier } from '../src/core/interfaces/IWebhookNotifier.js';
import { GenerationRequest } from '../src/core/models/GenerationRequest.js';

describe('SceneGenerationUseCase', () => {
  it('should orchestrate synthesizer, image generator and webhook notifier', async () => {
    const mockSynthesizer: IPromptSynthesizer = {
      synthesize: vi.fn().mockResolvedValue({
        prompt: 'A dwarf mining in Moria, cinematic lighting',
        summary: 'Un enano minando en las profundidades de Moria.',
      }),
    };

    const mockImageGenerator: IImageGenerator = {
      generate: vi.fn().mockResolvedValue('https://image.pollinations.ai/prompt/dwarf'),
    };

    const mockWebhookNotifier: IWebhookNotifier = {
      sendScene: vi.fn().mockResolvedValue(undefined),
    };

    const useCase = new SceneGenerationUseCase(
      mockSynthesizer,
      mockImageGenerator,
      mockWebhookNotifier
    );

    const request: GenerationRequest = {
      channelId: 'channel-123',
      requestedBy: 'Gimli',
      userPrompt: 'Enfócate en el pico reluciente',
      recentTranscripts: [
        {
          userId: 'u1',
          username: 'Gimli',
          text: 'Estoy buscando mithril en la veta',
          timestamp: new Date(),
        },
      ],
    };

    const webhookUrl = 'https://discord.com/api/webhooks/123/sample';
    const result = await useCase.execute(request, webhookUrl);

    expect(mockSynthesizer.synthesize).toHaveBeenCalledWith(request);
    expect(mockImageGenerator.generate).toHaveBeenCalledWith('A dwarf mining in Moria, cinematic lighting');
    expect(mockWebhookNotifier.sendScene).toHaveBeenCalledWith(webhookUrl, expect.objectContaining({
      imageUrl: 'https://image.pollinations.ai/prompt/dwarf',
      revisedPrompt: 'A dwarf mining in Moria, cinematic lighting',
      summary: 'Un enano minando en las profundidades de Moria.',
      requestedBy: 'Gimli',
    }));

    expect(result.imageUrl).toBe('https://image.pollinations.ai/prompt/dwarf');
    expect(result.requestedBy).toBe('Gimli');
  });

  it('should reject if webhookUrl is missing', async () => {
    const mockSynthesizer = { synthesize: vi.fn() };
    const mockImageGenerator = { generate: vi.fn() };
    const mockWebhookNotifier = { sendScene: vi.fn() };

    const useCase = new SceneGenerationUseCase(
      mockSynthesizer as unknown as IPromptSynthesizer,
      mockImageGenerator as unknown as IImageGenerator,
      mockWebhookNotifier as unknown as IWebhookNotifier
    );

    const request: GenerationRequest = {
      channelId: 'channel-123',
      requestedBy: 'Gimli',
      recentTranscripts: [],
    };

    await expect(useCase.execute(request, '')).rejects.toThrow('Webhook URL is required');
  });
});
