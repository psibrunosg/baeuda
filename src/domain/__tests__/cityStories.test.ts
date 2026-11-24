import { describe, expect, it } from 'vitest';
import { CITY_STORIES } from '../cityStories';

describe('cityStories (Module C)', () => {
  it('provides 3 CEFR-graded interactive neighborhood episodes with comprehension questions', () => {
    expect(CITY_STORIES).toHaveLength(3);
    expect(CITY_STORIES.map((s) => s.cefrTag)).toEqual(['Pre-A1', 'A1', 'A2']);

    for (const story of CITY_STORIES) {
      const questions = story.steps.filter((s) => s.question && s.choices && s.choices.length >= 2);
      expect(questions.length).toBeGreaterThanOrEqual(2);
      for (const q of questions) {
        expect(q.choices?.some((c) => c.isCorrect)).toBe(true);
      }
    }
  });
});
