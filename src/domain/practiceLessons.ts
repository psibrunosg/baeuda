export type PracticeExerciseKind = 'word_bank' | 'fill_blank' | 'listen_choose' | 'speak_aloud';

export interface PracticeExercise {
  id: string;
  unitId: string;
  kind: PracticeExerciseKind;
  npcIcon: string;
  npcName: string;
  prompt: string;
  audioText: string;
  /** Target sentence (for word_bank / speak_aloud) or target answer (for fill_blank / listen_choose) */
  targetAnswer: string;
  /** Shuffled word tiles for word_bank */
  wordTiles?: readonly string[];
  /** Sentence with ___ blank for fill_blank */
  sentenceWithBlank?: string;
  /** Multiple choice options for fill_blank or listen_choose */
  options?: readonly string[];
  /** Friendly tip shown after an incorrect attempt */
  tip: string;
}

export interface PracticeUnit {
  id: string;
  icon: string;
  title: string;
  cefrTag: 'Pre-A1' | 'A1' | 'A2';
  description: string;
  exercises: readonly PracticeExercise[];
}

export const PRACTICE_UNITS: readonly PracticeUnit[] = [
  {
    id: 'unit_1_cafe',
    icon: '☕',
    title: 'Café Essentials',
    cefrTag: 'Pre-A1',
    description: 'Order hot coffee, cold water & sweet cake naturally.',
    exercises: [
      {
        id: 'u1_wb_coffee',
        unitId: 'unit_1_cafe',
        kind: 'word_bank',
        npcIcon: '☕',
        npcName: 'Barista Leo',
        prompt: 'Listen and build the sentence',
        audioText: 'One hot coffee please',
        targetAnswer: 'One hot coffee please',
        wordTiles: ['coffee', 'One', 'please', 'hot', 'cold'],
        tip: 'In English, adjectives come before the noun: "hot coffee".',
      },
      {
        id: 'u1_fb_water',
        unitId: 'unit_1_cafe',
        kind: 'fill_blank',
        npcIcon: '💧',
        npcName: 'Barista Leo',
        prompt: 'Complete the order',
        audioText: 'I would like cold water please',
        sentenceWithBlank: 'I would like ___ water, please.',
        targetAnswer: 'cold',
        options: ['cold', 'bread', 'table'],
        tip: 'Use "cold" to describe chilled water.',
      },
      {
        id: 'u1_lc_cake',
        unitId: 'unit_1_cafe',
        kind: 'listen_choose',
        npcIcon: '🧁',
        npcName: 'Barista Leo',
        prompt: 'Leo asks: "Would you like some sweet cake?"',
        audioText: 'Would you like some sweet cake?',
        targetAnswer: 'Yes, please! That looks delicious.',
        options: [
          'Yes, please! That looks delicious.',
          'Turn left at the bus stop.',
          'My battery is full today.',
        ],
        tip: '"Yes, please!" is the polite way to accept food or drinks.',
      },
      {
        id: 'u1_sp_thanks',
        unitId: 'unit_1_cafe',
        kind: 'speak_aloud',
        npcIcon: '🎙️',
        npcName: 'Barista Leo',
        prompt: 'Say this phrase aloud',
        audioText: 'Thank you for the hot coffee',
        targetAnswer: 'Thank you for the hot coffee',
        tip: 'Speak clearly at a natural pace: "Thank you for the hot coffee."',
      },
    ],
  },
  {
    id: 'unit_2_bakery_market',
    icon: '🥖',
    title: 'Bakery & Market',
    cefrTag: 'Pre-A1',
    description: 'Buy warm bread and fresh fruit with quantities.',
    exercises: [
      {
        id: 'u2_wb_bread',
        unitId: 'unit_2_bakery_market',
        kind: 'word_bank',
        npcIcon: '🥖',
        npcName: 'Baker',
        prompt: 'Listen and build the sentence',
        audioText: 'Fresh warm bread please',
        targetAnswer: 'Fresh warm bread please',
        wordTiles: ['bread', 'Fresh', 'please', 'warm', 'shoes'],
        tip: 'Place quality words before the food: "Fresh warm bread".',
      },
      {
        id: 'u2_fb_apples',
        unitId: 'unit_2_bakery_market',
        kind: 'fill_blank',
        npcIcon: '🍎',
        npcName: 'Grocer Maya',
        prompt: 'Complete the sentence',
        audioText: 'I want two red apples',
        sentenceWithBlank: 'I want ___ red apples.',
        targetAnswer: 'two',
        options: ['two', 'hot', 'slow'],
        tip: 'Countable plural nouns ("apples") pair with numbers like "two".',
      },
      {
        id: 'u2_lc_banana',
        unitId: 'unit_2_bakery_market',
        kind: 'listen_choose',
        npcIcon: '🍌',
        npcName: 'Grocer Maya',
        prompt: 'Maya asks: "Do you prefer a big apple or a sweet banana?"',
        audioText: 'Do you prefer a big apple or a sweet banana?',
        targetAnswer: 'A sweet banana, please.',
        options: [
          'A sweet banana, please.',
          'I need a band-aid.',
          'The oven is very hot.',
        ],
        tip: 'Answer a choice question directly with the item you want.',
      },
      {
        id: 'u2_sp_apples',
        unitId: 'unit_2_bakery_market',
        kind: 'speak_aloud',
        npcIcon: '🎙️',
        npcName: 'Grocer Maya',
        prompt: 'Say this phrase aloud',
        audioText: 'Two red apples please',
        targetAnswer: 'Two red apples please',
        tip: 'Try saying: "Two red apples, please."',
      },
    ],
  },
  {
    id: 'unit_3_pizzeria_pharmacy',
    icon: '🍕',
    title: 'Pizzeria & Pharmacy',
    cefrTag: 'A1',
    description: 'Order pizza toppings and ask for pharmacy care.',
    exercises: [
      {
        id: 'u3_wb_pizza',
        unitId: 'unit_3_pizzeria_pharmacy',
        kind: 'word_bank',
        npcIcon: '🍕',
        npcName: 'Chef',
        prompt: 'Listen and build the sentence',
        audioText: 'One cheese pizza please',
        targetAnswer: 'One cheese pizza please',
        wordTiles: ['pizza', 'One', 'please', 'cheese', 'water'],
        tip: 'Say the quantity + flavor + food: "One cheese pizza, please".',
      },
      {
        id: 'u3_fb_pharm',
        unitId: 'unit_3_pizzeria_pharmacy',
        kind: 'fill_blank',
        npcIcon: '💊',
        npcName: 'Pharmacist',
        prompt: 'Complete the request',
        audioText: 'I need medicine for a headache',
        sentenceWithBlank: 'I need ___ for a headache.',
        targetAnswer: 'medicine',
        options: ['medicine', 'dough', 'scissors'],
        tip: 'At the pharmacy, ask for "medicine" when you feel unwell.',
      },
      {
        id: 'u3_lc_fever',
        unitId: 'unit_3_pizzeria_pharmacy',
        kind: 'listen_choose',
        npcIcon: '🌡️',
        npcName: 'Pharmacist',
        prompt: 'Pharmacist says: "Let us check your temperature first."',
        audioText: 'Let us check your temperature first.',
        targetAnswer: 'Okay, thank you for helping me.',
        options: [
          'Okay, thank you for helping me.',
          'Add more pepperoni, please.',
          'Where is the barber chair?',
        ],
        tip: '"Thank you for helping me" works in any service situation.',
      },
      {
        id: 'u3_sp_help',
        unitId: 'unit_3_pizzeria_pharmacy',
        kind: 'speak_aloud',
        npcIcon: '🎙️',
        npcName: 'Pharmacist',
        prompt: 'Say this phrase aloud',
        audioText: 'Can you help me please',
        targetAnswer: 'Can you help me please',
        tip: '"Can you help me, please?" is one of the most useful travel phrases.',
      },
    ],
  },
  {
    id: 'unit_4_city_a2',
    icon: '🧭',
    title: 'City Directions & Past',
    cefrTag: 'A2',
    description: 'Give street directions and talk about yesterday.',
    exercises: [
      {
        id: 'u4_wb_left',
        unitId: 'unit_4_city_a2',
        kind: 'word_bank',
        npcIcon: '⬅️',
        npcName: 'Postal Worker',
        prompt: 'Listen and build the direction',
        audioText: 'Turn left at the corner',
        targetAnswer: 'Turn left at the corner',
        wordTiles: ['corner', 'Turn', 'at', 'left', 'the', 'yesterday'],
        tip: 'Use "Turn left / right at the corner" for clear directions.',
      },
      {
        id: 'u4_fb_past',
        unitId: 'unit_4_city_a2',
        kind: 'fill_blank',
        npcIcon: '🔙',
        npcName: 'Librarian',
        prompt: 'Choose the past tense verb',
        audioText: 'Yesterday I bought fresh bread',
        sentenceWithBlank: 'Yesterday I ___ fresh bread at the bakery.',
        targetAnswer: 'bought',
        options: ['bought', 'buy', 'buying'],
        tip: '"Bought" is the irregular past tense of "buy".',
      },
      {
        id: 'u4_lc_straight',
        unitId: 'unit_4_city_a2',
        kind: 'listen_choose',
        npcIcon: '🧭',
        npcName: 'Postal Worker',
        prompt: 'Tourist asks: "Excuse me, how do I get to the pharmacy?"',
        audioText: 'Excuse me, how do I get to the pharmacy?',
        targetAnswer: 'Go straight and turn left past the café.',
        options: [
          'Go straight and turn left past the café.',
          'Yesterday I drank cold water.',
          'The puppy is very happy.',
        ],
        tip: 'Combine "Go straight" + "turn left/right" to guide someone.',
      },
      {
        id: 'u4_sp_past',
        unitId: 'unit_4_city_a2',
        kind: 'speak_aloud',
        npcIcon: '🎙️',
        npcName: 'Librarian',
        prompt: 'Say this past-tense sentence aloud',
        audioText: 'Yesterday I went to the market',
        targetAnswer: 'Yesterday I went to the market',
        tip: '"Went" is the irregular past tense of "go".',
      },
    ],
  },
];

export const ALL_PRACTICE_EXERCISES: readonly PracticeExercise[] = PRACTICE_UNITS.flatMap(
  (u) => u.exercises,
);

export function normalizeEnglish(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function checkPracticeAnswer(exercise: PracticeExercise, userAnswer: string): boolean {
  const expected = normalizeEnglish(exercise.targetAnswer);
  const actual = normalizeEnglish(userAnswer);
  if (!actual) return false;
  if (actual === expected) return true;

  if (exercise.kind === 'speak_aloud') {
    const { matchRatio } = evaluateSpokenWords(exercise.targetAnswer, userAnswer);
    return matchRatio >= 0.75;
  }
  return false;
}

export function evaluateSpokenWords(
  targetPhrase: string,
  spokenTranscript: string,
): { words: { word: string; matched: boolean }[]; matchRatio: number } {
  const targetWords = targetPhrase.split(/\s+/).filter(Boolean);
  const spokenSet = new Set(normalizeEnglish(spokenTranscript).split(' ').filter(Boolean));
  const words = targetWords.map((raw) => {
    const clean = normalizeEnglish(raw);
    return { word: raw, matched: spokenSet.has(clean) };
  });
  const matchedCount = words.filter((w) => w.matched).length;
  return {
    words,
    matchRatio: targetWords.length > 0 ? matchedCount / targetWords.length : 0,
  };
}

export function buildMistakeExercises(mistakeIds: readonly string[]): PracticeExercise[] {
  const idSet = new Set(mistakeIds);
  return ALL_PRACTICE_EXERCISES.filter((ex) => idSet.has(ex.id));
}

export function computeLessonRewards(totalExercises: number, firstTryCorrect: number): {
  accuracy: number;
  coinsEarned: number;
  xpEarned: number;
} {
  const safeTotal = Math.max(1, totalExercises);
  const accuracy = Math.round((Math.min(firstTryCorrect, safeTotal) / safeTotal) * 100);
  const coinsEarned = accuracy >= 90 ? 20 : accuracy >= 70 ? 15 : 10;
  const xpEarned = firstTryCorrect * 10 + (accuracy === 100 ? 15 : 5);
  return { accuracy, coinsEarned, xpEarned };
}
