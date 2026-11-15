import { describe, it, expect, beforeEach } from 'vitest';
import { TranscriptBuffer } from '../src/application/TranscriptBuffer.js';
import { TranscriptEntry } from '../src/core/models/TranscriptEntry.js';

describe('TranscriptBuffer', () => {
  let buffer: TranscriptBuffer;

  beforeEach(() => {
    buffer = new TranscriptBuffer(50); // max 50 entries
  });

  it('should start empty', () => {
    expect(buffer.getAll()).toHaveLength(0);
    expect(buffer.getRecent(60)).toHaveLength(0);
  });

  it('should add entries and retrieve all of them', () => {
    const entry1: TranscriptEntry = {
      userId: 'user1',
      username: 'Gandalf',
      text: 'No pasarás',
      timestamp: new Date(),
    };
    const entry2: TranscriptEntry = {
      userId: 'user2',
      username: 'Frodo',
      text: 'Tengo el anillo',
      timestamp: new Date(),
    };

    buffer.add(entry1);
    buffer.add(entry2);

    const all = buffer.getAll();
    expect(all).toHaveLength(2);
    expect(all[0].username).toBe('Gandalf');
    expect(all[1].username).toBe('Frodo');
  });

  it('should filter entries by duration in seconds', () => {
    const now = Date.now();
    const oldEntry: TranscriptEntry = {
      userId: 'user1',
      username: 'Gandalf',
      text: 'Mensaje antiguo',
      timestamp: new Date(now - 120 * 1000), // 2 minutes ago
    };
    const recentEntry: TranscriptEntry = {
      userId: 'user2',
      username: 'Aragorn',
      text: 'Por la comarca',
      timestamp: new Date(now - 10 * 1000), // 10 seconds ago
    };

    buffer.add(oldEntry);
    buffer.add(recentEntry);

    // Only within the last 60 seconds
    const recent = buffer.getRecent(60);
    expect(recent).toHaveLength(1);
    expect(recent[0].username).toBe('Aragorn');
  });

  it('should enforce max capacity by dropping oldest entries', () => {
    const smallBuffer = new TranscriptBuffer(3);
    for (let i = 1; i <= 5; i++) {
      smallBuffer.add({
        userId: `u${i}`,
        username: `User ${i}`,
        text: `Message ${i}`,
        timestamp: new Date(),
      });
    }

    const all = smallBuffer.getAll();
    expect(all).toHaveLength(3);
    expect(all[0].username).toBe('User 3');
    expect(all[2].username).toBe('User 5');
  });

  it('should clear all entries', () => {
    buffer.add({
      userId: 'u1',
      username: 'Legolas',
      text: 'Un desvío rojo se alza',
      timestamp: new Date(),
    });

    expect(buffer.getAll()).toHaveLength(1);
    buffer.clear();
    expect(buffer.getAll()).toHaveLength(0);
  });
});
