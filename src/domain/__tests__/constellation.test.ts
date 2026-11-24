import { describe, expect, it } from 'vitest';
import {
  LESSON1_CONCEPTS,
  LESSON1_EDGES,
  canPromoteToFluent,
  getContrastPartner,
  promoteStage,
  upsertConceptNode,
} from '../constellation';
import {
  applyLesson1Outcome,
  applySrsReviewOutcome,
  createInitialProfile,
  promoteConceptToVoice,
  recordPedagogicalEvidence,
} from '../learnerMemory';

describe('constellation', () => {
  it('promotes stages monotonically and never downgrades', () => {
    expect(promoteStage(undefined, 'seed')).toBe('seed');
    expect(promoteStage('seed', 'root')).toBe('root');
    expect(promoteStage('root', 'voice')).toBe('voice');
    expect(promoteStage('voice', 'fluent')).toBe('fluent');
    expect(promoteStage('fluent', 'voice')).toBe('fluent');
    expect(promoteStage('fluent', 'root')).toBe('fluent');
    expect(promoteStage('fluent', 'seed')).toBe('fluent');
    expect(promoteStage('voice', 'seed')).toBe('voice');
    expect(promoteStage('voice', 'root')).toBe('voice');
    expect(promoteStage('root', 'seed')).toBe('root');
  });

  it('promotes voice concepts to fluent only on hintless success in a distinct new context', () => {
    const voiceInCafe = upsertConceptNode(
      {},
      'coffee',
      'voice',
      false,
      'cafe',
      '2026-11-20T10:00:00.000Z',
      { contextId: 'cafe_c1_drinks', mode: 'interior_3d' },
    );

    // Same context does not promote to fluent
    expect(canPromoteToFluent(voiceInCafe.coffee, 'cafe_c1_drinks', false, true)).toBe(false);
    // Hint or failure blocks promotion
    expect(canPromoteToFluent(voiceInCafe.coffee, 'story_missing_cake', true, true)).toBe(false);
    expect(canPromoteToFluent(voiceInCafe.coffee, 'story_missing_cake', false, false)).toBe(false);

    // Distinct context without hint promotes voice -> fluent and records contextsSeen
    const fluentNode = upsertConceptNode(
      voiceInCafe,
      'coffee',
      'root',
      false,
      'cafe',
      '2026-11-24T10:00:00.000Z',
      { contextId: 'story_missing_cake', mode: 'story' },
    );
    expect(fluentNode.coffee?.stage).toBe('fluent');
    expect(fluentNode.coffee?.contextsSeen).toEqual(['cafe_c1_drinks', 'story_missing_cake']);
    expect(fluentNode.coffee?.lastMode).toBe('story');

    // Root concept does not jump straight to fluent even in a new context
    const rootNode = upsertConceptNode(
      {},
      'water',
      'root',
      false,
      'cafe',
      '2026-11-20T10:00:00.000Z',
      { contextId: 'cafe_c1_drinks', mode: 'interior_3d' },
    );
    expect(canPromoteToFluent(rootNode.water, 'pharmacy_counter', false, true)).toBe(false);
  });

  it('upserts concept nodes preserving higher stage and updating lastContactAt', () => {
    const first = upsertConceptNode({}, 'coffee', 'voice', false, 'cafe', '2026-11-19T10:00:00.000Z');
    const second = upsertConceptNode(first, 'coffee', 'seed', true, 'cafe', '2026-11-20T10:00:00.000Z');

    expect(second.coffee).toEqual({
      id: 'coffee',
      stage: 'voice',
      neededHint: true,
      originLocation: 'cafe',
      lastContactAt: '2026-11-20T10:00:00.000Z',
    });
  });

  it('defines all 6 Lesson 1 concepts and the hot <-> cold contrast edge', () => {
    expect(LESSON1_CONCEPTS).toEqual(['cup', 'coffee', 'water', 'hot', 'cold', 'pour']);
    expect(getContrastPartner('hot')).toBe('cold');
    expect(getContrastPartner('cold')).toBe('hot');
    expect(getContrastPartner('cup')).toBeNull();
    expect(LESSON1_EDGES.some((e) => e.kind === 'contrast' && e.from === 'hot' && e.to === 'cold')).toBe(true);
  });
});

describe('learnerMemory', () => {
  it('initializes a fresh profile with cafe discovered and empty constellation', () => {
    const profile = createInitialProfile();
    expect(profile.schemaVersion).toBe(1);
    expect(profile.preferredDrink).toBeNull();
    expect(profile.oralComfort).toBe('unknown');
    expect(profile.locations).toEqual({
      cafe: 'discovered',
      market: 'unexplored',
      plaza: 'unexplored',
    });
    expect(profile.constellation).toEqual({});
  });

  it('commits Lesson 1 outcome, marks cafe familiar, and sets concept stages correctly', () => {
    const initial = createInitialProfile();
    const updated = applyLesson1Outcome(initial, {
      preferredDrink: 'cold_coffee',
      oralComfort: 'vocal',
      hintedConcepts: ['water'],
      vocalConcepts: ['cup', 'coffee', 'cold'],
      nowIso: '2026-11-19T12:00:00.000Z',
    });

    expect(updated.preferredDrink).toBe('cold_coffee');
    expect(updated.oralComfort).toBe('vocal');
    expect(updated.locations.cafe).toBe('familiar');
    expect(updated.completedLessonIds).toContain('lesson1_cafe');
    expect(updated.constellation.cup?.stage).toBe('voice');
    expect(updated.constellation.coffee?.stage).toBe('voice');
    expect(updated.constellation.cold?.stage).toBe('voice');
    expect(updated.constellation.water?.stage).toBe('seed');
    expect(updated.constellation.hot?.stage).toBe('root');
    expect(updated.constellation.pour?.stage).toBe('root');
  });

  it('promotes a single concept to voice via Quick Echo in Sensory Card', () => {
    const profile = applyLesson1Outcome(createInitialProfile(), {
      preferredDrink: 'hot_coffee',
      oralComfort: 'silent',
      hintedConcepts: ['pour'],
      vocalConcepts: [],
      nowIso: '2026-11-19T12:00:00.000Z',
    });

    const promoted = promoteConceptToVoice(profile, 'pour', '2026-11-19T12:05:00.000Z');
    expect(promoted.constellation.pour?.stage).toBe('voice');
    expect(promoted.oralComfort).toBe('vocal');
  });

  it('records unified pedagogical evidence across interior_3d, practice, story, talk, and srs modes', () => {
    let profile = createInitialProfile();

    // 1. Voice production in Talk mode
    profile = recordPedagogicalEvidence(profile, {
      mode: 'talk',
      contextId: 'talk_cafe',
      concepts: ['coffee', 'hot'],
      producedOutput: true,
      completedDialogueId: 'cafe',
      nowIso: '2026-11-24T10:00:00.000Z',
    });
    expect(profile.constellation.coffee?.stage).toBe('voice');
    expect(profile.constellation.coffee?.contextsSeen).toEqual(['talk_cafe']);
    expect(profile.completedDialogueIds).toContain('cafe');
    expect(profile.oralComfort).toBe('vocal');
    expect(profile.recentSessionBuckets).toEqual(['application']);

    // 2. Hintless transfer in Pizzeria interior promotes hot -> fluent with >= 168h interval
    profile = recordPedagogicalEvidence(profile, {
      mode: 'interior_3d',
      contextId: 'pizzeria_kitchen',
      interiorId: 'pizzeria',
      concepts: ['hot', 'plate'],
      nowIso: '2026-11-24T11:00:00.000Z',
    });
    expect(profile.constellation.hot?.stage).toBe('fluent');
    expect(profile.constellation.hot?.intervalHours).toBeGreaterThanOrEqual(168);
    expect(profile.constellation.hot?.contextsSeen).toEqual(['talk_cafe', 'pizzeria_kitchen']);
    expect(profile.completedInteriors).toContain('pizzeria');
    expect(profile.streetDiscoveries).toContain('world_pizzeria_kitchen');
    expect(profile.recentSessionBuckets).toEqual(['application', 'spiral']);

    // 3. Practice unit & Story completions update their respective lists
    profile = recordPedagogicalEvidence(profile, {
      mode: 'practice',
      contextId: 'unit_1_cafe',
      concepts: ['coffee', 'cake'],
      completedActivityId: 'unit_1_cafe',
      nowIso: '2026-11-24T11:30:00.000Z',
    });
    expect(profile.completedPracticeUnitIds).toContain('unit_1_cafe');
    expect(profile.constellation.coffee?.stage).toBe('fluent');

    profile = recordPedagogicalEvidence(profile, {
      mode: 'story',
      contextId: 'story_missing_cake',
      concepts: ['cake', 'sweet'],
      completedActivityId: 'story_missing_cake',
      nowIso: '2026-11-24T12:00:00.000Z',
    });
    expect(profile.completedStoryIds).toContain('story_missing_cake');

    // 4. Failed attempt does not promote to fluent and resets intervalHours to 4
    const failed = recordPedagogicalEvidence(profile, {
      mode: 'practice',
      contextId: 'mistakes_lab',
      concepts: ['cake'],
      succeeded: false,
      nowIso: '2026-11-24T12:15:00.000Z',
    });
    expect(failed.constellation.cake?.neededHint).toBe(true);
    expect(failed.constellation.cake?.intervalHours).toBe(4);
    expect(failed.recentSessionBuckets?.at(-1)).toBe('retention');

    // 5. SRS review preserves fluent stage and keeps long interval
    const afterSrs = applySrsReviewOutcome(profile, ['hot'], '2026-11-25T12:00:00.000Z');
    expect(afterSrs.constellation.hot?.stage).toBe('fluent');
    expect(afterSrs.constellation.hot?.intervalHours).toBeGreaterThanOrEqual(168);
  });
});
