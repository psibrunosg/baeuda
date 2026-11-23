import { createInitialProfile } from '../domain/learnerMemory';
import type { LearnerProfile } from '../domain/types';

export const STORAGE_KEY = 'baeuda.learnerProfile.v1';

function resolveStorage(storage?: Storage): Storage | null {
  if (storage) return storage;
  try {
    if (typeof window !== 'undefined') {
      return window.localStorage ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

function sanitizeStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  return value.filter((v): v is string => typeof v === 'string');
}

function normalizeProfile(value: unknown): LearnerProfile | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<LearnerProfile>;
  if (
    candidate.schemaVersion !== 1 ||
    typeof candidate.immersionSeconds !== 'number' ||
    !Number.isFinite(candidate.immersionSeconds) ||
    !Array.isArray(candidate.completedLessonIds) ||
    !candidate.locations ||
    typeof candidate.locations !== 'object' ||
    !candidate.constellation ||
    typeof candidate.constellation !== 'object'
  ) {
    return null;
  }

  const base = createInitialProfile();
  return {
    ...base,
    ...candidate,
    completedLessonIds: sanitizeStringArray(candidate.completedLessonIds, base.completedLessonIds),
    completedCafeCycles: Array.isArray(candidate.completedCafeCycles)
      ? (candidate.completedCafeCycles.filter((v): v is NonNullable<LearnerProfile['completedCafeCycles']>[number] => typeof v === 'string'))
      : base.completedCafeCycles,
    streetDiscoveries: sanitizeStringArray(candidate.streetDiscoveries, []),
    inventoryIds: sanitizeStringArray(candidate.inventoryIds, []),
    completedQuestIds: sanitizeStringArray(candidate.completedQuestIds, []),
    unlockedStyleIds: candidate.unlockedStyleIds
      ? sanitizeStringArray(candidate.unlockedStyleIds, [])
      : undefined,
    coins:
      typeof candidate.coins === 'number' && Number.isFinite(candidate.coins)
        ? candidate.coins
        : undefined,
    locations: {
      ...base.locations,
      ...candidate.locations,
    },
    constellation: candidate.constellation,
  };
}

export function loadProfile(storage?: Storage): LearnerProfile {
  const store = resolveStorage(storage);
  if (!store) return createInitialProfile();
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return createInitialProfile();
    const parsed: unknown = JSON.parse(raw);
    return normalizeProfile(parsed) ?? createInitialProfile();
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
