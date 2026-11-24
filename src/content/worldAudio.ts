import type { FarmSpeechKey, HomeSpeechKey, SpeechKey, VisemeCue } from '../domain/types';

export interface WorldSpeechLine {
  key: SpeechKey;
  src: string;
  phrase: string;
  fallbackDurationMs: number;
  cues: readonly VisemeCue[];
}

function quickLine<K extends HomeSpeechKey | FarmSpeechKey>(
  key: K,
  phrase: string,
  durationMs = 1750,
): WorldSpeechLine {
  const step = Math.max(0.28, (durationMs / 1000 - 0.15) / 4);
  return {
    key,
    src: `/audio/lesson1/${key}.mp3`,
    phrase,
    fallbackDurationMs: durationMs,
    cues: [
      { at: 0.0, viseme: 'viseme_aa' },
      { at: Number(step.toFixed(2)), viseme: 'viseme_oo' },
      { at: Number((step * 2).toFixed(2)), viseme: 'viseme_ee' },
      { at: Number((step * 3).toFixed(2)), viseme: 'viseme_mbp' },
      { at: Number((step * 4).toFixed(2)), viseme: null },
    ],
  };
}

export const WORLD_AUDIO_LINES: Record<HomeSpeechKey | FarmSpeechKey, WorldSpeechLine> = {
  // Leo's House 2.5D Interior (A1 Home & Daily Routine)
  home_sofa: quickLine('home_sofa', 'A soft sofa! Sit and relax in the living room.', 2000),
  home_lamp_on: quickLine('home_lamp_on', 'Turn on the lamp! Nice and bright.', 1800),
  home_lamp_off: quickLine('home_lamp_off', 'Turn off the lamp! Cozy evening light.', 1800),
  home_fridge: quickLine('home_fridge', 'Open the fridge! Cold milk and fresh fruit inside.', 2100),
  home_kettle: quickLine('home_kettle', 'A warm kettle! Boiling water for tea or coffee.', 2050),
  home_bed: quickLine('home_bed', 'A cozy bed! Time to sleep and rest.', 1850),
  home_bookshelf: quickLine('home_bookshelf', 'A tall bookshelf! Many English stories to read.', 2050),
  home_wardrobe: quickLine('home_wardrobe', 'Open the wardrobe! Choose a new outfit.', 1900),

  // Sunny Farm 2.5D Biome (A1 Nature, Animals & Routine)
  farm_cow: quickLine('farm_cow', 'Moo! A friendly cow gives fresh milk for the cafe.', 2150),
  farm_chicken: quickLine('farm_chicken', 'Cluck cluck! Chickens lay fresh eggs every morning.', 2150),
  farm_horse: quickLine('farm_horse', 'A strong brown horse grazing on the green farm!', 2050),
  farm_water_crop: quickLine('farm_water_crop', 'Water the seeds! Watch the plants grow tall.', 1950),
  farm_harvest: quickLine('farm_harvest', 'Harvest time! Fresh carrots and corn from the garden.', 2150),
  farm_tractor: quickLine('farm_tractor', 'A red tractor! It helps work the big farm field.', 2050),
  farm_barn: quickLine('farm_barn', 'A big red barn! The animals sleep safe inside.', 2000),
};
