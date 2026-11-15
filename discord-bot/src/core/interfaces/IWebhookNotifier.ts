import { GeneratedSceneResult } from '../models/GenerationRequest.js';

export interface IWebhookNotifier {
  /**
   * Dispatches the generated scene image and metadata to the destination Discord channel via webhook.
   * @param webhookUrl Discord Webhook URL.
   * @param result Scene details including image URL, prompt, author, and summary.
   */
  sendScene(webhookUrl: string, result: GeneratedSceneResult): Promise<void>;
}
