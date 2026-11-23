export type ConceptId =
  | 'cup'
  | 'coffee'
  | 'water'
  | 'hot'
  | 'cold'
  | 'pour'
  | 'milk'
  | 'sugar'
  | 'cake'
  | 'sweet'
  | 'more'
  | 'one'
  | 'two'
  | 'full'
  | 'empty'
  | 'plate'
  | 'next_to'
  | 'coin'
  | 'like'
  | 'apple'
  | 'bread'
  | 'big'
  | 'small'
  | 'music'
  | 'bird'
  | 'fast'
  | 'slow';

export type CefrLevel = 'pre_a1' | 'a1' | 'a2';

export type CafeCycleId =
  | 'cafe_c1_drinks'
  | 'cafe_c2_food'
  | 'cafe_c3_quantity'
  | 'cafe_pre_a1_shift'
  | 'cafe_a1_spiral';

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
  completedCafeCycles?: CafeCycleId[];
  streetDiscoveries?: string[];
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
  | 'cam_constelacao'
  | 'cam_mercado'
  | 'cam_praca';

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
  | 'farewell_see_you'
  | 'world_tree'
  | 'world_bicycle'
  | 'world_flowers'
  | 'world_light'
  | 'world_light_on'
  | 'world_light_off'
  | 'world_water_flowers'
  | 'world_day_sun'
  | 'world_night_light'
  | 'world_cat_water'
  | 'world_mailbox_open'
  | 'world_mailbox_close'
  | 'world_apple_return'
  | 'world_umbrella_open'
  | 'world_umbrella_close'
  | 'world_table'
  | 'world_water_fountain'
  | 'market_hi_maya'
  | 'market_apple'
  | 'market_bread'
  | 'market_big'
  | 'market_small'
  | 'market_ask_big_apple'
  | 'market_ask_small_apple'
  | 'market_basket_prompt'
  | 'market_basket_done'
  | 'plaza_hi_sam'
  | 'plaza_music'
  | 'plaza_bird'
  | 'plaza_fast'
  | 'plaza_slow'
  | 'plaza_ask_fast'
  | 'plaza_ask_slow'
  | 'plaza_celebrate'
  | 'cafe_c2_intro'
  | 'cafe_c2_milk'
  | 'cafe_c2_sugar'
  | 'cafe_c2_cake'
  | 'cafe_c2_sweet'
  | 'cafe_c2_more_milk'
  | 'cafe_c2_done'
  | 'cafe_c3_intro'
  | 'cafe_c3_one_big'
  | 'cafe_c3_two_small'
  | 'cafe_c3_full_empty'
  | 'cafe_c3_done'
  | 'cafe_shift_intro'
  | 'cafe_shift_order_1'
  | 'cafe_shift_order_2'
  | 'cafe_shift_order_3'
  | 'cafe_shift_graduate'
  | 'cafe_a1_intro'
  | 'cafe_a1_next_to'
  | 'cafe_a1_coins'
  | 'cafe_a1_like_done'
  | 'world_bakery_bread'
  | 'world_bakery_oven'
  | 'world_bakery_bell'
  | 'world_tire_pump'
  | 'world_tire_wheel'
  | 'world_tire_fix'
  | 'world_clothes_shirt'
  | 'world_clothes_dress'
  | 'world_clothes_hat'
  | 'world_tech_laptop'
  | 'world_tech_phone'
  | 'world_tech_wifi'
  | 'world_construction_mixer'
  | 'world_construction_bricks'
  | 'world_construction_helmet'
  | 'job_barista'
  | 'job_baker'
  | 'job_mechanic'
  | 'job_shopkeeper'
  | 'job_technician'
  | 'job_builder'
  | 'fruit_banana'
  | 'fruit_orange'
  | 'fruit_strawberry'
  | 'fruit_grapes'
  | 'fruit_watermelon'
  | 'world_bench_sit'
  | 'world_bus_stop'
  | 'world_parked_car'
  | 'quest_leo_bread_ask'
  | 'quest_leo_bread_done'
  | 'quest_mechanic_banana_ask'
  | 'quest_mechanic_banana_done'
  | 'world_bakery_cake'
  | 'world_tire_oil'
  | 'world_clothes_shoes'
  | 'world_tech_headphones'
  | 'world_construction_ladder'
  | 'job_pharmacist'
  | 'world_pharmacy_medicine'
  | 'world_pharmacy_bandaid'
  | 'world_pharmacy_thermometer'
  | 'job_vet'
  | 'world_pet_dog'
  | 'world_pet_food'
  | 'world_pet_toy'
  | 'job_barber'
  | 'world_barber_pole'
  | 'world_barber_chair'
  | 'world_barber_scissors'
  | 'job_librarian'
  | 'world_book_read'
  | 'world_book_pencil'
  | 'world_book_backpack'
  | 'job_chef'
  | 'world_pizza_slice'
  | 'world_pizza_menu'
  | 'world_pizza_plate'
  | 'job_postal'
  | 'world_post_package'
  | 'world_post_letter'
  | 'world_bank_atm';

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
