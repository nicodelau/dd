import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AutoSceneScheduler } from '../src/application/AutoSceneScheduler.js';
import { TranscriptBuffer } from '../src/application/TranscriptBuffer.js';
import { SceneGenerationUseCase } from '../src/application/SceneGenerationUseCase.js';

describe('AutoSceneScheduler', () => {
  let transcriptBuffer: TranscriptBuffer;
  let mockUseCase: SceneGenerationUseCase;
  let scheduler: AutoSceneScheduler;

  beforeEach(() => {
    vi.useFakeTimers();
    transcriptBuffer = new TranscriptBuffer(100);
    mockUseCase = {
      execute: vi.fn().mockResolvedValue({
        imageUrl: 'https://example.com/scene.png',
        revisedPrompt: 'A snowy castle',
        summary: 'Un castillo nevado.',
        requestedBy: 'Auto-Generador',
        timestamp: new Date(),
      }),
    } as unknown as SceneGenerationUseCase;

    scheduler = new AutoSceneScheduler({
      transcriptBuffer,
      sceneGeneratorUseCase: mockUseCase,
      webhookUrl: 'https://discord.com/api/webhooks/123/abc',
      intervalSeconds: 300, // 5 minutes
    });
  });

  afterEach(() => {
    scheduler.stop();
    vi.useRealTimers();
  });

  it('should not be active initially until started', () => {
    expect(scheduler.isActive()).toBe(false);
  });

  it('should activate on start() and deactivate on stop()', () => {
    scheduler.start();
    expect(scheduler.isActive()).toBe(true);

    scheduler.stop();
    expect(scheduler.isActive()).toBe(false);
  });

  it('should skip generation when interval fires if no transcripts exist', async () => {
    scheduler.start();

    // Fast-forward 5 minutes (300,000 ms)
    await vi.advanceTimersByTimeAsync(300_000);

    expect(mockUseCase.execute).not.toHaveBeenCalled();
  });

  it('should generate image when interval fires if transcripts are present', async () => {
    scheduler.start();

    // User speaks 1 minute in
    await vi.advanceTimersByTimeAsync(60_000);
    transcriptBuffer.add({
      userId: 'u1',
      username: 'Gandalf',
      text: 'Veo un castillo con nieve',
      timestamp: new Date(),
    });

    // Advance remaining 4 minutes
    await vi.advanceTimersByTimeAsync(240_000);

    expect(mockUseCase.execute).toHaveBeenCalledOnce();
    expect(mockUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        requestedBy: 'Auto-Generador (Cada 5 min)',
      }),
      'https://discord.com/api/webhooks/123/abc'
    );
  });

  it('should not generate a second time if no new transcripts occurred in the second interval', async () => {
    scheduler.start();

    // Speak in first interval
    transcriptBuffer.add({
      userId: 'u1',
      username: 'Gandalf',
      text: 'Castillo nevado',
      timestamp: new Date(),
    });

    // Fire first interval
    await vi.advanceTimersByTimeAsync(300_000);
    expect(mockUseCase.execute).toHaveBeenCalledTimes(1);

    // Second interval with NO new speech (silence)
    await vi.advanceTimersByTimeAsync(300_000);
    expect(mockUseCase.execute).toHaveBeenCalledTimes(1); // Still 1, not called again
  });
});
