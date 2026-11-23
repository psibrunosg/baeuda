import { describe, expect, it } from 'vitest';
import { checkCuriosityAnswer, CURIOSITY_CATALOG } from '../curiosityCatalog';

describe('curiosityCatalog', () => {
  it('contains 6 rich fruit crates and 6 neighborhood professions', () => {
    const items = Object.values(CURIOSITY_CATALOG);
    expect(items.filter((i) => i.category === 'fruit')).toHaveLength(6);
    expect(items.filter((i) => i.category === 'profession')).toHaveLength(6);
  });

  it('validates typed or spoken English answers flexibly', () => {
    expect(checkCuriosityAnswer(CURIOSITY_CATALOG.fruit_strawberry, 'Strawberry!')).toBe(true);
    expect(checkCuriosityAnswer(CURIOSITY_CATALOG.fruit_banana, 'a yellow banana')).toBe(true);
    expect(checkCuriosityAnswer(CURIOSITY_CATALOG.job_mechanic, 'Mechanic')).toBe(true);
    expect(checkCuriosityAnswer(CURIOSITY_CATALOG.fruit_apple, 'orange')).toBe(false);
    expect(checkCuriosityAnswer(CURIOSITY_CATALOG.fruit_apple, '   ')).toBe(false);
  });
});
