import { describe, expect, it } from 'vitest';
import {
  CEFR_LEVEL_LABELS,
  CEFR_LEVEL_ORDER,
  CURRICULUM_LEVELS,
  CURRICULUM_MAP,
  CURRICULUM_MILESTONES,
  DIALOGUE_CONCEPTS,
  INTERIOR_CONCEPTS,
  PRACTICE_UNIT_CONCEPTS,
  SESSION_BUCKET_TARGET_RATIO,
  STORY_CONCEPTS,
  getCefrLabel,
  getCurriculumLevel,
  getLevelForConcept,
  getLevelsForInterior,
  getMilestoneForLevel,
  getNextCefrLevel,
} from '../curriculumMap';
import type { InteriorId } from '../types';

describe('curriculumMap', () => {
  it('defines all four CEFR levels Pre-A1 -> B1 in monotonic order with complete specs', () => {
    expect(CEFR_LEVEL_ORDER).toEqual(['pre_a1', 'a1', 'a2', 'b1']);
    expect(CURRICULUM_LEVELS).toHaveLength(4);

    CURRICULUM_LEVELS.forEach((spec, index) => {
      expect(spec.level).toBe(CEFR_LEVEL_ORDER[index]);
      expect(spec.order).toBe(index);
      expect(spec.label).toBe(CEFR_LEVEL_LABELS[spec.level]);
      expect(spec.cognitiveStage.length).toBeGreaterThan(0);
      expect(spec.cognitiveStageEn.length).toBeGreaterThan(0);
      expect(spec.communicativeActs.length).toBeGreaterThan(0);
      expect(spec.focusOnForm.length).toBeGreaterThan(0);
      expect(spec.interiors.length).toBeGreaterThan(0);
      expect(spec.shops.length).toBeGreaterThan(0);
      expect(spec.coreConcepts.length).toBeGreaterThan(0);
    });
  });

  it('matches the 60/25/15 pedagogical session rhythm ratios', () => {
    expect(SESSION_BUCKET_TARGET_RATIO).toEqual({
      spiral: 0.6,
      retention: 0.25,
      application: 0.15,
    });
    const total =
      SESSION_BUCKET_TARGET_RATIO.spiral +
      SESSION_BUCKET_TARGET_RATIO.retention +
      SESSION_BUCKET_TARGET_RATIO.application;
    expect(total).toBeCloseTo(1, 5);
  });

  it('wires all four Neighborhood Milestones with escalating readiness criteria', () => {
    const milestones = [
      CURRICULUM_MILESTONES.pre_a1_graduation_shift,
      CURRICULUM_MILESTONES.a1_market_fair_day,
      CURRICULUM_MILESTONES.a2_festival_night,
      CURRICULUM_MILESTONES.b1_neighborhood_assembly,
    ];

    expect(milestones.map((m) => m.level)).toEqual(['pre_a1', 'a1', 'a2', 'b1']);
    expect(CURRICULUM_MILESTONES.pre_a1_graduation_shift.status).toBe('playable');

    for (let i = 1; i < milestones.length; i += 1) {
      expect(milestones[i].readinessCriteria.minConceptsAtLeastRoot).toBeGreaterThan(
        milestones[i - 1].readinessCriteria.minConceptsAtLeastRoot,
      );
    }

    for (const level of CEFR_LEVEL_ORDER) {
      expect(getMilestoneForLevel(level)).toBe(CURRICULUM_MAP[level].milestone);
      expect(getMilestoneForLevel(level).level).toBe(level);
    }
  });

  it('provides non-empty concept mappings for every interior, practice unit, story, and dialogue', () => {
    const interiors: InteriorId[] = ['cafe', 'market', 'plaza', 'pizzeria', 'pharmacy'];
    for (const interior of interiors) {
      expect(INTERIOR_CONCEPTS[interior].length).toBeGreaterThan(0);
    }

    expect(Object.keys(PRACTICE_UNIT_CONCEPTS)).toEqual([
      'unit_1_cafe',
      'unit_2_bakery_market',
      'unit_3_pizzeria_pharmacy',
      'unit_4_city_a2',
    ]);
    for (const concepts of Object.values(PRACTICE_UNIT_CONCEPTS)) {
      expect(concepts.length).toBeGreaterThan(0);
    }

    expect(Object.keys(STORY_CONCEPTS)).toEqual([
      'story_missing_cake',
      'story_runaway_puppy',
      'story_lost_tourist',
    ]);
    for (const concepts of Object.values(STORY_CONCEPTS)) {
      expect(concepts.length).toBeGreaterThan(0);
    }

    expect(Object.keys(DIALOGUE_CONCEPTS)).toEqual([
      'cafe',
      'pharmacy',
      'pizzeria',
      'barber',
      'postbank',
    ]);
    for (const concepts of Object.values(DIALOGUE_CONCEPTS)) {
      expect(concepts.length).toBeGreaterThan(0);
    }
  });

  it('resolves level helpers accurately across Pre-A1 -> B1', () => {
    expect(getCurriculumLevel('a2')).toBe(CURRICULUM_MAP.a2);
    expect(getCefrLabel('pre_a1')).toBe('Pre-A1');
    expect(getCefrLabel('b1')).toBe('B1');

    expect(getNextCefrLevel('pre_a1')).toBe('a1');
    expect(getNextCefrLevel('a1')).toBe('a2');
    expect(getNextCefrLevel('a2')).toBe('b1');
    expect(getNextCefrLevel('b1')).toBeNull();

    expect(getLevelForConcept('coffee')).toBe('pre_a1');
    expect(getLevelForConcept('plate')).toBe('a1');
    expect(getLevelForConcept('music')).toBe('a1');

    expect(getLevelsForInterior('cafe')).toEqual(['pre_a1', 'a1', 'a2', 'b1']);
    expect(getLevelsForInterior('pizzeria')).toEqual(['a1', 'a2', 'b1']);
    expect(getLevelsForInterior('pharmacy')).toEqual(['a1', 'a2', 'b1']);
  });
});
