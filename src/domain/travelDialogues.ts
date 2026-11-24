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
          { label: 'I have a headache. I need medicine.', reply: 'I see. Here is gentle headache medicine.', isCorrect: true },
          { label: 'I need band-aids for a small cut.', reply: 'Of course! Here is a clean first-aid box.', isCorrect: true },
          {
            label: 'One pepperoni pizza, please.',
            reply: 'This is a pharmacy, not a pizzeria! Do you need medicine or band-aids?',
            isCorrect: false,
          },
        ],
      },
      {
        id: 'dosage',
        npcLine: 'Do you also need a thermometer or cold water?',
        options: [
          { label: 'Yes, a thermometer, please.', reply: 'Good idea! Check your temperature at home.', isCorrect: true },
          { label: 'Just the medicine, thank you.', reply: 'Take one after lunch with water.', isCorrect: true },
          {
            label: 'Short on the sides, please.',
            reply: 'That sounds like a haircut! Do you want a thermometer or just the medicine?',
            isCorrect: false,
          },
        ],
      },
      {
        id: 'pay',
        npcLine: 'That will be five dollars. Cash or card?',
        options: [
          { label: 'By card, please. Thank you!', reply: 'All set! Feel better soon!', isCorrect: true },
          { label: 'Cash, please. Have a nice day!', reply: 'Thank you! Take care!', isCorrect: true },
          {
            label: 'Yes, it is very sunny.',
            reply: 'It is! How would you like to pay — cash or card?',
            isCorrect: false,
          },
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
          { label: 'A table for two, please.', reply: 'Right this way! Here is the menu.', isCorrect: true },
          { label: 'Just for one, please.', reply: 'Follow me! Here is a cozy table.', isCorrect: true },
          {
            label: 'I have a headache.',
            reply: 'Oh no! The pharmacy is next door. Would you like a table for one or two?',
            isCorrect: false,
          },
        ],
      },
      {
        id: 'order',
        npcLine: 'Are you ready to order?',
        options: [
          { label: 'One pepperoni pizza and cold water, please.', reply: 'Molto bene! Hot pizza coming soon.', isCorrect: true },
          { label: 'One cheese pizza, please.', reply: 'Great choice! Fresh from the oven.', isCorrect: true },
          {
            label: 'I need two stamps.',
            reply: 'We only bake pizza here! Would you like cheese or pepperoni pizza?',
            isCorrect: false,
          },
        ],
      },
      {
        id: 'check',
        npcLine: 'How was the pizza? Would you like the check?',
        options: [
          { label: 'It was delicious! The check, please.', reply: 'Thank you so much! See you again!', isCorrect: true },
          { label: 'Amazing! Can I pay by card?', reply: 'Of course! Thank you for visiting!', isCorrect: true },
          {
            label: 'Where is the thermometer?',
            reply: 'Haha! Did you enjoy the pizza? Ready for the check?',
            isCorrect: false,
          },
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
          { label: 'Just a short trim, please.', reply: 'Got it! Clean and neat.', isCorrect: true },
          { label: 'Short on the sides, longer on top.', reply: 'Classic style! Let us start.', isCorrect: true },
          {
            label: 'One hot coffee to go.',
            reply: 'Leo makes coffee at the café! How would you like your haircut?',
            isCorrect: false,
          },
        ],
      },
      {
        id: 'check_mirror',
        npcLine: 'Look in the mirror. Is this length good?',
        options: [
          { label: 'Yes, it looks great!', reply: 'Awesome! Let me brush it off.', isCorrect: true },
          { label: 'A little shorter on top, please.', reply: 'No problem! Just a tiny bit more.', isCorrect: true },
          {
            label: 'Send this package, please.',
            reply: 'Try the post office across the street! Is this hair length good?',
            isCorrect: false,
          },
        ],
      },
      {
        id: 'finish',
        npcLine: 'All done! How does it feel?',
        options: [
          { label: 'Love it! Thank you very much!', reply: 'You are welcome! See you next month!', isCorrect: true },
          { label: 'Perfect! How much do I owe you?', reply: 'Ten dollars, please. Have a great day!', isCorrect: true },
          {
            label: 'A table for two, please.',
            reply: 'All finished with your haircut! How does it feel?',
            isCorrect: false,
          },
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
          { label: 'I want to send this package to Brazil.', reply: 'Sure! Put the package on the scale, please.', isCorrect: true },
          { label: 'I need two stamps for this letter.', reply: 'Here you go! Two international stamps.', isCorrect: true },
          {
            label: 'One cheese pizza, please.',
            reply: 'No pizza at the post office! Are you sending a letter or a package?',
            isCorrect: false,
          },
        ],
      },
      {
        id: 'speed',
        npcLine: 'Would you like express delivery or standard mail?',
        options: [
          { label: 'Express delivery, please. How long does it take?', reply: 'About three days with tracking.', isCorrect: true },
          { label: 'Standard mail is fine, thank you.', reply: 'Great, standard mail is much cheaper.', isCorrect: true },
          {
            label: 'Just a short trim, please.',
            reply: 'That is at the barber shop! Express delivery or standard mail?',
            isCorrect: false,
          },
        ],
      },
      {
        id: 'receipt',
        npcLine: 'Here is your receipt and tracking number. Anything else?',
        options: [
          { label: 'No, that is all. Thank you!', reply: 'Have a wonderful day!', isCorrect: true },
          { label: 'Where is the bank ATM?', reply: 'Right outside on the left wall!', isCorrect: true },
          {
            label: 'I have a small cut.',
            reply: 'Here is your receipt! Do you need anything else today?',
            isCorrect: false,
          },
        ],
      },
    ],
  },
];

export function getDialogueScenario(id: DialogueScenarioId): DialogueScenario {
  return TRAVEL_DIALOGUE_SCENARIOS.find((s) => s.id === id) ?? TRAVEL_DIALOGUE_SCENARIOS[0];
}
