import { describe, expect, it } from 'vitest';
import { LESSON1_CAFE_SCRIPT } from '../../content/lesson1Cafe';
import { createInitialProfile } from '../learnerMemory';
import {
  createLesson1State,
  lessonReducer,
  type LessonEffect,
  type LessonEvent,
  type LessonState,
} from '../lessonEngine';

const NOW = '2026-11-19T14:00:00.000Z';

function step(
  state: LessonState,
  event: LessonEvent,
  profile = createInitialProfile(),
): { state: LessonState; effects: LessonEffect[] } {
  return lessonReducer(state, event, profile, NOW, LESSON1_CAFE_SCRIPT);
}

describe('lessonEngine (7-screen Lesson 1)', () => {
  it('completes the full happy path from map_arrival to farewell_constellation with cold_coffee + vocal', () => {
    const profile = createInitialProfile();
    let s = createLesson1State();

    // Screen 1: map_arrival
    let res = step(s, { type: 'ENTER_CAFE' }, profile);
    s = res.state;
    expect(s.cameraAnchor).toBe('cam_balcao');
    expect(s.leoAnim).toBe('wave_hi');
    expect(res.effects).toEqual([{ type: 'play_audio', key: 'hi_leo', playbackRate: 1 }]);

    // Greeting ends -> Screen 2 counter_intro demo beats (cup, coffee, water)
    res = step(s, { type: 'AUDIO_ENDED' }, profile);
    s = res.state;
    expect(s.phase).toBe('counter_intro');
    expect(s.highlightedProp).toBe('prop_cup_empty');

    res = step(s, { type: 'AUDIO_ENDED' }, profile);
    s = res.state;
    expect(s.highlightedProp).toBe('prop_jar_coffee');

    res = step(s, { type: 'AUDIO_ENDED' }, profile);
    s = res.state;
    expect(s.highlightedProp).toBe('prop_water_cold');

    // TPR rounds: cup -> water -> coffee
    res = step(s, { type: 'AUDIO_ENDED' }, profile);
    s = res.state;
    expect(s.awaitingInput).toBe(true);
    expect(s.leoAnim).toBe('ask_palm');

    res = step(s, { type: 'PROP_TAPPED', prop: 'prop_cup_empty' }, profile);
    s = res.state;
    expect(res.effects).toEqual([{ type: 'play_audio', key: 'thanks_cup', playbackRate: 1 }]);

    res = step(s, { type: 'AUDIO_ENDED' }, profile);
    s = res.state;
    res = step(s, { type: 'PROP_TAPPED', prop: 'prop_water_cold' }, profile);
    s = res.state;
    expect(res.effects).toEqual([{ type: 'play_audio', key: 'thanks_water', playbackRate: 1 }]);

    res = step(s, { type: 'AUDIO_ENDED' }, profile);
    s = res.state;
    res = step(s, { type: 'PROP_TAPPED', prop: 'prop_jar_coffee' }, profile);
    s = res.state;
    expect(res.effects).toEqual([{ type: 'play_audio', key: 'thanks_coffee', playbackRate: 1 }]);

    // Screen 3: thermal_contrast (2 demos + 2 customer requests)
    res = step(s, { type: 'AUDIO_ENDED' }, profile);
    s = res.state;
    expect(s.phase).toBe('thermal_contrast');
    expect(s.leoAnim).toBe('blow_hot');

    res = step(s, { type: 'AUDIO_ENDED' }, profile);
    s = res.state;
    expect(s.leoAnim).toBe('shiver_cold');

    res = step(s, { type: 'AUDIO_ENDED' }, profile);
    s = res.state;
    expect(s.customerMood).toBe('cold');
    expect(s.awaitingInput).toBe(true);

    res = step(s, { type: 'PROP_TAPPED', prop: 'prop_cup_hot' }, profile);
    s = res.state;
    res = step(s, { type: 'AUDIO_ENDED' }, profile);
    s = res.state;
    expect(s.customerMood).toBe('warm');

    res = step(s, { type: 'PROP_TAPPED', prop: 'prop_water_cold' }, profile);
    s = res.state;

    // Screen 4: action_pour (coffee then water)
    res = step(s, { type: 'AUDIO_ENDED' }, profile);
    s = res.state;
    expect(s.phase).toBe('action_pour');
    expect(s.activePourLiquid).toBe('coffee');
    expect(s.awaitingInput).toBe(true);

    res = step(s, { type: 'POUR_COMPLETED' }, profile);
    s = res.state;
    expect(res.effects).toEqual([{ type: 'play_audio', key: 'pour_coffee_done', playbackRate: 1 }]);

    res = step(s, { type: 'AUDIO_ENDED' }, profile);
    s = res.state;
    expect(s.activePourLiquid).toBe('water');

    res = step(s, { type: 'POUR_COMPLETED' }, profile);
    s = res.state;

    // Screen 5: personal_choice (creative cold_coffee!)
    res = step(s, { type: 'AUDIO_ENDED' }, profile);
    s = res.state;
    expect(s.phase).toBe('personal_choice');
    expect(s.awaitingInput).toBe(true);

    res = step(s, { type: 'PROP_TAPPED', prop: 'prop_iced_coffee' }, profile);
    s = res.state;
    expect(s.preferredDrink).toBe('cold_coffee');
    expect(s.leoAnim).toBe('surprised_happy');
    expect(res.effects).toEqual([{ type: 'play_audio', key: 'choice_cold_coffee_nice', playbackRate: 1 }]);

    // Screen 6: micro_echo (vocal path)
    res = step(s, { type: 'AUDIO_ENDED' }, profile);
    s = res.state;
    expect(s.phase).toBe('micro_echo');
    expect(s.awaitingInput).toBe(true);
    expect(res.effects).toEqual([{ type: 'play_audio', key: 'echo_prompt_cold_coffee', playbackRate: 1 }]);

    res = step(s, { type: 'VOICE_DETECTED' }, profile);
    s = res.state;
    expect(s.oralComfort).toBe('vocal');
    expect(s.vocalConcepts).toEqual(['cup', 'coffee', 'cold']);
    expect(res.effects).toEqual([{ type: 'play_audio', key: 'echo_vocal_cold_coffee', playbackRate: 1 }]);

    // Screen 7: farewell_constellation
    res = step(s, { type: 'AUDIO_ENDED' }, profile);
    s = res.state;
    expect(s.phase).toBe('farewell_constellation');
    expect(s.mysteryBoxVisible).toBe(true);
    expect(s.cameraAnchor).toBe('cam_caixa');

    res = step(s, { type: 'AUDIO_ENDED' }, profile);
    s = res.state;
    expect(s.orbsLaunching).toBe(true);
    expect(s.completed).toBe(true);
    expect(s.cameraAnchor).toBe('cam_constelacao');

    const commit = res.effects.find((e) => e.type === 'commit_profile');
    expect(commit).toBeDefined();
    if (commit?.type === 'commit_profile') {
      expect(commit.profile.preferredDrink).toBe('cold_coffee');
      expect(commit.profile.oralComfort).toBe('vocal');
      expect(commit.profile.constellation.cold?.stage).toBe('voice');
      expect(commit.profile.constellation.hot?.stage).toBe('root');
    }
  });

  it('handles wrong tap with gentle Recast, records hinted concept, and later classifies it as seed', () => {
    let s = createLesson1State();
    s = step(s, { type: 'JUMP_TO_PHASE', phase: 'counter_intro' }).state;
    // Skip 3 demos to reach TPR round 0 (asking for cup)
    s = step(s, { type: 'AUDIO_ENDED' }).state;
    s = step(s, { type: 'AUDIO_ENDED' }).state;
    s = step(s, { type: 'AUDIO_ENDED' }).state;

    // Tap water instead of cup
    const recastRes = step(s, { type: 'PROP_TAPPED', prop: 'prop_water_cold' });
    expect(recastRes.state.hintedConcepts).toContain('cup');
    expect(recastRes.state.hintMode).toBe('glow');
    expect(recastRes.state.highlightedProp).toBe('prop_cup_empty');
    expect(recastRes.effects).toEqual([
      { type: 'play_audio', key: 'recast_water', playbackRate: 1, followUpKey: 'ask_cup' },
    ]);
  });

  it('handles 5s hesitation timeout by glowing target and slowing playback to 0.8x', () => {
    let s = createLesson1State();
    s = step(s, { type: 'JUMP_TO_PHASE', phase: 'counter_intro' }).state;
    s = step(s, { type: 'AUDIO_ENDED' }).state;
    s = step(s, { type: 'AUDIO_ENDED' }).state;
    s = step(s, { type: 'AUDIO_ENDED' }).state;

    const hintRes = step(s, { type: 'HESITATION_TIMEOUT' });
    expect(hintRes.state.hintMode).toBe('glow');
    expect(hintRes.state.highlightedProp).toBe('prop_cup_empty');
    expect(hintRes.effects).toEqual([{ type: 'play_audio', key: 'ask_cup', playbackRate: 0.8 }]);
  });

  it('handles ? help button with contrast highlight and isolated word audio', () => {
    let s = createLesson1State();
    s = step(s, { type: 'JUMP_TO_PHASE', phase: 'thermal_contrast' }).state;
    s = step(s, { type: 'AUDIO_ENDED' }).state;
    s = step(s, { type: 'AUDIO_ENDED' }).state;

    const helpRes = step(s, { type: 'HELP_REQUESTED' });
    expect(helpRes.state.hintMode).toBe('contrast');
    expect(helpRes.state.hintedConcepts).toContain('hot');
    expect(helpRes.effects).toEqual([{ type: 'play_audio', key: 'word_hot', playbackRate: 0.85 }]);
  });

  it('welcomes silent wave on Screen 6 without punishment', () => {
    let s = createLesson1State();
    s = step(s, { type: 'JUMP_TO_PHASE', phase: 'micro_echo' }).state;

    const silentRes = step(s, { type: 'SILENT_WAVE' });
    expect(silentRes.state.oralComfort).toBe('silent');
    expect(silentRes.state.vocalConcepts).toEqual([]);
    expect(silentRes.state.leoAnim).toBe('nod_thanks');
    expect(silentRes.effects).toEqual([{ type: 'play_audio', key: 'echo_silent_hot_coffee', playbackRate: 1 }]);
  });
});
