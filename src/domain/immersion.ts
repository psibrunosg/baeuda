export type ImmersionTier = 'onboarding' | 'blended' | 'immersive';

export type GuidanceContext =
  | 'map_explore'
  | 'map_locked_border'
  | 'cafe_listen'
  | 'cafe_tap_prop'
  | 'cafe_pour'
  | 'cafe_choice'
  | 'cafe_echo'
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
