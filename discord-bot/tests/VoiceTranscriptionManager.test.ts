import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from 'events';
import { PassThrough } from 'stream';
import { VoiceTranscriptionManager } from '../src/application/VoiceTranscriptionManager.js';
import { TranscriptBuffer } from '../src/application/TranscriptBuffer.js';
import { ITranscriptionService } from '../src/core/interfaces/ITranscriptionService.js';

describe('VoiceTranscriptionManager', () => {
  it('should handle user speech and append transcribed text to buffer', async () => {
    const transcriptBuffer = new TranscriptBuffer(100);
    const mockTranscriptionService: ITranscriptionService = {
      transcribe: vi.fn().mockResolvedValue('Veo un dragón'),
    };

    const manager = new VoiceTranscriptionManager({
      transcriptBuffer,
      transcriptionService: mockTranscriptionService,
      getUsername: (userId) => `User_${userId}`,
    });

    const mockSpeakingEmitter = new EventEmitter();
    const mockReceiver = {
      speaking: mockSpeakingEmitter,
      subscribe: vi.fn(),
    };

    manager.listenToReceiver(mockReceiver as any);

    // Prepare simulated audio stream
    const simulatedOpusStream = new PassThrough();
    mockReceiver.subscribe.mockReturnValue(simulatedOpusStream);

    // Simulate user 123 starting to speak
    mockSpeakingEmitter.emit('start', '123');
    expect(mockReceiver.subscribe).toHaveBeenCalledWith('123', expect.any(Object));

    // Emit some audio data (dummy PCM bytes passed through)
    // We trigger processUtterance directly or stream
    await manager.processAudioBuffer('123', 'Gandalf', Buffer.alloc(20000));

    expect(mockTranscriptionService.transcribe).toHaveBeenCalledOnce();
    const recent = transcriptBuffer.getRecent(10);
    expect(recent).toHaveLength(1);
    expect(recent[0].username).toBe('Gandalf');
    expect(recent[0].text).toBe('Veo un dragón');
  });

  it('should ignore empty transcription result', async () => {
    const transcriptBuffer = new TranscriptBuffer(100);
    const mockTranscriptionService: ITranscriptionService = {
      transcribe: vi.fn().mockResolvedValue(''),
    };

    const manager = new VoiceTranscriptionManager({
      transcriptBuffer,
      transcriptionService: mockTranscriptionService,
      getUsername: () => 'User',
    });

    await manager.processAudioBuffer('123', 'User', Buffer.alloc(10000));

    expect(transcriptBuffer.getAll()).toHaveLength(0);
  });
});
