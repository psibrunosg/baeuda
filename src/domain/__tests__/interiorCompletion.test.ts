import { describe, expect, it } from 'vitest';
import { AUDIO_MANIFEST, CONCEPT_AUDIO_KEY } from '../../content/audioManifest';
import { CONCEPT_VISUALS } from '../../content/lesson1Cafe';
import { getEffectiveCoins } from '../avatarShop';
import { ALL_CONCEPTS } from '../constellation';
import { INTERIOR_TASKS, recordInteriorCompletion } from '../interiorCompletion';
import { createInitialProfile } from '../learnerMemory';
import { buildSrsReviewPairs } from '../srsEngine';
import type { SpeechKey } from '../types';

const now = '2026-11-27T12:00:00.000Z';

describe('interior task completion', () => {
  it.each(Object.entries(INTERIOR_TASKS))('records %s once: memory, coins and streak', (key, task) => {
    const start = createInitialProfile();
    const done = recordInteriorCompletion(start, key as SpeechKey, now);

    for (const id of task!.concepts) {
      expect(done.constellation[id]?.stage, id).toBe('root');
      expect(ALL_CONCEPTS, id).toContain(id);
      expect(CONCEPT_VISUALS[id], id).toBeDefined();
      expect(AUDIO_MANIFEST[CONCEPT_AUDIO_KEY[id]].phrase.toLowerCase(), id).toContain(id);
    }
    expect(done.completedLessonIds).toContain(task!.activityId);
    expect(getEffectiveCoins(done)).toBe(getEffectiveCoins(start) + 20);
    expect(done.dailyStreak?.lastDate).toBe('2026-11-27');
    // the done line repeats when the NPC is tapped again
    expect(recordInteriorCompletion(done, key as SpeechKey, now)).toBe(done);
  });

  it('ignores lines that end no task', () => {
    const profile = createInitialProfile();
    expect(recordInteriorCompletion(profile, 'bakery_welcome', now)).toBe(profile);
  });

  it('brings the new words into spaced review', () => {
    const done = recordInteriorCompletion(createInitialProfile(), 'barber_done', now);
    expect(buildSrsReviewPairs(done).map((p) => p.label)).toEqual(
      expect.arrayContaining(['Comb', 'Scissors', 'Beard']),
    );
  });
});
