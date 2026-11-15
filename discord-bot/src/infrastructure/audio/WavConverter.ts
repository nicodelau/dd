export interface WavOptions {
  sampleRate?: number;
  channels?: number;
  bitDepth?: number;
}

/**
 * Encapsulates raw PCM audio in a valid RIFF WAV buffer in-memory without external dependencies.
 */
export function pcmToWav(pcmData: Buffer, options?: WavOptions): Buffer {
  const sampleRate = options?.sampleRate || 48000;
  const channels = options?.channels || 2;
  const bitDepth = options?.bitDepth || 16;

  const byteRate = (sampleRate * channels * bitDepth) / 8;
  const blockAlign = (channels * bitDepth) / 8;
  const subChunk2Size = pcmData.length;
  const chunkSize = 36 + subChunk2Size;

  const header = Buffer.alloc(44);

  // RIFF Chunk Descriptor
  header.write('RIFF', 0);
  header.writeUInt32LE(chunkSize, 4);
  header.write('WAVE', 8);

  // "fmt " Sub-chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // SubChunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitDepth, 34);

  // "data" Sub-chunk
  header.write('data', 36);
  header.writeUInt32LE(subChunk2Size, 40);

  return Buffer.concat([header, pcmData]);
}
