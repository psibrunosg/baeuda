import type { SpeechKey } from './types';

export type CuriosityCategory = 'fruit' | 'cafe' | 'profession' | 'city';

export interface CuriosityItem {
  id: string;
  category: CuriosityCategory;
  icon: string;
  question: string;
  canonicalAnswer: string;
  acceptedAnswers: readonly string[];
  speechKey: SpeechKey;
  discoveryKey: string;
  collectible?: {
    itemId: string;
    icon: string;
    label: string;
  };
}

export const CURIOSITY_CATALOG: Record<string, CuriosityItem> = {
  fruit_apple: {
    id: 'fruit_apple',
    category: 'fruit',
    icon: '🍎',
    question: 'What fruit is this?',
    canonicalAnswer: 'Apple',
    acceptedAnswers: ['apple', 'red apple', 'an apple', 'apples'],
    speechKey: 'market_apple',
    discoveryKey: 'world_fruit_apple',
    collectible: { itemId: 'apple', icon: '🍎', label: 'Apple' },
  },
  fruit_banana: {
    id: 'fruit_banana',
    category: 'fruit',
    icon: '🍌',
    question: 'What fruit is this?',
    canonicalAnswer: 'Banana',
    acceptedAnswers: ['banana', 'yellow banana', 'a banana', 'bananas'],
    speechKey: 'fruit_banana',
    discoveryKey: 'world_fruit_banana',
    collectible: { itemId: 'banana', icon: '🍌', label: 'Banana' },
  },
  fruit_orange: {
    id: 'fruit_orange',
    category: 'fruit',
    icon: '🍊',
    question: 'What fruit is this?',
    canonicalAnswer: 'Orange',
    acceptedAnswers: ['orange', 'an orange', 'oranges'],
    speechKey: 'fruit_orange',
    discoveryKey: 'world_fruit_orange',
    collectible: { itemId: 'orange', icon: '🍊', label: 'Orange' },
  },
  fruit_strawberry: {
    id: 'fruit_strawberry',
    category: 'fruit',
    icon: '🍓',
    question: 'What fruit is this?',
    canonicalAnswer: 'Strawberry',
    acceptedAnswers: ['strawberry', 'strawberries', 'a strawberry'],
    speechKey: 'fruit_strawberry',
    discoveryKey: 'world_fruit_strawberry',
    collectible: { itemId: 'strawberry', icon: '🍓', label: 'Strawberry' },
  },
  fruit_grapes: {
    id: 'fruit_grapes',
    category: 'fruit',
    icon: '🍇',
    question: 'What fruit is this?',
    canonicalAnswer: 'Grapes',
    acceptedAnswers: ['grape', 'grapes', 'purple grapes'],
    speechKey: 'fruit_grapes',
    discoveryKey: 'world_fruit_grapes',
    collectible: { itemId: 'grapes', icon: '🍇', label: 'Grapes' },
  },
  fruit_watermelon: {
    id: 'fruit_watermelon',
    category: 'fruit',
    icon: '🍉',
    question: 'What fruit is this?',
    canonicalAnswer: 'Watermelon',
    acceptedAnswers: ['watermelon', 'water melon', 'a watermelon'],
    speechKey: 'fruit_watermelon',
    discoveryKey: 'world_fruit_watermelon',
    collectible: { itemId: 'watermelon', icon: '🍉', label: 'Watermelon' },
  },
  job_barista: {
    id: 'job_barista',
    category: 'profession',
    icon: '☕',
    question: 'What is this job?',
    canonicalAnswer: 'Barista',
    acceptedAnswers: ['barista', 'a barista', 'coffee maker'],
    speechKey: 'job_barista',
    discoveryKey: 'world_job_barista',
  },
  job_baker: {
    id: 'job_baker',
    category: 'profession',
    icon: '👨‍🍳',
    question: 'What is this job?',
    canonicalAnswer: 'Baker',
    acceptedAnswers: ['baker', 'a baker', 'chef'],
    speechKey: 'job_baker',
    discoveryKey: 'world_job_baker',
  },
  job_mechanic: {
    id: 'job_mechanic',
    category: 'profession',
    icon: '🔧',
    question: 'What is this job?',
    canonicalAnswer: 'Mechanic',
    acceptedAnswers: ['mechanic', 'a mechanic'],
    speechKey: 'job_mechanic',
    discoveryKey: 'world_job_mechanic',
  },
  job_shopkeeper: {
    id: 'job_shopkeeper',
    category: 'profession',
    icon: '👗',
    question: 'What is this job?',
    canonicalAnswer: 'Shopkeeper',
    acceptedAnswers: ['shopkeeper', 'seller', 'clerk', 'designer'],
    speechKey: 'job_shopkeeper',
    discoveryKey: 'world_job_shopkeeper',
  },
  job_technician: {
    id: 'job_technician',
    category: 'profession',
    icon: '💻',
    question: 'What is this job?',
    canonicalAnswer: 'Technician',
    acceptedAnswers: ['technician', 'tech', 'repairman', 'engineer'],
    speechKey: 'job_technician',
    discoveryKey: 'world_job_technician',
  },
  job_builder: {
    id: 'job_builder',
    category: 'profession',
    icon: '👷',
    question: 'What is this job?',
    canonicalAnswer: 'Builder',
    acceptedAnswers: ['builder', 'worker', 'construction worker'],
    speechKey: 'job_builder',
    discoveryKey: 'world_job_builder',
  },
  city_cake: {
    id: 'city_cake',
    category: 'city',
    icon: '🎂',
    question: 'What is this at the bakery?',
    canonicalAnswer: 'Cake',
    acceptedAnswers: ['cake', 'chocolate cake', 'donut', 'donuts'],
    speechKey: 'world_bakery_cake',
    discoveryKey: 'world_bakery_cake',
    collectible: { itemId: 'cake', icon: '🎂', label: 'Cake' },
  },
  city_shoes: {
    id: 'city_shoes',
    category: 'city',
    icon: '👟',
    question: 'What are these?',
    canonicalAnswer: 'Shoes',
    acceptedAnswers: ['shoe', 'shoes', 'sneakers', 'white shoes'],
    speechKey: 'world_clothes_shoes',
    discoveryKey: 'world_clothes_shoes',
    collectible: { itemId: 'shoes', icon: '👟', label: 'Shoes' },
  },
  city_headphones: {
    id: 'city_headphones',
    category: 'city',
    icon: '🎧',
    question: 'What is this?',
    canonicalAnswer: 'Headphones',
    acceptedAnswers: ['headphones', 'headphone', 'earphones'],
    speechKey: 'world_tech_headphones',
    discoveryKey: 'world_tech_headphones',
    collectible: { itemId: 'headphones', icon: '🎧', label: 'Headphones' },
  },
  job_pharmacist: {
    id: 'job_pharmacist',
    category: 'profession',
    icon: '💊',
    question: 'What is this job?',
    canonicalAnswer: 'Pharmacist',
    acceptedAnswers: ['pharmacist', 'a pharmacist', 'doctor', 'chemist'],
    speechKey: 'job_pharmacist',
    discoveryKey: 'world_job_pharmacist',
  },
  city_bandaid: {
    id: 'city_bandaid',
    category: 'city',
    icon: '🩹',
    question: 'What is in the first-aid box?',
    canonicalAnswer: 'Band-aid',
    acceptedAnswers: ['bandaid', 'band aid', 'bandage', 'first aid'],
    speechKey: 'world_pharmacy_bandaid',
    discoveryKey: 'world_pharmacy_bandaid',
    collectible: { itemId: 'bandaid', icon: '🩹', label: 'Band-aid' },
  },
  job_vet: {
    id: 'job_vet',
    category: 'profession',
    icon: '🩺',
    question: 'What is this job?',
    canonicalAnswer: 'Vet',
    acceptedAnswers: ['vet', 'a vet', 'veterinarian', 'animal doctor'],
    speechKey: 'job_vet',
    discoveryKey: 'world_job_vet',
  },
  city_dog: {
    id: 'city_dog',
    category: 'city',
    icon: '🐶',
    question: 'What animal is this?',
    canonicalAnswer: 'Dog',
    acceptedAnswers: ['dog', 'a dog', 'puppy', 'a puppy'],
    speechKey: 'world_pet_dog',
    discoveryKey: 'world_pet_dog',
  },
  job_barber: {
    id: 'job_barber',
    category: 'profession',
    icon: '💈',
    question: 'What is this job?',
    canonicalAnswer: 'Barber',
    acceptedAnswers: ['barber', 'a barber', 'hairdresser', 'stylist'],
    speechKey: 'job_barber',
    discoveryKey: 'world_job_barber',
  },
  city_scissors: {
    id: 'city_scissors',
    category: 'city',
    icon: '✂️',
    question: 'What tool cuts hair?',
    canonicalAnswer: 'Scissors',
    acceptedAnswers: ['scissors', 'scissor', 'comb'],
    speechKey: 'world_barber_scissors',
    discoveryKey: 'world_barber_scissors',
    collectible: { itemId: 'scissors', icon: '✂️', label: 'Scissors' },
  },
  job_librarian: {
    id: 'job_librarian',
    category: 'profession',
    icon: '📚',
    question: 'What is this job?',
    canonicalAnswer: 'Librarian',
    acceptedAnswers: ['librarian', 'a librarian', 'bookseller', 'teacher'],
    speechKey: 'job_librarian',
    discoveryKey: 'world_job_librarian',
  },
  city_book: {
    id: 'city_book',
    category: 'city',
    icon: '📖',
    question: 'What do you read here?',
    canonicalAnswer: 'Book',
    acceptedAnswers: ['book', 'a book', 'books', 'story'],
    speechKey: 'world_book_read',
    discoveryKey: 'world_book_read',
    collectible: { itemId: 'book', icon: '📖', label: 'Book' },
  },
  job_chef: {
    id: 'job_chef',
    category: 'profession',
    icon: '👨‍🍳',
    question: 'What is this job?',
    canonicalAnswer: 'Chef',
    acceptedAnswers: ['chef', 'a chef', 'cook', 'a cook'],
    speechKey: 'job_chef',
    discoveryKey: 'world_job_chef',
  },
  city_pizza: {
    id: 'city_pizza',
    category: 'city',
    icon: '🍕',
    question: 'What food is this?',
    canonicalAnswer: 'Pizza',
    acceptedAnswers: ['pizza', 'a pizza', 'cheese pizza'],
    speechKey: 'world_pizza_slice',
    discoveryKey: 'world_pizza_slice',
    collectible: { itemId: 'pizza', icon: '🍕', label: 'Pizza' },
  },
  job_postal: {
    id: 'job_postal',
    category: 'profession',
    icon: '📮',
    question: 'What is this job?',
    canonicalAnswer: 'Postal worker',
    acceptedAnswers: ['postal worker', 'mailman', 'postman', 'mail carrier'],
    speechKey: 'job_postal',
    discoveryKey: 'world_job_postal',
  },
  city_package: {
    id: 'city_package',
    category: 'city',
    icon: '📦',
    question: 'What do you send by mail?',
    canonicalAnswer: 'Package',
    acceptedAnswers: ['package', 'a package', 'box', 'parcel', 'mail'],
    speechKey: 'world_post_package',
    discoveryKey: 'world_post_package',
    collectible: { itemId: 'package', icon: '📦', label: 'Package' },
  },
};

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp: number[] = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = dp[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
      prev = temp;
    }
  }
  return dp[b.length];
}

export function maskWordHint(word: string): string {
  return word
    .split(' ')
    .map((part) => (part.length <= 1 ? part : `${part[0]}${' _'.repeat(part.length - 1)}`))
    .join('   ');
}

export function getCuriosityChoices(item: CuriosityItem): string[] {
  const sameCategory = Object.values(CURIOSITY_CATALOG)
    .filter((other) => other.id !== item.id && other.category === item.category)
    .map((other) => other.canonicalAnswer);
  const uniqueDistractors = Array.from(new Set(sameCategory)).slice(0, 2);
  const list = [item.canonicalAnswer, ...uniqueDistractors];
  // Deterministic rotation by item.id length so correct answer isn't always first
  const shift = item.id.length % list.length;
  return [...list.slice(shift), ...list.slice(0, shift)];
}

export function checkCuriosityAnswer(item: CuriosityItem, rawInput: string): boolean {
  const normalized = rawInput
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ');
  if (!normalized) return false;
  const stripped = normalized.replace(/^(a|an|the)\s+/, '');
  const words = stripped.split(' ');

  return item.acceptedAnswers.some((ans) => {
    const cleanAns = ans.replace(/^(a|an|the)\s+/, '');
    if (stripped === cleanAns || normalized === ans) return true;
    // Word-boundary exact match for multi-word answers (blocks "pineapple" matching "apple")
    if (cleanAns.includes(' ')) {
      return new RegExp(`\\b${cleanAns}\\b`).test(stripped);
    }
    return words.some(
      (w) => w === cleanAns || (cleanAns.length >= 5 && levenshtein(w, cleanAns) <= 1),
    );
  });
}
