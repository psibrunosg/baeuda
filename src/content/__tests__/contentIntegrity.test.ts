import { describe, expect, it } from 'vitest';
import { LESSON1_CONCEPTS } from '../../domain/constellation';
import { AUDIO_MANIFEST, CONCEPT_AUDIO_KEY, type SpeechKey } from '../audioManifest';
import {
  CONCEPT_VISUALS,
  CONTRAST_DEMO_BEATS,
  CONTRAST_ROUNDS,
  COUNTER_DEMO_BEATS,
  DRINK_TO_CONCEPTS,
  LESSON1_CAFE_SCRIPT,
  POUR_ROUNDS,
  PROP_RECAST_AUDIO,
  PROP_TO_DRINK,
  TPR_ROUNDS,
} from '../lesson1Cafe';

describe('content integrity', () => {
  it('ensures every audio manifest entry has a valid path, positive duration, and sorted viseme cues', () => {
    const entries = Object.entries(AUDIO_MANIFEST);
    expect(entries.length).toBeGreaterThanOrEqual(35);

    for (const [key, line] of entries) {
      expect(line.src).toBe(`/audio/lesson1/${key}.mp3`);
      expect(line.phrase.length).toBeGreaterThan(0);
      expect(line.fallbackDurationMs).toBeGreaterThan(300);
      for (let i = 1; i < line.cues.length; i++) {
        expect(line.cues[i].at).toBeGreaterThanOrEqual(line.cues[i - 1].at);
      }
      expect(line.cues[line.cues.length - 1]?.viseme).toBeNull();
    }
  });

  it('maps every Lesson 1 concept to an audio key and visual metadata', () => {
    for (const concept of LESSON1_CONCEPTS) {
      const audioKey = CONCEPT_AUDIO_KEY[concept];
      expect(AUDIO_MANIFEST[audioKey]).toBeDefined();
      expect(CONCEPT_VISUALS[concept]).toBeDefined();
      expect(CONCEPT_VISUALS[concept].color).toMatch(/^#/);
    }
  });

  it('validates all speech keys referenced by Lesson 1 script exist in AUDIO_MANIFEST', () => {
    const referenced: SpeechKey[] = [
      ...COUNTER_DEMO_BEATS.map((b) => b.audioKey),
      ...TPR_ROUNDS.flatMap((r) => [r.promptAudio, r.thanksAudio, r.helpAudio]),
      ...CONTRAST_DEMO_BEATS.map((b) => b.audioKey),
      ...CONTRAST_ROUNDS.flatMap((r) => [r.promptAudio, r.thanksAudio, r.helpAudio]),
      ...POUR_ROUNDS.flatMap((r) => [r.promptAudio, r.doneAudio, r.helpAudio]),
      ...Object.values(PROP_RECAST_AUDIO),
    ];

    for (const key of referenced) {
      expect(AUDIO_MANIFEST[key]).toBeDefined();
    }

    expect(DRINK_TO_CONCEPTS.hot_coffee).toEqual(['cup', 'coffee', 'hot']);
    expect(DRINK_TO_CONCEPTS.cold_water).toEqual(['cup', 'water', 'cold']);
    expect(DRINK_TO_CONCEPTS.cold_coffee).toEqual(['cup', 'coffee', 'cold']);

    expect(LESSON1_CAFE_SCRIPT).toEqual({
      counterDemoBeats: COUNTER_DEMO_BEATS,
      tprRounds: TPR_ROUNDS,
      contrastDemoBeats: CONTRAST_DEMO_BEATS,
      contrastRounds: CONTRAST_ROUNDS,
      pourRounds: POUR_ROUNDS,
      drinkToConcepts: DRINK_TO_CONCEPTS,
      propToDrink: PROP_TO_DRINK,
      propRecastAudio: PROP_RECAST_AUDIO,
    });
  });
});
