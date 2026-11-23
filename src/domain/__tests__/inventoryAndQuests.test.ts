import { describe, expect, it } from 'vitest';
import {
  canDeliverQuest,
  CITY_QUESTS,
  getActiveQuest,
  INVENTORY_CATALOG,
} from '../inventoryAndQuests';

describe('inventoryAndQuests', () => {
  it('tracks active NPC fetch quests and checks inventory delivery readiness', () => {
    const first = getActiveQuest([]);
    expect(first?.id).toBe('quest_leo_bread');
    expect(canDeliverQuest(first, [])).toBe(false);
    expect(canDeliverQuest(first, ['bread'])).toBe(true);

    const second = getActiveQuest(['quest_leo_bread']);
    expect(second?.id).toBe('quest_mechanic_banana');
    expect(canDeliverQuest(second, ['banana'])).toBe(true);

    const done = getActiveQuest(CITY_QUESTS.map((q) => q.id));
    expect(done).toBeNull();
    expect(INVENTORY_CATALOG.bread.icon).toBe('🥖');
  });
});
