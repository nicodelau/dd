import { TranscriptBuffer } from './TranscriptBuffer.js';
import { SceneGenerationUseCase } from './SceneGenerationUseCase.js';
import { GeneratedSceneResult } from '../core/models/GenerationRequest.js';

export interface AutoSceneSchedulerOptions {
  transcriptBuffer: TranscriptBuffer;
  sceneGeneratorUseCase: SceneGenerationUseCase;
  webhookUrl: string;
  intervalSeconds?: number;
  onSceneGenerated?: (result: GeneratedSceneResult) => void;
  onError?: (err: unknown) => void;
}

export class AutoSceneScheduler {
  private readonly transcriptBuffer: TranscriptBuffer;
  private readonly sceneGeneratorUseCase: SceneGenerationUseCase;
  private readonly webhookUrl: string;
  private readonly intervalMs: number;
  private readonly onSceneGenerated?: (result: GeneratedSceneResult) => void;
  private readonly onError?: (err: unknown) => void;

  private timer: NodeJS.Timeout | null = null;
  private lastProcessedTimestamp: Date = new Date();

  constructor(options: AutoSceneSchedulerOptions) {
    if (!options.webhookUrl) {
      throw new Error('webhookUrl is required for AutoSceneScheduler');
    }
    const intervalSec = options.intervalSeconds && options.intervalSeconds > 0 ? options.intervalSeconds : 300;
    this.intervalMs = intervalSec * 1000;
    this.transcriptBuffer = options.transcriptBuffer;
    this.sceneGeneratorUseCase = options.sceneGeneratorUseCase;
    this.webhookUrl = options.webhookUrl;
    this.onSceneGenerated = options.onSceneGenerated;
    this.onError = options.onError;
  }

  public start(): void {
    if (this.timer) {
      return;
    }
    this.lastProcessedTimestamp = new Date(Date.now() - 1);
    this.timer = setInterval(() => {
      void this.checkAndGenerate();
    }, this.intervalMs);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public isActive(): boolean {
    return this.timer !== null;
  }

  public async checkAndGenerate(): Promise<boolean> {
    const allTranscripts = this.transcriptBuffer.getAll();
    const newTranscripts = allTranscripts.filter(
      (t) => t.timestamp.getTime() > this.lastProcessedTimestamp.getTime()
    );

    if (newTranscripts.length === 0) {
      return false;
    }

    const runTimestamp = new Date();

    try {
      const result = await this.sceneGeneratorUseCase.execute(
        {
          channelId: 'auto-scheduler',
          requestedBy: 'Auto-Generador (Cada 5 min)',
          recentTranscripts: newTranscripts,
        },
        this.webhookUrl
      );

      this.lastProcessedTimestamp = runTimestamp;

      if (this.onSceneGenerated) {
        this.onSceneGenerated(result);
      }
      return true;
    } catch (err) {
      if (this.onError) {
        this.onError(err);
      } else {
        console.error('[AutoSceneScheduler] Error generating periodic scene:', err);
      }
      return false;
    }
  }
}
