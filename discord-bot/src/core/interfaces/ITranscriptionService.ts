export interface ITranscriptionService {
  /**
   * Transcribe a WAV/PCM audio buffer into text.
   * @param audioBuffer WAV/PCM audio stream in binary format.
   * @returns Transcribed text.
   */
  transcribe(audioBuffer: Buffer): Promise<string>;
}
