export interface StoryChoice {
  label: string;
  isCorrect: boolean;
  feedback: string;
}

export interface StoryStep {
  id: string;
  speakerIcon: string;
  speakerName: string;
  line: string;
  question?: string;
  choices?: readonly StoryChoice[];
}

export interface CityStoryEpisode {
  id: string;
  icon: string;
  title: string;
  cefrTag: 'Pre-A1' | 'A1' | 'A2';
  teaser: string;
  rewardCoins: number;
  steps: readonly StoryStep[];
}

export const CITY_STORIES: readonly CityStoryEpisode[] = [
  {
    id: 'story_missing_cake',
    icon: '🧁',
    title: 'The Missing Cake',
    cefrTag: 'Pre-A1',
    teaser: 'Barista Leo is ready to serve a customer, but the chocolate cake vanished!',
    rewardCoins: 20,
    steps: [
      {
        id: 'mc_1',
        speakerIcon: '☕',
        speakerName: 'Barista Leo',
        line: 'Good morning! A customer wants hot coffee and sweet chocolate cake.',
      },
      {
        id: 'mc_2',
        speakerIcon: '☕',
        speakerName: 'Barista Leo',
        line: 'Wait... the plate is empty! Where is my chocolate cake?',
        question: 'What is Leo looking for?',
        choices: [
          {
            label: 'The sweet chocolate cake',
            isCorrect: true,
            feedback: 'Right! The plate on the counter is empty.',
          },
          {
            label: 'A blue bicycle',
            isCorrect: false,
            feedback: 'Not quite — listen again to what Leo wants to serve.',
          },
          {
            label: 'Cold water',
            isCorrect: false,
            feedback: 'Close, but Leo said the plate for the cake is empty!',
          },
        ],
      },
      {
        id: 'mc_3',
        speakerIcon: '👨‍🍳',
        speakerName: 'Baker',
        line: 'Haha, Leo! Do not worry. Your fresh cake is still warm in my bakery oven!',
      },
      {
        id: 'mc_4',
        speakerIcon: '☕',
        speakerName: 'Barista Leo',
        line: 'Oh! Thank you, Baker! Now the coffee and cake are both warm and ready.',
        question: 'Where was the cake?',
        choices: [
          {
            label: 'In the bakery oven',
            isCorrect: true,
            feedback: 'Spot on! Fresh and warm from the bakery!',
          },
          {
            label: 'At the bus stop',
            isCorrect: false,
            feedback: 'The Baker said it was still in the bakery oven.',
          },
        ],
      },
    ],
  },
  {
    id: 'story_runaway_puppy',
    icon: '🐶',
    title: 'The Runaway Puppy',
    cefrTag: 'A1',
    teaser: 'The golden puppy heard music on the boulevard and ran straight to the Plaza!',
    rewardCoins: 20,
    steps: [
      {
        id: 'rp_1',
        speakerIcon: '🩺',
        speakerName: 'Vet',
        line: 'Oh no! Our little golden puppy heard guitar music and ran down the street!',
      },
      {
        id: 'rp_2',
        speakerIcon: '🎵',
        speakerName: 'Musician Sam',
        line: 'Hey! A happy puppy is dancing next to the fountain here at Central Plaza!',
        question: 'What is the puppy doing at the Plaza?',
        choices: [
          {
            label: 'Dancing next to the fountain',
            isCorrect: true,
            feedback: 'Yes! The puppy loves Sam’s guitar music!',
          },
          {
            label: 'Baking a cheese pizza',
            isCorrect: false,
            feedback: 'Haha, puppies cannot bake pizza! Check what Sam said.',
          },
        ],
      },
      {
        id: 'rp_3',
        speakerIcon: '🩺',
        speakerName: 'Vet',
        line: 'I brought his favorite red ball and pet food. Come here, good puppy!',
      },
      {
        id: 'rp_4',
        speakerIcon: '🐶',
        speakerName: 'Puppy',
        line: 'Woof! Woof! Thank you for finding me!',
        question: 'What did the Vet bring for the puppy?',
        choices: [
          {
            label: 'A red ball and pet food',
            isCorrect: true,
            feedback: 'Awesome listening! Every puppy loves a ball and snacks.',
          },
          {
            label: 'A thermometer and band-aid',
            isCorrect: false,
            feedback: 'Those are from the Pharmacy — the Vet brought a ball and pet food!',
          },
        ],
      },
    ],
  },
  {
    id: 'story_lost_tourist',
    icon: '🧭',
    title: 'The Lost Tourist',
    cefrTag: 'A2',
    teaser: 'A rainy afternoon visitor needs directions to the Pharmacy after buying bread.',
    rewardCoins: 25,
    steps: [
      {
        id: 'lt_1',
        speakerIcon: '🧳',
        speakerName: 'Tourist',
        line: 'Excuse me! Yesterday I bought bread here, and today I have a headache. Where is the pharmacy?',
      },
      {
        id: 'lt_2',
        speakerIcon: '📮',
        speakerName: 'Postal Worker',
        line: 'No problem! Go straight past the Corner Café, then turn left after the Fruit Market.',
        question: 'Which direction should the tourist take after the Fruit Market?',
        choices: [
          {
            label: 'Turn left',
            isCorrect: true,
            feedback: 'Correct! Go straight past the café, then turn left.',
          },
          {
            label: 'Turn right at the pizzeria',
            isCorrect: false,
            feedback: 'Listen again: go straight past the café and turn left.',
          },
        ],
      },
      {
        id: 'lt_3',
        speakerIcon: '💊',
        speakerName: 'Pharmacist',
        line: 'Welcome! Take this medicine with cold water and rest on the park bench.',
      },
      {
        id: 'lt_4',
        speakerIcon: '🧳',
        speakerName: 'Tourist',
        line: 'Thank you so much! Everyone in this neighborhood helped me today!',
        question: 'Why did the tourist visit the pharmacy?',
        choices: [
          {
            label: 'Because of a headache',
            isCorrect: true,
            feedback: 'Great comprehension! You mastered an A2 neighborhood story!',
          },
          {
            label: 'To fix a flat tire',
            isCorrect: false,
            feedback: 'That would be the Tire Shop — the tourist had a headache.',
          },
        ],
      },
    ],
  },
];
