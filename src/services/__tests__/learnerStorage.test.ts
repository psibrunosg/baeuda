import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyLesson1Outcome, createInitialProfile } from '../../domain/learnerMemory';
import { loadProfile, resetProfile, saveProfile, STORAGE_KEY } from '../learnerStorage';

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k: string) => map.get(k) ?? null,
    key: (i: number) => Array.from(map.keys())[i] ?? null,
    removeItem: (k: string) => {
      map.delete(k);
    },
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
  };
}

describe('learnerStorage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('saves and restores a valid LearnerProfile', () => {
    const storage = createMemoryStorage();
    const saved = applyLesson1Outcome(createInitialProfile(), {
      preferredDrink: 'hot_coffee',
      oralComfort: 'vocal',
      hintedConcepts: [],
      vocalConcepts: ['cup', 'coffee', 'hot'],
      nowIso: '2026-11-19T14:00:00.000Z',
    });

    saveProfile(saved, storage);
    const loaded = loadProfile(storage);
    expect(loaded).toEqual(saved);
  });

  it('recovers cleanly with an initial profile on corrupted JSON or mismatched schemaVersion', () => {
    const storage = createMemoryStorage();
    storage.setItem(STORAGE_KEY, '{not-valid-json');
    expect(loadProfile(storage)).toEqual(createInitialProfile());

    storage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 99 }));
    expect(loadProfile(storage)).toEqual(createInitialProfile());

    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        immersionSeconds: 0,
        completedLessonIds: [],
        locations: null,
        constellation: null,
      }),
    );
    expect(loadProfile(storage)).toEqual(createInitialProfile());
  });

  it('resets stored profile', () => {
    const storage = createMemoryStorage();
    saveProfile(createInitialProfile(), storage);
    resetProfile(storage);
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('falls back to createInitialProfile when window.localStorage getter throws SecurityError', () => {
    const restrictedWindow = {};
    Object.defineProperty(restrictedWindow, 'localStorage', {
      get() {
        throw new DOMException('Blocked in sandboxed context', 'SecurityError');
      },
    });
    vi.stubGlobal('window', restrictedWindow);

    expect(() => loadProfile()).not.toThrow();
    expect(loadProfile()).toEqual(createInitialProfile());
    expect(() => saveProfile(createInitialProfile())).not.toThrow();
    expect(() => resetProfile()).not.toThrow();
  });
});
