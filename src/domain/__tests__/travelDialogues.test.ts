import { describe, expect, it } from 'vitest';
import { getDialogueScenario, TRAVEL_DIALOGUE_SCENARIOS } from '../travelDialogues';

describe('travelDialogues', () => {
  it('provides 5 complete 3-turn everyday travel conversation scenarios', () => {
    expect(TRAVEL_DIALOGUE_SCENARIOS).toHaveLength(5);
    for (const scenario of TRAVEL_DIALOGUE_SCENARIOS) {
      expect(scenario.turns).toHaveLength(3);
      for (const turn of scenario.turns) {
        expect(turn.npcLine.length).toBeGreaterThan(5);
        expect(turn.options.length).toBeGreaterThanOrEqual(2);
      }
    }
    expect(getDialogueScenario('pharmacy').npcName).toBe('Pharmacist');
    expect(getDialogueScenario('postbank').cefrTag).toBe('A2');
  });
});
