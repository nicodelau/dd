import { IImageGenerator } from '../../core/interfaces/IImageGenerator.js';

export interface PollinationsConfig {
  width?: number;
  height?: number;
  model?: string;
  seed?: number;
}

export class PollinationsImageService implements IImageGenerator {
  private readonly width: number;
  private readonly height: number;
  private readonly model: string;

  constructor(config?: PollinationsConfig) {
    this.width = config?.width || 1024;
    this.height = config?.height || 1024;
    this.model = config?.model || 'flux';
  }

  public async generate(prompt: string): Promise<string> {
    if (!prompt || !prompt.trim()) {
      throw new Error('Prompt cannot be empty');
    }

    const seed = Math.floor(Math.random() * 1000000);
    const encodedPrompt = encodeURIComponent(prompt.trim());
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${this.width}&height=${this.height}&model=${this.model}&seed=${seed}&nologo=true`;

    return imageUrl;
  }
}
