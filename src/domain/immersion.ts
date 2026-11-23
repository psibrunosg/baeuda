export type ImmersionTier = 'onboarding' | 'blended' | 'immersive';

export interface WorldAtmosphere {
  timeOfDay: 'day' | 'night';
  weather: 'sunny' | 'rainy';
}

/**
 * Automatically derives the neighborhood's time of day and weather from learner progression
 * (zero manual weather buttons — the city evolves organically as the learner advances):
 * - Start (0 lessons): sunny morning welcoming the learner to the Café
 * - After Lesson 1 (Market unlocked): cozy rainy afternoon (puddles + patio umbrella make real-world sense)
 * - After Lesson 2 (Plaza unlocked): warm illuminated evening (string lights + streetlamps for Plaza music)
 * - After Lesson 3 (all districts familiar): bright sunny day celebrating the full unlocked neighborhood
 */
export function resolveWorldAtmosphere(completedLessonIds: readonly string[]): WorldAtmosphere {
  const count = completedLessonIds.length;
  if (count === 1) {
    return { timeOfDay: 'day', weather: 'rainy' };
  }
  if (count === 2) {
    return { timeOfDay: 'night', weather: 'sunny' };
  }
  return { timeOfDay: 'day', weather: 'sunny' };
}

export type GuidanceContext =
  | 'map_explore'
  | 'map_locked_border'
  | 'cafe_listen'
  | 'cafe_tap_prop'
  | 'cafe_pour'
  | 'cafe_choice'
  | 'cafe_echo'
  | 'cafe_c2_food'
  | 'cafe_c3_quantity'
  | 'cafe_pre_a1_shift'
  | 'cafe_a1_spiral'
  | 'market_explore'
  | 'market_contrast'
  | 'market_basket'
  | 'plaza_explore'
  | 'plaza_rhythm'
  | 'pizzeria_kitchen'
  | 'constellation';

export interface GuidanceSegment {
  text: string;
  highlight?: boolean;
}

export interface GuidanceCopy {
  tier: ImmersionTier;
  tierIndex: 1 | 2 | 3;
  segments: readonly GuidanceSegment[];
  plainText: string;
}

/**
 * Resolves the learner's progressive immersion stage from their Constellation star count:
 * - 0..2 stars: onboarding (Portuguese navigation/action commands, 100% English world audio)
 * - 3..5 stars: blended (code-switched commands introducing English action/object keywords)
 * - 6+ stars:   immersive (concise English-only commands)
 */
export function resolveImmersionTier(starCount: number): ImmersionTier {
  if (starCount <= 2) return 'onboarding';
  if (starCount <= 5) return 'blended';
  return 'immersive';
}

const TIER_INDEX: Record<ImmersionTier, 1 | 2 | 3> = {
  onboarding: 1,
  blended: 2,
  immersive: 3,
};

const GUIDANCE_TABLE: Record<GuidanceContext, Record<ImmersionTier, readonly GuidanceSegment[]>> = {
  map_explore: {
    onboarding: [{ text: 'Clique no chão para andar · Toque nos objetos ou entre no café' }],
    blended: [
      { text: 'Ande pela rua · Toque em ' },
      { text: 'tree', highlight: true },
      { text: ', ' },
      { text: 'light', highlight: true },
      { text: ' ou entre no ' },
      { text: 'café', highlight: true },
    ],
    immersive: [
      { text: 'Walk around · Tap ' },
      { text: 'objects', highlight: true },
      { text: ' or enter the ' },
      { text: 'café', highlight: true },
    ],
  },
  map_locked_border: {
    onboarding: [{ text: 'Área sob névoa · Conclua o café para liberar este quarteirão' }],
    blended: [
      { text: 'Sob névoa · Complete o ' },
      { text: 'café', highlight: true },
      { text: ' para abrir o ' },
      { text: 'market', highlight: true },
    ],
    immersive: [
      { text: 'Finish the ' },
      { text: 'café', highlight: true },
      { text: ' to clear the fog' },
    ],
  },
  cafe_listen: {
    onboarding: [{ text: 'Ouça o Leo e observe os objetos no balcão' }],
    blended: [
      { text: 'Ouça o Leo · Observe ' },
      { text: 'cup', highlight: true },
      { text: ', ' },
      { text: 'coffee', highlight: true },
      { text: ' e ' },
      { text: 'water', highlight: true },
    ],
    immersive: [{ text: 'Listen and watch the counter' }],
  },
  cafe_tap_prop: {
    onboarding: [{ text: 'Toque no objeto que o Leo pediu' }],
    blended: [
      { text: 'Toque no objeto pedido · Use ' },
      { text: '?', highlight: true },
      { text: ' para ouvir de novo' },
    ],
    immersive: [{ text: 'Tap the requested item' }],
  },
  cafe_pour: {
    onboarding: [{ text: 'Segure o botão ou a jarra para servir' }],
    blended: [
      { text: 'Segure para ' },
      { text: 'pour', highlight: true },
    ],
    immersive: [
      { text: 'Hold to ' },
      { text: 'pour', highlight: true },
    ],
  },
  cafe_choice: {
    onboarding: [{ text: 'Escolha a bebida que você prefere no balcão' }],
    blended: [
      { text: 'Escolha: ' },
      { text: 'hot coffee', highlight: true },
      { text: ', ' },
      { text: 'cold coffee', highlight: true },
      { text: ' ou ' },
      { text: 'cold water', highlight: true },
    ],
    immersive: [
      { text: 'Pick ' },
      { text: 'hot coffee', highlight: true },
      { text: ', ' },
      { text: 'cold coffee', highlight: true },
      { text: ' or ' },
      { text: 'cold water', highlight: true },
    ],
  },
  cafe_echo: {
    onboarding: [{ text: 'Tente falar no microfone ou toque em 👋 para seguir em silêncio' }],
    blended: [
      { text: 'Fale no ' },
      { text: 'mic', highlight: true },
      { text: ' ou toque em 👋 para seguir' },
    ],
    immersive: [{ text: 'Speak into the mic or wave 👋 to continue' }],
  },
  cafe_c2_food: {
    onboarding: [{ text: 'Ciclo 2 · Toque no leite, açúcar e bolo no balcão do Leo' }],
    blended: [
      { text: 'Ciclo 2 · Explore ' },
      { text: 'milk', highlight: true },
      { text: ', ' },
      { text: 'sugar', highlight: true },
      { text: ' e ' },
      { text: 'cake', highlight: true },
    ],
    immersive: [
      { text: 'Explore ' },
      { text: 'milk', highlight: true },
      { text: ', ' },
      { text: 'sugar', highlight: true },
      { text: ' and ' },
      { text: 'cake', highlight: true },
    ],
  },
  cafe_c3_quantity: {
    onboarding: [{ text: 'Ciclo 3 · Compare grande/pequeno, 1/2 xícaras e cheio/vazio' }],
    blended: [
      { text: 'Ciclo 3 · Compare ' },
      { text: 'one/two', highlight: true },
      { text: ' e ' },
      { text: 'full/empty', highlight: true },
    ],
    immersive: [
      { text: 'Compare ' },
      { text: 'one/two', highlight: true },
      { text: ' and ' },
      { text: 'full/empty', highlight: true },
    ],
  },
  cafe_pre_a1_shift: {
    onboarding: [{ text: 'Turno Pre-A1 · Atenda os 3 clientes combinando o que aprendeu' }],
    blended: [
      { text: 'Turno ' },
      { text: 'Pre-A1', highlight: true },
      { text: ' · Sirva os pedidos combinados' },
    ],
    immersive: [
      { text: 'Pre-A1 Shift · Serve the combined ' },
      { text: 'orders', highlight: true },
    ],
  },
  cafe_a1_spiral: {
    onboarding: [{ text: 'Retorno A1 ao Café · Coloque o bolo ao lado da xícara e pague com moedas' }],
    blended: [
      { text: 'Café ' },
      { text: 'A1', highlight: true },
      { text: ' · Use ' },
      { text: 'next to', highlight: true },
      { text: ' e ' },
      { text: 'coins', highlight: true },
    ],
    immersive: [
      { text: 'A1 Café · Place ' },
      { text: 'next to', highlight: true },
      { text: ' the cup & pay ' },
      { text: 'coins', highlight: true },
    ],
  },
  market_explore: {
    onboarding: [{ text: 'Toque na maçã e no pão na barraca da Maya' }],
    blended: [
      { text: 'Toque em ' },
      { text: 'apple', highlight: true },
      { text: ' e ' },
      { text: 'bread', highlight: true },
      { text: ' no mercado' },
    ],
    immersive: [
      { text: 'Tap ' },
      { text: 'apple', highlight: true },
      { text: ' and ' },
      { text: 'bread', highlight: true },
    ],
  },
  market_contrast: {
    onboarding: [{ text: 'Compare a maçã grande e a pequena · Toque na que a Maya pedir' }],
    blended: [
      { text: 'Compare ' },
      { text: 'big', highlight: true },
      { text: ' e ' },
      { text: 'small', highlight: true },
      { text: ' · Toque no pedido' },
    ],
    immersive: [
      { text: 'Pick ' },
      { text: 'big', highlight: true },
      { text: ' or ' },
      { text: 'small', highlight: true },
    ],
  },
  market_basket: {
    onboarding: [{ text: 'Toque na cesta de vime para guardar as compras' }],
    blended: [
      { text: 'Guarde tudo na ' },
      { text: 'basket', highlight: true },
    ],
    immersive: [
      { text: 'Tap the ' },
      { text: 'basket', highlight: true },
      { text: ' to pack' },
    ],
  },
  plaza_explore: {
    onboarding: [{ text: 'Toque no violão do Sam e no passarinho azul na fonte' }],
    blended: [
      { text: 'Toque em ' },
      { text: 'music', highlight: true },
      { text: ' e ' },
      { text: 'bird', highlight: true },
      { text: ' na praça' },
    ],
    immersive: [
      { text: 'Tap ' },
      { text: 'music', highlight: true },
      { text: ' and ' },
      { text: 'bird', highlight: true },
    ],
  },
  plaza_rhythm: {
    onboarding: [{ text: 'Experimente tocar rápido e devagar com o Sam' }],
    blended: [
      { text: 'Toque no ritmo ' },
      { text: 'fast', highlight: true },
      { text: ' e ' },
      { text: 'slow', highlight: true },
    ],
    immersive: [
      { text: 'Play ' },
      { text: 'fast', highlight: true },
      { text: ' and ' },
      { text: 'slow', highlight: true },
    ],
  },
  pizzeria_kitchen: {
    onboarding: [{ text: 'Toque nos ingredientes na bancada para montar a pizza' }],
    blended: [
      { text: 'Monte a pizza: ' },
      { text: 'dough', highlight: true },
      { text: ' · ' },
      { text: 'sauce', highlight: true },
      { text: ' · ' },
      { text: 'cheese', highlight: true },
      { text: ' · ' },
      { text: 'pepperoni', highlight: true },
    ],
    immersive: [
      { text: 'Build the pizza: tap ' },
      { text: 'dough', highlight: true },
      { text: ', ' },
      { text: 'sauce', highlight: true },
      { text: ', ' },
      { text: 'cheese', highlight: true },
      { text: ' & ' },
      { text: 'toppings', highlight: true },
    ],
  },
  constellation: {
    onboarding: [{ text: 'Toque em qualquer estrela para ouvir novamente' }],
    blended: [
      { text: 'Toque em uma estrela para ' },
      { text: 'listen', highlight: true },
    ],
    immersive: [{ text: 'Tap any star to listen again' }],
  },
};

export function getGuidanceCopy(context: GuidanceContext, starCount: number): GuidanceCopy {
  const tier = resolveImmersionTier(starCount);
  const segments = GUIDANCE_TABLE[context][tier];
  return {
    tier,
    tierIndex: TIER_INDEX[tier],
    segments,
    plainText: segments.map((s) => s.text).join(''),
  };
}
