import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PollinationsImageService } from '../src/infrastructure/image/PollinationsImageService.js';
import { Dalle3ImageService } from '../src/infrastructure/image/Dalle3ImageService.js';
import { DiscordWebhookNotifier } from '../src/infrastructure/webhook/DiscordWebhookNotifier.js';
import { GeneratedSceneResult } from '../src/core/models/GenerationRequest.js';

describe('Image and Webhook Services', () => {
  describe('PollinationsImageService', () => {
    it('should generate a valid encoded image URL with parameters', async () => {
      const service = new PollinationsImageService();
      const prompt = 'A dragon over a mountain';
      const url = await service.generate(prompt);

      expect(url).toContain('https://image.pollinations.ai/prompt/');
      expect(url).toContain(encodeURIComponent(prompt));
      expect(url).toContain('model=flux');
    });

    it('should throw error if prompt is empty', async () => {
      const service = new PollinationsImageService();
      await expect(service.generate('')).rejects.toThrow('Prompt cannot be empty');
    });
  });

  describe('Dalle3ImageService', () => {
    it('should call OpenAI API and return image url', async () => {
      const service = new Dalle3ImageService('mock-openai-key');
      const expectedUrl = 'https://oaidalleapiprodscus.blob.core.windows.net/sample.png';

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ url: expectedUrl }],
        }),
      } as unknown as Response);

      const resultUrl = await service.generate('A majestic castle');
      expect(resultUrl).toBe(expectedUrl);
      expect(fetchSpy).toHaveBeenCalledOnce();

      fetchSpy.mockRestore();
    });

    it('should throw error if OpenAI API fails', async () => {
      const service = new Dalle3ImageService('mock-openai-key');

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Billing quota exceeded',
      } as unknown as Response);

      await expect(service.generate('A castle')).rejects.toThrow(/Billing quota exceeded|400/);

      fetchSpy.mockRestore();
    });
  });

  describe('DiscordWebhookNotifier', () => {
    let notifier: DiscordWebhookNotifier;

    beforeEach(() => {
      notifier = new DiscordWebhookNotifier();
    });

    it('should post payload to discord webhook url', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 204,
      } as unknown as Response);

      const sceneResult: GeneratedSceneResult = {
        imageUrl: 'https://image.pollinations.ai/prompt/dragon',
        revisedPrompt: 'A fierce red dragon on rocks',
        summary: 'Un temible dragón rojo sobre rocas.',
        requestedBy: 'Frodo',
        timestamp: new Date(),
      };

      await notifier.sendScene('https://discord.com/api/webhooks/123/abc', sceneResult);

      expect(fetchSpy).toHaveBeenCalledOnce();
      const callArgs = fetchSpy.mock.calls[0];
      expect(callArgs[0]).toBe('https://discord.com/api/webhooks/123/abc');
      const body = JSON.parse(callArgs[1]?.body as string);
      expect(body.embeds).toBeDefined();
      expect(body.embeds[0].title).toBe('🎨 Nueva Escena Generada');
      expect(body.embeds[0].image.url).toBe(sceneResult.imageUrl);

      fetchSpy.mockRestore();
    });

    it('should reject invalid webhook url', async () => {
      const sceneResult: GeneratedSceneResult = {
        imageUrl: 'https://example.com/img.png',
        revisedPrompt: 'Prompt',
        summary: 'Resumen',
        requestedBy: 'Frodo',
        timestamp: new Date(),
      };

      await expect(notifier.sendScene('invalid-url', sceneResult)).rejects.toThrow('Invalid Discord Webhook URL');
    });
  });
});
