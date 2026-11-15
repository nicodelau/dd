import { TranscriptEntry } from '../core/models/TranscriptEntry.js';

export class TranscriptBuffer {
  private entries: TranscriptEntry[] = [];
  private readonly maxCapacity: number;

  constructor(maxCapacity: number = 200) {
    if (maxCapacity <= 0) {
      throw new Error('maxCapacity must be greater than 0');
    }
    this.maxCapacity = maxCapacity;
  }

  /**
   * Adds an entry to the rolling buffer. If buffer exceeds maxCapacity,
   * the oldest entry is dropped.
   */
  public add(entry: TranscriptEntry): void {
    if (!entry || !entry.text.trim()) {
      return;
    }
    this.entries.push(entry);
    if (this.entries.length > this.maxCapacity) {
      this.entries.shift();
    }
  }

  /**
   * Retrieves entries recorded within the last `durationSeconds`.
   * @param durationSeconds Time window in seconds from now.
   */
  public getRecent(durationSeconds: number): TranscriptEntry[] {
    if (durationSeconds <= 0) {
      return [];
    }
    const cutoff = Date.now() - durationSeconds * 1000;
    return this.entries.filter((e) => e.timestamp.getTime() >= cutoff);
  }

  /**
   * Returns a copy of all entries currently in buffer.
   */
  public getAll(): TranscriptEntry[] {
    return [...this.entries];
  }

  /**
   * Clears the buffer.
   */
  public clear(): void {
    this.entries = [];
  }
}
