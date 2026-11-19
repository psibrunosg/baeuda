export type ConceptId = 'cup' | 'coffee' | 'water' | 'hot' | 'cold' | 'pour';

export type AcquisitionStage = 'seed' | 'root' | 'voice';

export type DrinkChoice = 'hot_coffee' | 'cold_water' | 'cold_coffee';

export type OralComfort = 'unknown' | 'silent' | 'vocal';

export type LocationId = 'cafe' | 'market' | 'plaza';

export type LocationStatus = 'unexplored' | 'discovered' | 'familiar';

export interface ConceptNode {
  id: ConceptId;
  stage: AcquisitionStage;
  originLocation: LocationId;
  neededHint: boolean;
  lastContactAt: string;
}

export type ConstellationEdgeKind = 'situational' | 'contrast' | 'narrative';

export interface ConstellationEdge {
  from: ConceptId;
  to: ConceptId;
  kind: ConstellationEdgeKind;
}

export interface LearnerProfile {
  schemaVersion: 1;
  preferredDrink: DrinkChoice | null;
  oralComfort: OralComfort;
  immersionSeconds: number;
  completedLessonIds: string[];
  locations: Record<LocationId, LocationStatus>;
  constellation: Partial<Record<ConceptId, ConceptNode>>;
}

export type VisemeId = 'viseme_aa' | 'viseme_ee' | 'viseme_oo' | 'viseme_fv' | 'viseme_mbp';

export interface VisemeCue {
  at: number;
  viseme: VisemeId | null;
}

export type PropName =
  | 'prop_cafe_door'
  | 'prop_cup_empty'
  | 'prop_cup_hot'
  | 'prop_jar_coffee'
  | 'prop_water_cold'
  | 'prop_iced_coffee'
  | 'prop_box_mystery';

export type LeoAnimation =
  | 'idle_breathe'
  | 'wave_hi'
  | 'present_left'
  | 'present_right'
  | 'ask_palm'
  | 'blow_hot'
  | 'shiver_cold'
  | 'nod_thanks'
  | 'surprised_happy'
  | 'farewell_box';

export type CameraAnchorId =
  | 'cam_mapa'
  | 'cam_balcao'
  | 'cam_contraste'
  | 'cam_despejo'
  | 'cam_caixa'
  | 'cam_constelacao';

export type SpeechKey =
  | 'hi_leo'
  | 'demo_cup'
  | 'demo_coffee'
  | 'demo_water'
  | 'word_hot'
  | 'word_cold'
  | 'ask_cup'
  | 'ask_water'
  | 'ask_coffee'
  | 'thanks_cup'
  | 'thanks_water'
  | 'thanks_coffee'
  | 'recast_cup'
  | 'recast_coffee'
  | 'recast_water'
  | 'recast_hot_coffee'
  | 'recast_cold_water'
  | 'demo_hot_coffee'
  | 'demo_cold_water'
  | 'customer_hot_coffee'
  | 'customer_cold_water'
  | 'pour_coffee_prompt'
  | 'pour_coffee_done'
  | 'pour_water_prompt'
  | 'pour_water_done'
  | 'choice_prompt'
  | 'choice_confirm_hot_coffee'
  | 'choice_confirm_cold_water'
  | 'choice_cold_coffee_nice'
  | 'echo_prompt_hot_coffee'
  | 'echo_prompt_cold_water'
  | 'echo_prompt_cold_coffee'
  | 'echo_vocal_hot_coffee'
  | 'echo_vocal_cold_water'
  | 'echo_vocal_cold_coffee'
  | 'echo_silent_hot_coffee'
  | 'echo_silent_cold_water'
  | 'echo_silent_cold_coffee'
  | 'farewell_see_you';

export interface CounterDemoBeat {
  prop: PropName;
  concept: ConceptId;
  audioKey: SpeechKey;
  leoAnim: LeoAnimation;
}

export interface TprRound {
  targetProp: PropName;
  concept: ConceptId;
  promptAudio: SpeechKey;
  thanksAudio: SpeechKey;
  helpAudio: SpeechKey;
}

export interface ContrastDemoBeat {
  prop: PropName;
  concept: ConceptId;
  audioKey: SpeechKey;
  leoAnim: LeoAnimation;
}

export interface ContrastRound {
  customerMood: 'cold' | 'warm';
  targetProp: PropName;
  concepts: readonly ConceptId[];
  promptAudio: SpeechKey;
  thanksAudio: SpeechKey;
  helpAudio: SpeechKey;
}

export interface PourRound {
  liquid: 'coffee' | 'water';
  vesselProp: PropName;
  promptAudio: SpeechKey;
  doneAudio: SpeechKey;
  helpAudio: SpeechKey;
}

export interface Lesson1Script {
  counterDemoBeats: readonly CounterDemoBeat[];
  tprRounds: readonly TprRound[];
  contrastDemoBeats: readonly ContrastDemoBeat[];
  contrastRounds: readonly ContrastRound[];
  pourRounds: readonly PourRound[];
  drinkToConcepts: Record<DrinkChoice, readonly ConceptId[]>;
  propToDrink: Partial<Record<PropName, DrinkChoice>>;
  propRecastAudio: Partial<Record<PropName, SpeechKey>>;
}
