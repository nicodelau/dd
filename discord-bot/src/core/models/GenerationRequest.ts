import { TranscriptEntry } from './TranscriptEntry.js';

export interface GenerationRequest {
  channelId: string;
  requestedBy: string;
  userPrompt?: string;
  recentTranscripts: TranscriptEntry[];
}

export interface GeneratedSceneResult {
  imageUrl: string;
  revisedPrompt: string;
  summary: string;
  requestedBy: string;
  timestamp: Date;
}
