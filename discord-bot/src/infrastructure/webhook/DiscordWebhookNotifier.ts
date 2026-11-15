import { IWebhookNotifier } from '../../core/interfaces/IWebhookNotifier.js';
import { GeneratedSceneResult } from '../../core/models/GenerationRequest.js';

export class DiscordWebhookNotifier implements IWebhookNotifier {
  public async sendScene(webhookUrl: string, result: GeneratedSceneResult): Promise<void> {
    if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      throw new Error('Invalid Discord Webhook URL. Must start with https://discord.com/api/webhooks/');
    }

    const payload = {
      username: 'Visualizador de Escenas',
      avatar_url: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
      embeds: [
        {
          title: '🎨 Nueva Escena Generada',
          description: result.summary,
          color: 0x9b59b6, // Purple / D&D thematic
          fields: [
            {
              name: '📜 Solicitado por',
              value: result.requestedBy,
              inline: true,
            },
            {
              name: '🕒 Momento',
              value: `<t:${Math.floor(result.timestamp.getTime() / 1000)}:R>`,
              inline: true,
            },
            {
              name: '🔍 Prompt Visual (Generado)',
              value: `\`\`\`${result.revisedPrompt.slice(0, 1000)}\`\`\``,
              inline: false,
            },
          ],
          image: {
            url: result.imageUrl,
          },
          footer: {
            text: 'Generado a partir de la conversación en canal de voz',
          },
          timestamp: result.timestamp.toISOString(),
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send Discord webhook (${response.status}): ${errorText}`);
    }
  }
}
