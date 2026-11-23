import type { SpeechKey } from './types';

export interface InventoryItem {
  id: string;
  icon: string;
  label: string;
  speechKey: SpeechKey;
}

export const INVENTORY_CATALOG: Record<string, InventoryItem> = {
  bread: { id: 'bread', icon: '🥖', label: 'Bread', speechKey: 'world_bakery_bread' },
  cake: { id: 'cake', icon: '🎂', label: 'Cake', speechKey: 'world_bakery_cake' },
  shoes: { id: 'shoes', icon: '👟', label: 'Shoes', speechKey: 'world_clothes_shoes' },
  headphones: { id: 'headphones', icon: '🎧', label: 'Headphones', speechKey: 'world_tech_headphones' },
  bandaid: { id: 'bandaid', icon: '🩹', label: 'Band-aid', speechKey: 'world_pharmacy_bandaid' },
  medicine: { id: 'medicine', icon: '💊', label: 'Medicine', speechKey: 'world_pharmacy_medicine' },
  petfood: { id: 'petfood', icon: '🦴', label: 'Pet food', speechKey: 'world_pet_food' },
  scissors: { id: 'scissors', icon: '✂️', label: 'Scissors', speechKey: 'world_barber_scissors' },
  book: { id: 'book', icon: '📖', label: 'Book', speechKey: 'world_book_read' },
  pizza: { id: 'pizza', icon: '🍕', label: 'Pizza', speechKey: 'world_pizza_slice' },
  package: { id: 'package', icon: '📦', label: 'Package', speechKey: 'world_post_package' },
  apple: { id: 'apple', icon: '🍎', label: 'Apple', speechKey: 'market_apple' },
  banana: { id: 'banana', icon: '🍌', label: 'Banana', speechKey: 'fruit_banana' },
  orange: { id: 'orange', icon: '🍊', label: 'Orange', speechKey: 'fruit_orange' },
  strawberry: { id: 'strawberry', icon: '🍓', label: 'Strawberry', speechKey: 'fruit_strawberry' },
  grapes: { id: 'grapes', icon: '🍇', label: 'Grapes', speechKey: 'fruit_grapes' },
  watermelon: { id: 'watermelon', icon: '🍉', label: 'Watermelon', speechKey: 'fruit_watermelon' },
};

export interface NpcQuest {
  id: string;
  npcIcon: string;
  npcName: string;
  prompt: string;
  targetItemId: string;
  targetIcon: string;
  askSpeechKey: SpeechKey;
  doneSpeechKey: SpeechKey;
}

export const CITY_QUESTS: readonly NpcQuest[] = [
  {
    id: 'quest_leo_bread',
    npcIcon: '☕',
    npcName: 'Barista Leo',
    prompt: 'Bring me fresh bread from the bakery!',
    targetItemId: 'bread',
    targetIcon: '🥖',
    askSpeechKey: 'quest_leo_bread_ask',
    doneSpeechKey: 'quest_leo_bread_done',
  },
  {
    id: 'quest_mechanic_banana',
    npcIcon: '🔧',
    npcName: 'Mechanic',
    prompt: 'Bring me a yellow banana from the market!',
    targetItemId: 'banana',
    targetIcon: '🍌',
    askSpeechKey: 'quest_mechanic_banana_ask',
    doneSpeechKey: 'quest_mechanic_banana_done',
  },
  {
    id: 'quest_vet_petfood',
    npcIcon: '🩺',
    npcName: 'Vet',
    prompt: 'Bring me pet food for the puppy!',
    targetItemId: 'petfood',
    targetIcon: '🦴',
    askSpeechKey: 'world_pet_food',
    doneSpeechKey: 'world_pet_dog',
  },
  {
    id: 'quest_librarian_book',
    npcIcon: '📚',
    npcName: 'Librarian',
    prompt: 'Bring me a good book from the bookshop!',
    targetItemId: 'book',
    targetIcon: '📖',
    askSpeechKey: 'world_book_read',
    doneSpeechKey: 'job_librarian',
  },
  {
    id: 'quest_chef_pizza',
    npcIcon: '👨‍🍳',
    npcName: 'Chef',
    prompt: 'Bring me a hot pizza from the pizzeria!',
    targetItemId: 'pizza',
    targetIcon: '🍕',
    askSpeechKey: 'world_pizza_slice',
    doneSpeechKey: 'job_chef',
  },
];

export function getActiveQuest(completedQuestIds: readonly string[]): NpcQuest | null {
  return CITY_QUESTS.find((q) => !completedQuestIds.includes(q.id)) ?? null;
}

export function canDeliverQuest(quest: NpcQuest | null, inventoryIds: readonly string[]): boolean {
  if (!quest) return false;
  return inventoryIds.includes(quest.targetItemId);
}
