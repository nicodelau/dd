import { EndBehaviorType, VoiceReceiver } from '@discordjs/voice';
import prism from 'prism-media';
import { TranscriptBuffer } from './TranscriptBuffer.js';
import { ITranscriptionService } from '../core/interfaces/ITranscriptionService.js';
import { pcmToWav } from '../infrastructure/audio/WavConverter.js';

export interface VoiceTranscriptionOptions {
  transcriptBuffer: TranscriptBuffer;
  transcriptionService: ITranscriptionService;
  getUsername: (userId: string) => string;
  onTranscription?: (username: string, text: string) => void;
}

export class VoiceTranscriptionManager {
  private readonly transcriptBuffer: TranscriptBuffer;
  private readonly transcriptionService: ITranscriptionService;
  private readonly getUsername: (userId: string) => string;
  private readonly onTranscription?: (username: string, text: string) => void;
  private activeStreams: Set<string> = new Set();

  constructor(options: VoiceTranscriptionOptions) {
    this.transcriptBuffer = options.transcriptBuffer;
    this.transcriptionService = options.transcriptionService;
    this.getUsername = options.getUsername;
    this.onTranscription = options.onTranscription;
  }

  /**
   * Attaches speaking event listeners to a Discord VoiceReceiver.
   */
  public listenToReceiver(receiver: VoiceReceiver): void {
    receiver.speaking.on('start', (userId: string) => {
      this.handleUserSpeaking(userId, receiver);
    });
  }

  private handleUserSpeaking(userId: string, receiver: VoiceReceiver): void {
    if (this.activeStreams.has(userId)) {
      return;
    }

    this.activeStreams.add(userId);

    const opusStream = receiver.subscribe(userId, {
      end: {
        behavior: EndBehaviorType.AfterSilence,
        duration: 1500, // 1.5 seconds of silence marks end of utterance to group full sentences
      },
    });

    const opusDecoder = new prism.opus.Decoder({
      rate: 48000,
      channels: 2,
      frameSize: 960,
    });

    const pcmChunks: Buffer[] = [];

    opusStream.pipe(opusDecoder);

    opusDecoder.on('data', (chunk: Buffer) => {
      pcmChunks.push(chunk);
    });

    opusDecoder.on('end', async () => {
      this.activeStreams.delete(userId);
      const totalPcm = Buffer.concat(pcmChunks);
      const username = this.getUsername(userId);

      // Only transcribe if audio is longer than ~500ms (48000 bytes at 48kHz stereo 16-bit) to avoid mic noise
      if (totalPcm.length >= 48000) {
        try {
          await this.processAudioBuffer(userId, username, totalPcm);
        } catch (err) {
          console.error(`Error transcribing audio for ${username}:`, err);
        }
      }
    });

    opusDecoder.on('error', (err) => {
      console.error(`Opus decoder error for user ${userId}:`, err);
      this.activeStreams.delete(userId);
    });
  }

  /**
   * Directly processes a PCM audio buffer, converts it to WAV, transcribes it,
   * and saves it to the TranscriptBuffer.
   */
  public async processAudioBuffer(userId: string, username: string, pcmBuffer: Buffer): Promise<void> {
    if (!pcmBuffer || pcmBuffer.length === 0) {
      return;
    }

    const wavBuffer = pcmToWav(pcmBuffer, {
      sampleRate: 48000,
      channels: 2,
      bitDepth: 16,
    });

    const transcribedText = await this.transcriptionService.transcribe(wavBuffer);
    const cleanText = transcribedText.trim();

    if (cleanText.length > 0) {
      this.transcriptBuffer.add({
        userId,
        username,
        text: cleanText,
        timestamp: new Date(),
      });

      if (this.onTranscription) {
        this.onTranscription(username, cleanText);
      }
    }
  }
}
