export type Season = 'spring' | 'summer' | 'fall' | 'winter';
export type TileType = 'stone' | 'coal' | 'iron' | 'gold' | 'gem' | 'diamond';

export interface CropData {
  id: string;
  name: string;
  seasons: Season[];
  growDays: number;
  seedCost: number;
  sellPrice: number;
}

export interface NPCData {
  id: string;
  name: string;
  role: string;
  color: string;
  dialogues: string[];
  giftDialogues: string[];
  favoriteItems: string[];
}

export interface MineResourceData {
  id: TileType;
  name: string;
  sellPrice: number;
  color: string;
  rarity: string;
}

export const CROPS: CropData[] = [
  { id: 'parsnip', name: 'Parsnip', seasons: ['spring'], growDays: 4, seedCost: 20, sellPrice: 35 },
  { id: 'potato', name: 'Potato', seasons: ['spring'], growDays: 6, seedCost: 50, sellPrice: 80 },
  { id: 'tulip', name: 'Tulip', seasons: ['spring'], growDays: 4, seedCost: 20, sellPrice: 30 },
  { id: 'cauliflower', name: 'Cauliflower', seasons: ['spring'], growDays: 12, seedCost: 80, sellPrice: 175 },
  { id: 'melon', name: 'Melon', seasons: ['summer'], growDays: 12, seedCost: 80, sellPrice: 250 },
  { id: 'tomato', name: 'Tomato', seasons: ['summer'], growDays: 11, seedCost: 50, sellPrice: 60 },
  { id: 'wheat', name: 'Wheat', seasons: ['summer', 'fall'], growDays: 4, seedCost: 10, sellPrice: 25 },
  { id: 'sunflower', name: 'Sunflower', seasons: ['summer', 'fall'], growDays: 8, seedCost: 40, sellPrice: 80 },
  { id: 'pumpkin', name: 'Pumpkin', seasons: ['fall'], growDays: 7, seedCost: 100, sellPrice: 320 },
  { id: 'cranberry', name: 'Cranberry', seasons: ['fall'], growDays: 7, seedCost: 240, sellPrice: 75 },
  { id: 'bokchoy', name: 'Bok Choy', seasons: ['fall'], growDays: 4, seedCost: 50, sellPrice: 80 },
  { id: 'yam', name: 'Yam', seasons: ['fall'], growDays: 10, seedCost: 60, sellPrice: 160 },
];

export const NPCS: NPCData[] = [
  {
    id: 'rosalind',
    name: 'Rosalind',
    role: 'Florist',
    color: '#E87E7E',
    dialogues: [
      'The tulips are blooming so beautifully this spring!',
      'Every flower tells a story if you listen.',
      'Have you tried growing flowers on your farm?',
      'The seasons change, but beauty always returns.',
      'I pressed some wildflowers today. Such simple joy.',
    ],
    giftDialogues: ['Oh, how lovely! Thank you so much!', 'This is exactly what I needed today.'],
    favoriteItems: ['tulip', 'sunflower', 'gem'],
  },
  {
    id: 'marcus',
    name: 'Marcus',
    role: 'Blacksmith',
    color: '#8E8E8E',
    dialogues: [
      'The anvil never rests. Neither should a farmer.',
      'A good tool lasts a lifetime if you care for it.',
      'The deeper you go in the mine, the better the rewards.',
      'Iron and sweat — that is the foundation of all things.',
      'I can hear the mountain calling. Can you?',
    ],
    giftDialogues: ['Ha! Now that is useful.', 'A fine gift. I will put it to good use.'],
    favoriteItems: ['iron', 'gold', 'diamond'],
  },
  {
    id: 'luna',
    name: 'Luna',
    role: 'Herbalist',
    color: '#9B7FD4',
    dialogues: [
      'The stars whisper of a great harvest this season.',
      'Every plant holds a secret if you are patient.',
      'Nature is not magic — it just requires attention.',
      'Something stirs beneath the mine. Be careful.',
      'I dreamed of silver fields last night. Curious.',
    ],
    giftDialogues: ['Interesting... this will serve me well.', 'I somehow knew you would bring this.'],
    favoriteItems: ['gem', 'diamond', 'tulip', 'cranberry'],
  },
  {
    id: 'barnaby',
    name: 'Barnaby',
    role: 'Elder Farmer',
    color: '#D4A05A',
    dialogues: [
      'I have farmed this valley for sixty years. The soil still surprises me.',
      'Water your crops every day, without fail. That is the secret.',
      'A good harvest starts with honest seeds and honest work.',
      'Winter is for rest and reflection. Use it well.',
      'Back in my day, we planted by the moon. Try it sometime.',
    ],
    giftDialogues: ['Well, I will be! Thank you, young one.', 'Back in my day we worked for these!'],
    favoriteItems: ['pumpkin', 'potato', 'melon', 'yam'],
  },
  {
    id: 'cleo',
    name: 'Cleo',
    role: 'Cafe Owner',
    color: '#7EC8A0',
    dialogues: [
      'Fresh coffee and fresh crops — the perfect morning.',
      'I am baking a new pie today. The whole town can smell it!',
      'Business is wonderful when the harvest is good.',
      'You look tired. Sleep is free, you know.',
      'I heard there is something special deep in the mine.',
    ],
    giftDialogues: ['Oh, perfect! Into the kitchen it goes!', 'You are too kind, darling!'],
    favoriteItems: ['melon', 'wheat', 'bokchoy', 'tomato'],
  },
];

export const MINE_RESOURCES: MineResourceData[] = [
  { id: 'stone', name: 'Stone', sellPrice: 5, color: '#6B6B6B', rarity: 'Common' },
  { id: 'coal', name: 'Coal', sellPrice: 15, color: '#2E2E2E', rarity: 'Common' },
  { id: 'iron', name: 'Iron Ore', sellPrice: 30, color: '#A05020', rarity: 'Uncommon' },
  { id: 'gold', name: 'Gold Ore', sellPrice: 60, color: '#C8960A', rarity: 'Rare' },
  { id: 'gem', name: 'Amethyst', sellPrice: 200, color: '#6B28B8', rarity: 'Very Rare' },
  { id: 'diamond', name: 'Diamond', sellPrice: 500, color: '#00A8C8', rarity: 'Legendary' },
];

export const SEASONS: Season[] = ['spring', 'summer', 'fall', 'winter'];
export const SEASON_NAMES: Record<Season, string> = {
  spring: 'Spring',
  summer: 'Summer',
  fall: 'Fall',
  winter: 'Winter',
};
export const SEASON_COLORS: Record<Season, string> = {
  spring: '#7EC87E',
  summer: '#F0C040',
  fall: '#D07030',
  winter: '#90B8D8',
};

export const DAYS_PER_SEASON = 28;
export const MAX_ENERGY = 50;
export const STARTING_GOLD = 500;
export const FARM_PLOTS_COUNT = 12;
export const MINE_FLOOR_SIZE = 25; // 5x5
export const PLANT_ENERGY_COST = 5;
export const WATER_ENERGY_COST = 3;
export const HARVEST_ENERGY_COST = 5;
export const MINE_ENERGY_COST = 8;
export const GIFT_ENERGY_COST = 5;
