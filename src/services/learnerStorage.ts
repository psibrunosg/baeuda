import { createInitialProfile } from '../domain/learnerMemory';
import type { LearnerProfile } from '../domain/types';

export const STORAGE_KEY = 'baeuda.learnerProfile.v1';

function resolveStorage(storage?: Storage): Storage | null {
  if (storage) return storage;
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

function isValidProfile(value: unknown): value is LearnerProfile {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<LearnerProfile>;
  return (
    candidate.schemaVersion === 1 &&
    typeof candidate.immersionSeconds === 'number' &&
    Number.isFinite(candidate.immersionSeconds) &&
    Array.isArray(candidate.completedLessonIds) &&
    candidate.locations !== undefined &&
    candidate.locations !== null &&
    typeof candidate.locations === 'object' &&
    candidate.constellation !== undefined &&
    candidate.constellation !== null &&
    typeof candidate.constellation === 'object'
  );
}

export function loadProfile(storage?: Storage): LearnerProfile {
  const store = resolveStorage(storage);
  if (!store) return createInitialProfile();
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return createInitialProfile();
    const parsed: unknown = JSON.parse(raw);
    if (!isValidProfile(parsed)) return createInitialProfile();
    return parsed;
  } catch {
    return createInitialProfile();
  }
}

export function saveProfile(profile: LearnerProfile, storage?: Storage): void {
  const store = resolveStorage(storage);
  if (!store) return;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore quota/private-mode storage write failures gracefully.
  }
}

export function resetProfile(storage?: Storage): void {
  const store = resolveStorage(storage);
  if (!store) return;
  try {
    store.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage removal errors.
  }
}
