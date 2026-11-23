export type DialogueScenarioId = 'cafe' | 'pharmacy' | 'pizzeria' | 'barber' | 'postbank';

export interface DialogueOption {
  label: string;
  reply: string;
  isCorrect?: boolean;
}

export interface DialogueTurn {
  id: string;
  npcLine: string;
  options: readonly DialogueOption[];
}

export interface DialogueScenario {
  id: DialogueScenarioId;
  icon: string;
  title: string;
  npcName: string;
  cefrTag: 'Pre-A1' | 'A1' | 'A2';
  turns: readonly DialogueTurn[];
}

export const TRAVEL_DIALOGUE_SCENARIOS: readonly DialogueScenario[] = [
  {
    id: 'cafe',
    icon: '☕',
    title: 'Café',
    npcName: 'Barista Leo',
    cefrTag: 'Pre-A1',
    turns: [
      {
        id: 'drink',
        npcLine: 'Hi! Welcome to the café. What would you like to drink?',
        options: [
          { label: 'One hot coffee, please.', reply: 'Great! One hot coffee.', isCorrect: true },
          { label: 'Cold water, please.', reply: 'Sure! One cold water.', isCorrect: true },
          {
            label: 'Where is the train station?',
            reply: 'Haha, this is a café! What would you like to drink? Coffee or water?',
            isCorrect: false,
          },
        ],
      },
      {
        id: 'here_or_to_go',
        npcLine: 'For here or to go?',
        options: [
          { label: 'For here, please.', reply: 'Great, have a seat!', isCorrect: true },
          { label: 'To go, please.', reply: 'No problem, I will pack it to go.', isCorrect: true },
          {
            label: 'My name is Leo.',
            reply: 'Nice to meet you! Would you like your drink for here or to go?',
            isCorrect: false,
          },
        ],
      },
      {
        id: 'anything_else',
        npcLine: 'Anything else? Fresh cake or bread?',
        options: [
          { label: 'Yes, one slice of cake, please!', reply: 'Delicious! Coming right up.', isCorrect: true },
          { label: 'No, thank you. How much is it?', reply: 'Two coins, please. Thank you!', isCorrect: true },
          {
            label: 'It is raining outside.',
            reply: 'True! Would you like cake, bread, or just the check?',
            isCorrect: false,
          },
        ],
      },
    ],
  },
  {
    id: 'pharmacy',
    icon: '💊',
    title: 'Pharmacy',
    npcName: 'Pharmacist',
    cefrTag: 'A1',
    turns: [
      {
        id: 'symptom',
        npcLine: 'Hello! How can I help you today?',
        options: [
          { label: 'I have a headache. I need medicine.', reply: 'I see. Here is gentle headache medicine.' },
          { label: 'I need band-aids for a small cut.', reply: 'Of course! Here is a clean first-aid box.' },
        ],
      },
      {
        id: 'dosage',
        npcLine: 'Do you also need a thermometer or cold water?',
        options: [
          { label: 'Yes, a thermometer, please.', reply: 'Good idea! Check your temperature at home.' },
          { label: 'Just the medicine, thank you.', reply: 'Take one after lunch with water.' },
        ],
      },
      {
        id: 'pay',
        npcLine: 'That will be five dollars. Cash or card?',
        options: [
          { label: 'By card, please. Thank you!', reply: 'All set! Feel better soon!' },
          { label: 'Cash, please. Have a nice day!', reply: 'Thank you! Take care!' },
        ],
      },
    ],
  },
  {
    id: 'pizzeria',
    icon: '🍕',
    title: 'Pizzeria',
    npcName: 'Chef',
    cefrTag: 'A1',
    turns: [
      {
        id: 'table',
        npcLine: 'Good evening! Welcome to the pizzeria. Table for one or two?',
        options: [
          { label: 'A table for two, please.', reply: 'Right this way! Here is the menu.' },
          { label: 'Just for one, please.', reply: 'Follow me! Here is a cozy table.' },
        ],
      },
      {
        id: 'order',
        npcLine: 'Are you ready to order?',
        options: [
          { label: 'One pepperoni pizza and cold water, please.', reply: 'Molto bene! Hot pizza coming soon.' },
          { label: 'One cheese pizza, please.', reply: 'Great choice! Fresh from the oven.' },
        ],
      },
      {
        id: 'check',
        npcLine: 'How was the pizza? Would you like the check?',
        options: [
          { label: 'It was delicious! The check, please.', reply: 'Thank you so much! See you again!' },
          { label: 'Amazing! Can I pay by card?', reply: 'Of course! Thank you for visiting!' },
        ],
      },
    ],
  },
  {
    id: 'barber',
    icon: '💈',
    title: 'Barber',
    npcName: 'Barber',
    cefrTag: 'A1',
    turns: [
      {
        id: 'style',
        npcLine: 'Welcome! Have a seat. How would you like your haircut?',
        options: [
          { label: 'Just a short trim, please.', reply: 'Got it! Clean and neat.' },
          { label: 'Short on the sides, longer on top.', reply: 'Classic style! Let us start.' },
        ],
      },
      {
        id: 'check_mirror',
        npcLine: 'Look in the mirror. Is this length good?',
        options: [
          { label: 'Yes, it looks great!', reply: 'Awesome! Let me brush it off.' },
          { label: 'A little shorter on top, please.', reply: 'No problem! Just a tiny bit more.' },
        ],
      },
      {
        id: 'finish',
        npcLine: 'All done! How does it feel?',
        options: [
          { label: 'Love it! Thank you very much!', reply: 'You are welcome! See you next month!' },
          { label: 'Perfect! How much do I owe you?', reply: 'Ten dollars, please. Have a great day!' },
        ],
      },
    ],
  },
  {
    id: 'postbank',
    icon: '📮',
    title: 'Post & Bank',
    npcName: 'Postal Worker',
    cefrTag: 'A2',
    turns: [
      {
        id: 'service',
        npcLine: 'Good morning! Are you sending a letter or a package today?',
        options: [
          { label: 'I want to send this package to Brazil.', reply: 'Sure! Put the package on the scale, please.' },
          { label: 'I need two stamps for this letter.', reply: 'Here you go! Two international stamps.' },
        ],
      },
      {
        id: 'speed',
        npcLine: 'Would you like express delivery or standard mail?',
        options: [
          { label: 'Express delivery, please. How long does it take?', reply: 'About three days with tracking.' },
          { label: 'Standard mail is fine, thank you.', reply: 'Great, standard mail is much cheaper.' },
        ],
      },
      {
        id: 'receipt',
        npcLine: 'Here is your receipt and tracking number. Anything else?',
        options: [
          { label: 'No, that is all. Thank you!', reply: 'Have a wonderful day!' },
          { label: 'Where is the bank ATM?', reply: 'Right outside on the left wall!' },
        ],
      },
    ],
  },
];

export function getDialogueScenario(id: DialogueScenarioId): DialogueScenario {
  return TRAVEL_DIALOGUE_SCENARIOS.find((s) => s.id === id) ?? TRAVEL_DIALOGUE_SCENARIOS[0];
}
