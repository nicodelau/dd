import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export interface BotConfig {
  discordToken: string;
  triggerChannelId?: string;
  destinationWebhookUrl: string;
  sttProvider: 'groq' | 'openai';
  llmProvider: 'groq' | 'openai';
  imageProvider: 'pollinations' | 'dalle3';
  groqApiKey?: string;
  openaiApiKey?: string;
  retentionSeconds: number;
  autoGenerateIntervalSeconds: number;
}

export function loadConfig(): BotConfig {
  const discordToken = process.env.DISCORD_TOKEN;
  if (!discordToken) {
    throw new Error('DISCORD_TOKEN is required in environment variables');
  }

  const destinationWebhookUrl = process.env.DESTINATION_WEBHOOK_URL;
  if (!destinationWebhookUrl) {
    throw new Error('DESTINATION_WEBHOOK_URL is required in environment variables');
  }

  const sttProvider = (process.env.STT_PROVIDER || 'groq').toLowerCase() as 'groq' | 'openai';
  const llmProvider = (process.env.LLM_PROVIDER || 'groq').toLowerCase() as 'groq' | 'openai';
  const imageProvider = (process.env.IMAGE_PROVIDER || 'pollinations').toLowerCase() as 'pollinations' | 'dalle3';

  const groqApiKey = process.env.GROQ_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (sttProvider === 'groq' && !groqApiKey) {
    throw new Error('GROQ_API_KEY is required when STT_PROVIDER is groq');
  }
  if (llmProvider === 'groq' && !groqApiKey) {
    throw new Error('GROQ_API_KEY is required when LLM_PROVIDER is groq');
  }
  if (imageProvider === 'dalle3' && !openaiApiKey) {
    throw new Error('OPENAI_API_KEY is required when IMAGE_PROVIDER is dalle3');
  }

  const retentionSeconds = parseInt(process.env.TRANSCRIPT_RETENTION_SECONDS || '300', 10);
  const autoGenerateIntervalSeconds = parseInt(process.env.AUTO_GENERATE_INTERVAL_SECONDS || '300', 10);

  return {
    discordToken,
    triggerChannelId: process.env.TRIGGER_CHANNEL_ID,
    destinationWebhookUrl,
    sttProvider,
    llmProvider,
    imageProvider,
    groqApiKey,
    openaiApiKey,
    retentionSeconds: isNaN(retentionSeconds) ? 300 : retentionSeconds,
    autoGenerateIntervalSeconds: isNaN(autoGenerateIntervalSeconds) ? 300 : autoGenerateIntervalSeconds,
  };
}
