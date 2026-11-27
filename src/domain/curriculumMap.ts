import type {
  CefrLabel,
  CefrLevel,
  ConceptId,
  CurriculumLevelSpec,
  CurriculumMilestone,
  CurriculumMilestoneId,
  InteriorId,
  SessionBucket,
} from './types';

export const CEFR_LEVEL_ORDER: readonly CefrLevel[] = [
  'pre_a1',
  'a1',
  'a2',
  'b1',
] as const;

export const CEFR_LEVEL_LABELS: Record<CefrLevel, CefrLabel> = {
  pre_a1: 'Pre-A1',
  a1: 'A1',
  a2: 'A2',
  b1: 'B1',
};

/**
 * Target session rhythm from docs/PEDAGOGY.md §3.4:
 * ~60% spiral advancement, ~25% active retention (SRS/Mistakes), ~15% open application (Stories/Talk/Milestone).
 */
export const SESSION_BUCKET_TARGET_RATIO: Record<SessionBucket, number> = {
  spiral: 0.6,
  retention: 0.25,
  application: 0.15,
};

export const CURRICULUM_MILESTONES: Record<CurriculumMilestoneId, CurriculumMilestone> = {
  pre_a1_graduation_shift: {
    id: 'pre_a1_graduation_shift',
    level: 'pre_a1',
    title: 'Pre-A1 Graduation Shift (Café)',
    englishTitle: 'Pre-A1 Graduation Shift',
    summary: 'Atender pedidos combinados em sequência no Café sem dica.',
    status: 'playable',
    primaryMode: 'interior_3d',
    primaryInteriorId: 'cafe',
    completionKey: 'cafe_pre_a1_shift',
    readinessCriteria: {
      minConceptsAtLeastRoot: 6,
      requiredInteriors: ['cafe'],
      requiredCafeCycles: ['cafe_c1_drinks', 'cafe_c2_food', 'cafe_c3_quantity'],
      minStreetDiscoveries: 3,
    },
  },
  a1_market_fair_day: {
    id: 'a1_market_fair_day',
    level: 'a1',
    title: 'Dia de Feira no Bairro',
    englishTitle: 'Neighborhood Market Fair Day',
    summary:
      'Cumprir 3 demandas reais entre lojas combinando quantidade, espaço, preferência e ação em curso.',
    status: 'planned_phase_2',
    primaryMode: 'interior_3d',
    primaryInteriorId: 'market',
    completionKey: 'a1_market_fair_day',
    readinessCriteria: {
      minConceptsAtLeastRoot: 14,
      minConceptsAtLeastVoice: 4,
      requiredInteriors: ['cafe', 'market', 'plaza'],
      requiredCafeCycles: ['cafe_a1_spiral'],
    },
  },
  a2_festival_night: {
    id: 'a2_festival_night',
    level: 'a2',
    title: 'Noite de Festival no Bairro',
    englishTitle: 'Neighborhood Festival Night',
    summary:
      'Reconstruir o que aconteceu durante o dia, explicar um imprevisto ocorrido e combinar o plano da noite.',
    status: 'planned_phase_2',
    primaryMode: 'story',
    primaryInteriorId: 'plaza',
    completionKey: 'a2_festival_night',
    readinessCriteria: {
      minConceptsAtLeastRoot: 20,
      minConceptsAtLeastVoice: 8,
      minConceptsFluent: 3,
      requiredInteriors: ['cafe', 'market', 'plaza', 'pizzeria', 'pharmacy'],
    },
  },
  b1_neighborhood_assembly: {
    id: 'b1_neighborhood_assembly',
    level: 'b1',
    title: 'Conselho do Bairro',
    englishTitle: 'Neighborhood Assembly',
    summary:
      'Conversa multi-turno com ramificação onde o aluno ouve pontos de vista, negocia e sintetiza um acordo entre moradores.',
    status: 'planned_phase_3',
    primaryMode: 'talk',
    primaryInteriorId: 'plaza',
    completionKey: 'b1_neighborhood_assembly',
    readinessCriteria: {
      minConceptsAtLeastRoot: 24,
      minConceptsAtLeastVoice: 12,
      minConceptsFluent: 8,
      requiredInteriors: ['cafe', 'market', 'plaza', 'pizzeria', 'pharmacy'],
    },
  },
};

export const CURRICULUM_MAP: Record<CefrLevel, CurriculumLevelSpec> = {
  pre_a1: {
    level: 'pre_a1',
    label: 'Pre-A1',
    order: 0,
    cognitiveStage: 'Blocos concretos (Holophrases)',
    cognitiveStageEn: 'Concrete Chunks (Holophrases)',
    communicativeActs: [
      'Identificar objetos visíveis no balcão e na rua',
      'Contrastar cores, temperaturas e tamanhos (hot/cold, big/small)',
      'Expressar quantidades básicas (one/two, full/empty)',
      'Pedir e agradecer (please/thanks)',
    ],
    focusOnForm: [
      'Som → objeto ancorado em ação 3D',
      'Pares mínimos concretos (hot/cold, big/small, full/empty)',
    ],
    interiors: ['cafe'],
    shops: ['cafe', 'bakery', 'fruit_market'],
    cafeCycles: [
      'cafe_c1_drinks',
      'cafe_c2_food',
      'cafe_c3_quantity',
      'cafe_pre_a1_shift',
    ],
    coreConcepts: [
      'cup',
      'coffee',
      'water',
      'hot',
      'cold',
      'pour',
      'milk',
      'sugar',
      'cake',
      'sweet',
      'more',
      'one',
      'two',
      'full',
      'empty',
      'big',
      'small',
      'bread',
      'butter',
      'croissant',
      'notebook',
      'pencil',
      'globe',
    ],
    practiceUnitIds: ['unit_1_cafe', 'unit_2_bakery_market'],
    storyIds: ['story_missing_cake'],
    dialogueScenarioIds: ['cafe'],
    milestone: CURRICULUM_MILESTONES.pre_a1_graduation_shift,
  },
  a1: {
    level: 'a1',
    label: 'A1',
    order: 1,
    cognitiveStage: 'Ilhas de construção + Aspecto presente',
    cognitiveStageEn: 'Item-Based Constructions + Present Aspect',
    communicativeActs: [
      'Expressar preferências e necessidades (like/want/need)',
      'Descrever posição espacial (next to/in/on/behind)',
      'Realizar compras e serviços simples entre lojas',
      'Descrever ações em curso (Present Continuous visual)',
    ],
    focusOnForm: [
      'Ordem adjetivo + substantivo',
      'Plural contável (two red apples)',
      'Preposições espaciais (next to)',
      'Marcador -ing visível na animação',
    ],
    interiors: ['cafe', 'market', 'plaza', 'pizzeria', 'pharmacy'],
    shops: [
      'cafe',
      'market',
      'plaza',
      'pizzeria',
      'pharmacy',
      'bakery',
      'pet_shop',
      'clothes_shop',
    ],
    cafeCycles: ['cafe_a1_spiral'],
    coreConcepts: [
      'plate',
      'next_to',
      'coin',
      'like',
      'apple',
      'bread',
      'big',
      'small',
      'music',
      'bird',
      'fast',
      'slow',
      'bed',
      'stove',
      'desk',
      'comb',
      'scissors',
      'beard',
      'book',
      'pen',
      'read',
      'write',
      'story',
      'page',
      'chapter',
      'dog',
      'cat',
      'feed',
      'wash',
      'brush',
      'play',
      'happy',
      'gentle',
    ],
    practiceUnitIds: ['unit_3_pizzeria_pharmacy'],
    storyIds: ['story_runaway_puppy'],
    dialogueScenarioIds: ['pharmacy', 'pizzeria'],
    milestone: CURRICULUM_MILESTONES.a1_market_fair_day,
  },
  a2: {
    level: 'a2',
    label: 'A2',
    order: 2,
    cognitiveStage: 'Aspecto → Tempo (Passado/Futuro) + Conectivos',
    cognitiveStageEn: 'Aspect to Tense (Past/Future) + Connectives',
    communicativeActs: [
      'Narrar eventos recém-ocorridos (Past Simple a partir de ações concluídas)',
      'Combinar planos imediatos (going to / will)',
      'Fazer comparações (bigger/better/cheaper)',
      'Expressar causa e contraste (because/so/but)',
      'Resolver pequenos imprevistos em serviços e dar direções na rua',
    ],
    focusOnForm: [
      'Contraste visual aspecto → tempo (is pouring vs. poured)',
      'Auxiliares de pergunta no passado (Did you...?)',
      'Conectivos causais e contrastivos (because/so/but)',
    ],
    interiors: ['cafe', 'market', 'plaza', 'pizzeria', 'pharmacy'],
    shops: [
      'pizzeria',
      'pharmacy',
      'barbershop',
      'post_bank',
      'library',
      'tire_shop',
      'tech_shop',
    ],
    cafeCycles: ['cafe_a1_spiral'],
    coreConcepts: [
      'pour',
      'coin',
      'like',
      'bread',
      'fast',
      'slow',
      'more',
      'next_to',
    ],
    practiceUnitIds: ['unit_4_city_a2'],
    storyIds: ['story_lost_tourist'],
    dialogueScenarioIds: ['barber', 'postbank'],
    milestone: CURRICULUM_MILESTONES.a2_festival_night,
  },
  b1: {
    level: 'b1',
    label: 'B1',
    order: 3,
    cognitiveStage: 'Esquemas abstratos + Pragmática & Registro',
    cognitiveStageEn: 'Abstract Schemas + Pragmatics & Register',
    communicativeActs: [
      'Expressar e defender opiniões com justificativa',
      'Negociar alternativas e mediar acordos entre moradores',
      'Formular hipóteses (if / would / might)',
      'Conectar experiências passadas ao presente (Present Perfect)',
      'Alternar registro casual e formal conforme o contexto',
    ],
    focusOnForm: [
      'Modais de polidez e hipótese (could/would/might)',
      'Contraste Past Simple vs. Present Perfect ancorado no estado atual',
      'Marcadores discursivos (actually, however, in my opinion)',
    ],
    interiors: ['cafe', 'market', 'plaza', 'pizzeria', 'pharmacy'],
    shops: [
      'cafe',
      'market',
      'plaza',
      'pizzeria',
      'pharmacy',
      'post_bank',
      'library',
      'barbershop',
      'bakery',
      'pet_shop',
      'construction',
    ],
    cafeCycles: ['cafe_a1_spiral'],
    coreConcepts: [
      'like',
      'more',
      'coin',
      'next_to',
      'fast',
      'slow',
      'music',
      'pour',
    ],
    practiceUnitIds: [],
    storyIds: [],
    dialogueScenarioIds: ['cafe', 'pharmacy', 'pizzeria', 'barber', 'postbank'],
    milestone: CURRICULUM_MILESTONES.b1_neighborhood_assembly,
  },
};

export const CURRICULUM_LEVELS: readonly CurriculumLevelSpec[] = CEFR_LEVEL_ORDER.map(
  (level) => CURRICULUM_MAP[level],
);

/**
 * Shared concept mappings per interior, practice unit, story, and dialogue scenario
 * so every mode feeds the same unified pedagogical memory (`recordPedagogicalEvidence`).
 */
export const INTERIOR_CONCEPTS: Record<InteriorId, readonly ConceptId[]> = {
  cafe: ['cup', 'coffee', 'water', 'hot', 'cold', 'pour'],
  market: ['apple', 'bread', 'big', 'small'],
  plaza: ['music', 'bird', 'fast', 'slow'],
  pizzeria: ['hot', 'plate', 'more', 'like'],
  pharmacy: ['water', 'cold', 'one', 'two'],
};

export const PRACTICE_UNIT_CONCEPTS: Record<string, readonly ConceptId[]> = {
  unit_1_cafe: ['coffee', 'hot', 'cold', 'water', 'cake', 'sweet'],
  unit_2_bakery_market: ['bread', 'apple', 'two', 'big', 'small'],
  unit_3_pizzeria_pharmacy: ['hot', 'plate', 'water', 'more', 'like'],
  unit_4_city_a2: ['bread', 'next_to', 'fast', 'slow', 'coin'],
};

export const STORY_CONCEPTS: Record<string, readonly ConceptId[]> = {
  story_missing_cake: ['coffee', 'hot', 'cake', 'sweet', 'plate', 'empty'],
  story_runaway_puppy: ['music', 'next_to', 'fast', 'like'],
  story_lost_tourist: ['bread', 'water', 'cold', 'next_to'],
};

export const DIALOGUE_CONCEPTS: Record<string, readonly ConceptId[]> = {
  cafe: ['coffee', 'hot', 'cold', 'water', 'cake', 'coin'],
  pharmacy: ['water', 'cold', 'one', 'coin'],
  pizzeria: ['hot', 'plate', 'more', 'like', 'coin'],
  barber: ['fast', 'slow', 'like', 'coin'],
  postbank: ['next_to', 'one', 'two', 'coin'],
};

export function getCurriculumLevel(level: CefrLevel): CurriculumLevelSpec {
  return CURRICULUM_MAP[level];
}

export function getCefrLabel(level: CefrLevel): CefrLabel {
  return CEFR_LEVEL_LABELS[level];
}

export function getNextCefrLevel(level: CefrLevel): CefrLevel | null {
  const idx = CEFR_LEVEL_ORDER.indexOf(level);
  if (idx < 0 || idx >= CEFR_LEVEL_ORDER.length - 1) return null;
  return CEFR_LEVEL_ORDER[idx + 1];
}

export function getMilestoneForLevel(level: CefrLevel): CurriculumMilestone {
  return CURRICULUM_MAP[level].milestone;
}

export function getLevelForConcept(conceptId: ConceptId): CefrLevel {
  for (const level of CEFR_LEVEL_ORDER) {
    if (CURRICULUM_MAP[level].coreConcepts.includes(conceptId)) {
      return level;
    }
  }
  return 'pre_a1';
}

export function getLevelsForInterior(interiorId: InteriorId): readonly CefrLevel[] {
  return CEFR_LEVEL_ORDER.filter((level) =>
    CURRICULUM_MAP[level].interiors.includes(interiorId),
  );
}
