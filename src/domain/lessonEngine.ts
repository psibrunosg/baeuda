import { applyLesson1Outcome } from './learnerMemory';
import type {
  CameraAnchorId,
  ConceptId,
  DrinkChoice,
  LearnerProfile,
  LeoAnimation,
  Lesson1Script,
  OralComfort,
  PropName,
  SpeechKey,
} from './types';

export type LessonPhase =
  | 'map_arrival'
  | 'counter_intro'
  | 'thermal_contrast'
  | 'action_pour'
  | 'personal_choice'
  | 'micro_echo'
  | 'farewell_constellation';

export type LessonSubStep =
  | 'idle_map'
  | 'greeting'
  | 'demo'
  | 'interact'
  | 'feedback'
  | 'farewell_box'
  | 'constellation_ready';

export type HintMode = 'none' | 'glow' | 'contrast';

export type LessonEffect =
  | {
      type: 'play_audio';
      key: SpeechKey;
      playbackRate: number;
      followUpKey?: SpeechKey;
    }
  | {
      type: 'commit_profile';
      profile: LearnerProfile;
    };

export interface LessonState {
  phase: LessonPhase;
  subStep: LessonSubStep;
  roundIndex: number;
  awaitingInput: boolean;
  leoAnim: LeoAnimation;
  cameraAnchor: CameraAnchorId;
  highlightedProp: PropName | null;
  hintMode: HintMode;
  customerMood: 'cold' | 'warm' | null;
  activePourLiquid: 'coffee' | 'water' | null;
  preferredDrink: DrinkChoice;
  oralComfort: OralComfort;
  hintedConcepts: ConceptId[];
  vocalConcepts: ConceptId[];
  mysteryBoxVisible: boolean;
  orbsLaunching: boolean;
  completed: boolean;
}

export type LessonEvent =
  | { type: 'ENTER_CAFE' }
  | { type: 'AUDIO_ENDED' }
  | { type: 'PROP_TAPPED'; prop: PropName }
  | { type: 'POUR_COMPLETED' }
  | { type: 'VOICE_DETECTED' }
  | { type: 'SILENT_WAVE' }
  | { type: 'HELP_REQUESTED' }
  | { type: 'HESITATION_TIMEOUT' }
  | { type: 'JUMP_TO_PHASE'; phase: LessonPhase };

function addUnique(list: readonly ConceptId[], items: readonly ConceptId[]): ConceptId[] {
  const set = new Set(list);
  for (const item of items) set.add(item);
  return Array.from(set);
}

function echoPromptKey(drink: DrinkChoice): SpeechKey {
  if (drink === 'cold_water') return 'echo_prompt_cold_water';
  if (drink === 'cold_coffee') return 'echo_prompt_cold_coffee';
  return 'echo_prompt_hot_coffee';
}

function echoVocalKey(drink: DrinkChoice): SpeechKey {
  if (drink === 'cold_water') return 'echo_vocal_cold_water';
  if (drink === 'cold_coffee') return 'echo_vocal_cold_coffee';
  return 'echo_vocal_hot_coffee';
}

function echoSilentKey(drink: DrinkChoice): SpeechKey {
  if (drink === 'cold_water') return 'echo_silent_cold_water';
  if (drink === 'cold_coffee') return 'echo_silent_cold_coffee';
  return 'echo_silent_hot_coffee';
}

function choiceConfirmKey(drink: DrinkChoice): SpeechKey {
  if (drink === 'cold_coffee') return 'choice_cold_coffee_nice';
  if (drink === 'cold_water') return 'choice_confirm_cold_water';
  return 'choice_confirm_hot_coffee';
}

export function createLesson1State(): LessonState {
  return {
    phase: 'map_arrival',
    subStep: 'idle_map',
    roundIndex: 0,
    awaitingInput: false,
    leoAnim: 'wave_hi',
    cameraAnchor: 'cam_mapa',
    highlightedProp: 'prop_cafe_door',
    hintMode: 'none',
    customerMood: null,
    activePourLiquid: null,
    preferredDrink: 'hot_coffee',
    oralComfort: 'unknown',
    hintedConcepts: [],
    vocalConcepts: [],
    mysteryBoxVisible: false,
    orbsLaunching: false,
    completed: false,
  };
}

function enterPhase(
  base: LessonState,
  phase: LessonPhase,
  script: Lesson1Script,
): { state: LessonState; effects: LessonEffect[] } {
  const clean: LessonState = {
    ...base,
    phase,
    roundIndex: 0,
    hintMode: 'none',
    customerMood: null,
    activePourLiquid: null,
    highlightedProp: null,
    mysteryBoxVisible: false,
    orbsLaunching: false,
    completed: false,
  };

  switch (phase) {
    case 'map_arrival':
      return { state: createLesson1State(), effects: [] };
    case 'counter_intro': {
      const beat = script.counterDemoBeats[0];
      return {
        state: {
          ...clean,
          subStep: 'demo',
          awaitingInput: false,
          cameraAnchor: 'cam_balcao',
          leoAnim: beat.leoAnim,
          highlightedProp: beat.prop,
        },
        effects: [{ type: 'play_audio', key: beat.audioKey, playbackRate: 1 }],
      };
    }
    case 'thermal_contrast': {
      const beat = script.contrastDemoBeats[0];
      return {
        state: {
          ...clean,
          subStep: 'demo',
          awaitingInput: false,
          cameraAnchor: 'cam_contraste',
          leoAnim: beat.leoAnim,
          highlightedProp: beat.prop,
        },
        effects: [{ type: 'play_audio', key: beat.audioKey, playbackRate: 1 }],
      };
    }
    case 'action_pour': {
      const round = script.pourRounds[0];
      return {
        state: {
          ...clean,
          subStep: 'interact',
          awaitingInput: true,
          cameraAnchor: 'cam_despejo',
          leoAnim: 'present_right',
          highlightedProp: round.vesselProp,
          activePourLiquid: round.liquid,
        },
        effects: [{ type: 'play_audio', key: round.promptAudio, playbackRate: 1 }],
      };
    }
    case 'personal_choice':
      return {
        state: {
          ...clean,
          subStep: 'interact',
          awaitingInput: true,
          cameraAnchor: 'cam_balcao',
          leoAnim: 'ask_palm',
          highlightedProp: null,
        },
        effects: [{ type: 'play_audio', key: 'choice_prompt', playbackRate: 1 }],
      };
    case 'micro_echo':
      return {
        state: {
          ...clean,
          subStep: 'interact',
          awaitingInput: true,
          cameraAnchor: 'cam_balcao',
          leoAnim: 'present_left',
          highlightedProp: null,
        },
        effects: [{ type: 'play_audio', key: echoPromptKey(clean.preferredDrink), playbackRate: 1 }],
      };
    case 'farewell_constellation':
      return {
        state: {
          ...clean,
          subStep: 'farewell_box',
          awaitingInput: false,
          cameraAnchor: 'cam_caixa',
          leoAnim: 'farewell_box',
          mysteryBoxVisible: true,
          highlightedProp: 'prop_box_mystery',
        },
        effects: [{ type: 'play_audio', key: 'farewell_see_you', playbackRate: 1 }],
      };
  }
}

export function lessonReducer(
  state: LessonState,
  event: LessonEvent,
  profile: LearnerProfile,
  nowIso: string,
  script: Lesson1Script,
): { state: LessonState; effects: LessonEffect[] } {
  if (event.type === 'JUMP_TO_PHASE') {
    return enterPhase(state, event.phase, script);
  }

  if (event.type === 'ENTER_CAFE') {
    if (state.phase !== 'map_arrival' || state.subStep !== 'idle_map') {
      return { state, effects: [] };
    }
    return {
      state: {
        ...state,
        subStep: 'greeting',
        cameraAnchor: 'cam_balcao',
        leoAnim: 'wave_hi',
        highlightedProp: null,
      },
      effects: [{ type: 'play_audio', key: 'hi_leo', playbackRate: 1 }],
    };
  }

  if (event.type === 'AUDIO_ENDED') {
    if (state.phase === 'map_arrival' && state.subStep === 'greeting') {
      return enterPhase(state, 'counter_intro', script);
    }

    if (state.phase === 'counter_intro') {
      if (state.subStep === 'demo') {
        const nextIdx = state.roundIndex + 1;
        if (nextIdx < script.counterDemoBeats.length) {
          const beat = script.counterDemoBeats[nextIdx];
          return {
            state: {
              ...state,
              roundIndex: nextIdx,
              leoAnim: beat.leoAnim,
              highlightedProp: beat.prop,
            },
            effects: [{ type: 'play_audio', key: beat.audioKey, playbackRate: 1 }],
          };
        }
        const round = script.tprRounds[0];
        return {
          state: {
            ...state,
            subStep: 'interact',
            roundIndex: 0,
            awaitingInput: true,
            leoAnim: 'ask_palm',
            highlightedProp: null,
            hintMode: 'none',
          },
          effects: [{ type: 'play_audio', key: round.promptAudio, playbackRate: 1 }],
        };
      }

      if (state.subStep === 'feedback') {
        const nextIdx = state.roundIndex + 1;
        if (nextIdx < script.tprRounds.length) {
          const round = script.tprRounds[nextIdx];
          return {
            state: {
              ...state,
              subStep: 'interact',
              roundIndex: nextIdx,
              awaitingInput: true,
              leoAnim: 'ask_palm',
              highlightedProp: null,
              hintMode: 'none',
            },
            effects: [{ type: 'play_audio', key: round.promptAudio, playbackRate: 1 }],
          };
        }
        return enterPhase(state, 'thermal_contrast', script);
      }
    }

    if (state.phase === 'thermal_contrast') {
      if (state.subStep === 'demo') {
        const nextIdx = state.roundIndex + 1;
        if (nextIdx < script.contrastDemoBeats.length) {
          const beat = script.contrastDemoBeats[nextIdx];
          return {
            state: {
              ...state,
              roundIndex: nextIdx,
              leoAnim: beat.leoAnim,
              highlightedProp: beat.prop,
            },
            effects: [{ type: 'play_audio', key: beat.audioKey, playbackRate: 1 }],
          };
        }
        const round = script.contrastRounds[0];
        return {
          state: {
            ...state,
            subStep: 'interact',
            roundIndex: 0,
            awaitingInput: true,
            leoAnim: 'ask_palm',
            customerMood: round.customerMood,
            highlightedProp: null,
            hintMode: 'none',
          },
          effects: [{ type: 'play_audio', key: round.promptAudio, playbackRate: 1 }],
        };
      }

      if (state.subStep === 'feedback') {
        const nextIdx = state.roundIndex + 1;
        if (nextIdx < script.contrastRounds.length) {
          const round = script.contrastRounds[nextIdx];
          return {
            state: {
              ...state,
              subStep: 'interact',
              roundIndex: nextIdx,
              awaitingInput: true,
              leoAnim: 'ask_palm',
              customerMood: round.customerMood,
              highlightedProp: null,
              hintMode: 'none',
            },
            effects: [{ type: 'play_audio', key: round.promptAudio, playbackRate: 1 }],
          };
        }
        return enterPhase(state, 'action_pour', script);
      }
    }

    if (state.phase === 'action_pour' && state.subStep === 'feedback') {
      const nextIdx = state.roundIndex + 1;
      if (nextIdx < script.pourRounds.length) {
        const round = script.pourRounds[nextIdx];
        return {
          state: {
            ...state,
            subStep: 'interact',
            roundIndex: nextIdx,
            awaitingInput: true,
            activePourLiquid: round.liquid,
            highlightedProp: round.vesselProp,
            leoAnim: 'present_right',
            hintMode: 'none',
          },
          effects: [{ type: 'play_audio', key: round.promptAudio, playbackRate: 1 }],
        };
      }
      return enterPhase(state, 'personal_choice', script);
    }

    if (state.phase === 'personal_choice' && state.subStep === 'feedback') {
      return enterPhase(state, 'micro_echo', script);
    }

    if (state.phase === 'micro_echo' && state.subStep === 'feedback') {
      return enterPhase(state, 'farewell_constellation', script);
    }

    if (state.phase === 'farewell_constellation' && state.subStep === 'farewell_box') {
      const committedProfile = applyLesson1Outcome(profile, {
        preferredDrink: state.preferredDrink,
        oralComfort: state.oralComfort === 'vocal' ? 'vocal' : 'silent',
        hintedConcepts: state.hintedConcepts,
        vocalConcepts: state.vocalConcepts,
        nowIso,
      });

      return {
        state: {
          ...state,
          subStep: 'constellation_ready',
          cameraAnchor: 'cam_constelacao',
          orbsLaunching: true,
          completed: true,
          highlightedProp: null,
        },
        effects: [{ type: 'commit_profile', profile: committedProfile }],
      };
    }

    return { state, effects: [] };
  }

  if (event.type === 'PROP_TAPPED') {
    if (!state.awaitingInput) return { state, effects: [] };

    if (state.phase === 'counter_intro') {
      const round = script.tprRounds[state.roundIndex];
      if (!round) return { state, effects: [] };
      if (event.prop === round.targetProp) {
        return {
          state: {
            ...state,
            subStep: 'feedback',
            awaitingInput: false,
            leoAnim: 'nod_thanks',
            highlightedProp: round.targetProp,
            hintMode: 'none',
          },
          effects: [{ type: 'play_audio', key: round.thanksAudio, playbackRate: 1 }],
        };
      }
      const recastKey = script.propRecastAudio[event.prop] ?? round.helpAudio;
      return {
        state: {
          ...state,
          leoAnim: 'ask_palm',
          hintMode: 'glow',
          highlightedProp: round.targetProp,
          hintedConcepts: addUnique(state.hintedConcepts, [round.concept]),
        },
        effects: [{ type: 'play_audio', key: recastKey, playbackRate: 1, followUpKey: round.promptAudio }],
      };
    }

    if (state.phase === 'thermal_contrast') {
      const round = script.contrastRounds[state.roundIndex];
      if (!round) return { state, effects: [] };
      if (event.prop === round.targetProp) {
        return {
          state: {
            ...state,
            subStep: 'feedback',
            awaitingInput: false,
            leoAnim: 'nod_thanks',
            highlightedProp: round.targetProp,
            hintMode: 'none',
          },
          effects: [{ type: 'play_audio', key: round.thanksAudio, playbackRate: 1 }],
        };
      }
      const recastKey =
        event.prop === 'prop_water_cold' ? 'recast_cold_water' : 'recast_hot_coffee';
      return {
        state: {
          ...state,
          leoAnim: 'ask_palm',
          hintMode: 'glow',
          highlightedProp: round.targetProp,
          hintedConcepts: addUnique(state.hintedConcepts, round.concepts),
        },
        effects: [{ type: 'play_audio', key: recastKey, playbackRate: 1, followUpKey: round.promptAudio }],
      };
    }

    if (state.phase === 'personal_choice') {
      const drink = script.propToDrink[event.prop];
      if (!drink) return { state, effects: [] };
      return {
        state: {
          ...state,
          subStep: 'feedback',
          awaitingInput: false,
          preferredDrink: drink,
          leoAnim: drink === 'cold_coffee' ? 'surprised_happy' : 'nod_thanks',
          highlightedProp: event.prop,
          hintMode: 'none',
        },
        effects: [{ type: 'play_audio', key: choiceConfirmKey(drink), playbackRate: 1 }],
      };
    }

    return { state, effects: [] };
  }

  if (event.type === 'POUR_COMPLETED') {
    if (state.phase !== 'action_pour' || !state.awaitingInput) {
      return { state, effects: [] };
    }
    const round = script.pourRounds[state.roundIndex];
    if (!round) return { state, effects: [] };

    return {
      state: {
        ...state,
        subStep: 'feedback',
        awaitingInput: false,
        leoAnim: 'nod_thanks',
        hintMode: 'none',
      },
      effects: [{ type: 'play_audio', key: round.doneAudio, playbackRate: 1 }],
    };
  }

  if (event.type === 'VOICE_DETECTED') {
    if (state.phase !== 'micro_echo' || !state.awaitingInput) {
      return { state, effects: [] };
    }
    const vocalConcepts = [...script.drinkToConcepts[state.preferredDrink]];
    return {
      state: {
        ...state,
        subStep: 'feedback',
        awaitingInput: false,
        oralComfort: 'vocal',
        vocalConcepts,
        leoAnim: 'nod_thanks',
        hintMode: 'none',
      },
      effects: [{ type: 'play_audio', key: echoVocalKey(state.preferredDrink), playbackRate: 1 }],
    };
  }

  if (event.type === 'SILENT_WAVE') {
    if (state.phase !== 'micro_echo' || !state.awaitingInput) {
      return { state, effects: [] };
    }
    return {
      state: {
        ...state,
        subStep: 'feedback',
        awaitingInput: false,
        oralComfort: 'silent',
        vocalConcepts: [],
        leoAnim: 'nod_thanks',
        hintMode: 'none',
      },
      effects: [{ type: 'play_audio', key: echoSilentKey(state.preferredDrink), playbackRate: 1 }],
    };
  }

  if (event.type === 'HESITATION_TIMEOUT' || event.type === 'HELP_REQUESTED') {
    if (!state.awaitingInput) return { state, effects: [] };
    const isHelp = event.type === 'HELP_REQUESTED';
    const nextHintMode: HintMode = isHelp ? 'contrast' : 'glow';
    const rate = isHelp ? 0.85 : 0.8;

    if (state.phase === 'counter_intro') {
      const round = script.tprRounds[state.roundIndex];
      if (!round) return { state, effects: [] };
      return {
        state: {
          ...state,
          hintMode: nextHintMode,
          highlightedProp: round.targetProp,
          hintedConcepts: addUnique(state.hintedConcepts, [round.concept]),
        },
        effects: [{ type: 'play_audio', key: isHelp ? round.helpAudio : round.promptAudio, playbackRate: rate }],
      };
    }

    if (state.phase === 'thermal_contrast') {
      const round = script.contrastRounds[state.roundIndex];
      if (!round) return { state, effects: [] };
      return {
        state: {
          ...state,
          hintMode: nextHintMode,
          highlightedProp: round.targetProp,
          hintedConcepts: addUnique(state.hintedConcepts, round.concepts),
        },
        effects: [{ type: 'play_audio', key: isHelp ? round.helpAudio : round.promptAudio, playbackRate: rate }],
      };
    }

    if (state.phase === 'action_pour') {
      const round = script.pourRounds[state.roundIndex];
      if (!round) return { state, effects: [] };
      return {
        state: {
          ...state,
          hintMode: nextHintMode,
          highlightedProp: round.vesselProp,
          hintedConcepts: addUnique(state.hintedConcepts, ['pour']),
        },
        effects: [{ type: 'play_audio', key: isHelp ? round.helpAudio : round.promptAudio, playbackRate: rate }],
      };
    }

    if (state.phase === 'personal_choice') {
      return {
        state: { ...state, hintMode: nextHintMode },
        effects: [{ type: 'play_audio', key: 'choice_prompt', playbackRate: rate }],
      };
    }

    if (state.phase === 'micro_echo') {
      return {
        state: { ...state, hintMode: nextHintMode },
        effects: [{ type: 'play_audio', key: echoPromptKey(state.preferredDrink), playbackRate: rate }],
      };
    }
  }

  return { state, effects: [] };
}
