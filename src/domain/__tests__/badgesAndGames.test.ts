import { describe, expect, it } from 'vitest';
import {
  countEarnedBadges,
  createConnectColumns,
  createMemoryCards,
  EVALUATION_DECKS,
  evaluateNeighborhoodBadges,
} from '../badgesAndGames';
import { createInitialProfile, recordStreetDiscovery } from '../learnerMemory';

describe('badgesAndGames', () => {
  it('evaluates all 14 neighborhood & profession badges and unlocks tiers from exploration', () => {
    let profile = createInitialProfile();
    const initial = evaluateNeighborhoodBadges(profile);
    expect(initial).toHaveLength(14);
    expect(countEarnedBadges(initial)).toBe(0);

    profile = recordStreetDiscovery(profile, 'world_bakery_bread');
    profile = recordStreetDiscovery(profile, 'world_bakery_oven');
    profile = recordStreetDiscovery(profile, 'world_tire_pump');

    const updated = evaluateNeighborhoodBadges(profile);
    const bakery = updated.find((b) => b.id === 'badge_baker');
    const mechanic = updated.find((b) => b.id === 'badge_mechanic');
    expect(bakery?.tier).toBe('gold');
    expect(mechanic?.tier).toBe('bronze');
    expect(countEarnedBadges(updated)).toBe(2);
  });

  it.each([
    ['interior_bakery', 'badge_baker'],
    ['interior_barber', 'badge_barber'],
    ['interior_bookshop', 'badge_bookshop'],
    ['interior_pharmacy', 'badge_pharmacy'],
    ['interior_pizzeria', 'badge_pizzeria'],
  ])('gives the whole badge for finishing %s', (activityId, badgeId) => {
    const profile = { ...createInitialProfile(), completedLessonIds: [activityId] };
    const earned = evaluateNeighborhoodBadges(profile).filter((b) => b.tier !== 'locked');
    expect(earned.map((b) => [b.id, b.tier, b.progress])).toEqual([[badgeId, 'gold', 2]]);
  });

  it('builds 12 matched icon/word memory cards and shuffled connect columns for all decks including professions', () => {
    expect(EVALUATION_DECKS.map((d) => d.id)).toContain('professions');
    expect(EVALUATION_DECKS.map((d) => d.id)).toContain('a2_directions');

    const memCards = createMemoryCards('professions', 13);
    expect(memCards).toHaveLength(12);
    expect(memCards.filter((c) => c.kind === 'icon')).toHaveLength(6);
    expect(memCards.filter((c) => c.kind === 'word')).toHaveLength(6);

    const cols = createConnectColumns('city_shops', 19);
    expect(cols.left).toHaveLength(6);
    expect(cols.right).toHaveLength(6);
    expect(new Set(cols.right.map((p) => p.id))).toEqual(new Set(cols.left.map((p) => p.id)));
  });
});
