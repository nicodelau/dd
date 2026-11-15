import { IPromptSynthesizer } from '../core/interfaces/IPromptSynthesizer.js';
import { IImageGenerator } from '../core/interfaces/IImageGenerator.js';
import { IWebhookNotifier } from '../core/interfaces/IWebhookNotifier.js';
import { GenerationRequest, GeneratedSceneResult } from '../core/models/GenerationRequest.js';

export class SceneGenerationUseCase {
  constructor(
    private readonly promptSynthesizer: IPromptSynthesizer,
    private readonly imageGenerator: IImageGenerator,
    private readonly webhookNotifier: IWebhookNotifier
  ) {}

  public async execute(
    request: GenerationRequest,
    webhookUrl: string
  ): Promise<GeneratedSceneResult> {
    if (!webhookUrl || !webhookUrl.trim()) {
      throw new Error('Webhook URL is required');
    }

    // 1. Synthesize visual prompt and summary using LLM
    const { prompt, summary } = await this.promptSynthesizer.synthesize(request);

    // 2. Generate image using configured provider
    const imageUrl = await this.imageGenerator.generate(prompt);

    // 3. Assemble scene result
    const result: GeneratedSceneResult = {
      imageUrl,
      revisedPrompt: prompt,
      summary,
      requestedBy: request.requestedBy,
      timestamp: new Date(),
    };

    // 4. Send to destination channel via Discord Webhook
    await this.webhookNotifier.sendScene(webhookUrl, result);

    return result;
  }
}
