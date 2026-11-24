import { describe, expect, it } from 'vitest';
import {
  buildMistakeExercises,
  checkPracticeAnswer,
  computeLessonRewards,
  evaluateSpokenWords,
  PRACTICE_UNITS,
} from '../practiceLessons';

describe('practiceLessons (Lesson Engine 2.0)', () => {
  it('defines 4 CEFR-aligned units mixing word_bank, fill_blank, listen_choose and speak_aloud', () => {
    expect(PRACTICE_UNITS).toHaveLength(4);
    for (const unit of PRACTICE_UNITS) {
      const kinds = new Set(unit.exercises.map((e) => e.kind));
      expect(kinds.has('word_bank')).toBe(true);
      expect(kinds.has('fill_blank')).toBe(true);
      expect(kinds.has('listen_choose')).toBe(true);
      expect(kinds.has('speak_aloud')).toBe(true);
    }
  });

  it('validates word_bank, fill_blank, and speak_aloud with word-level feedback', () => {
    const wb = PRACTICE_UNITS[0].exercises[0];
    expect(checkPracticeAnswer(wb, 'One hot coffee please')).toBe(true);
    expect(checkPracticeAnswer(wb, 'One cold coffee please')).toBe(false);

    const sp = PRACTICE_UNITS[0].exercises[3];
    const evalRes = evaluateSpokenWords(sp.targetAnswer, 'thank you for the hot coffee');
    expect(evalRes.matchRatio).toBe(1);
    expect(evalRes.words.every((w) => w.matched)).toBe(true);
    expect(checkPracticeAnswer(sp, 'Thank you for hot coffee')).toBe(true);
  });

  it('builds a mistakes review queue and calculates accuracy rewards', () => {
    const mistakes = buildMistakeExercises(['u1_wb_coffee', 'u4_fb_past']);
    expect(mistakes).toHaveLength(2);
    expect(mistakes.map((m) => m.id)).toEqual(['u1_wb_coffee', 'u4_fb_past']);

    expect(computeLessonRewards(4, 4)).toEqual({ accuracy: 100, coinsEarned: 20, xpEarned: 55 });
    expect(computeLessonRewards(4, 2)).toEqual({ accuracy: 50, coinsEarned: 10, xpEarned: 25 });
  });
});
