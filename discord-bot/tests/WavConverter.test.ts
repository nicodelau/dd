import { describe, it, expect } from 'vitest';
import { pcmToWav } from '../src/infrastructure/audio/WavConverter.js';

describe('WavConverter', () => {
  it('should generate a valid WAV header for a given PCM buffer', () => {
    // 48000 samples/sec * 2 channels * 2 bytes/sample * 1 sec = 192000 bytes
    const dummyPcm = Buffer.alloc(192000);
    const wavBuffer = pcmToWav(dummyPcm, {
      sampleRate: 48000,
      channels: 2,
      bitDepth: 16,
    });

    // Total length = 44 bytes header + 192000 bytes data
    expect(wavBuffer.length).toBe(44 + 192000);

    // Verify RIFF identifier
    expect(wavBuffer.toString('utf8', 0, 4)).toBe('RIFF');
    // Verify WAVE identifier
    expect(wavBuffer.toString('utf8', 8, 12)).toBe('WAVE');
    // Verify fmt chunk
    expect(wavBuffer.toString('utf8', 12, 16)).toBe('fmt ');
    // Verify data chunk
    expect(wavBuffer.toString('utf8', 36, 40)).toBe('data');

    // Verify data length in header
    const dataSize = wavBuffer.readUInt32LE(40);
    expect(dataSize).toBe(192000);
  });

  it('should handle empty buffer gracefully', () => {
    const emptyPcm = Buffer.alloc(0);
    const wavBuffer = pcmToWav(emptyPcm);
    expect(wavBuffer.length).toBe(44);
    expect(wavBuffer.readUInt32LE(40)).toBe(0);
  });
});
