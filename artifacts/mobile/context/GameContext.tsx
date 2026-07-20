import React, { createContext, useContext, useEffect, useReducer, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CROPS,
  MINE_RESOURCES,
  NPCS,
  SEASONS,
  Season,
  TileType,
  DAYS_PER_SEASON,
  MAX_ENERGY,
  STARTING_GOLD,
  FARM_PLOTS_COUNT,
  MINE_FLOOR_SIZE,
  PLANT_ENERGY_COST,
  WATER_ENERGY_COST,
  HARVEST_ENERGY_COST,
  MINE_ENERGY_COST,
  GIFT_ENERGY_COST,
} from '@/constants/gameData';

const SAVE_KEY = '@harvest_vale_v1';

export interface FarmPlot {
  id: number;
  state: 'empty' | 'seeded' | 'growing' | 'ready';
  cropId: string | null;
  daysGrown: number;
  watered: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  sellPrice: number;
}

export interface NPCState {
  id: string;
  hearts: number;
  lastGiftDay: number;
}

export interface MineTile {
  id: number;
  type: TileType;
  mined: boolean;
}

export interface GameState {
  day: number;
  season: Season;
  year: number;
  gold: number;
  energy: number;
  maxEnergy: number;
  farmPlots: FarmPlot[];
  inventory: InventoryItem[];
  npcs: NPCState[];
  mineLevel: number;
  mineFloor: MineTile[];
  daysSurvived: number;
  totalGoldEarned: number;
}

export function generateMineFloor(level: number): MineTile[] {
  return Array.from({ length: MINE_FLOOR_SIZE }, (_, i) => {
    const rand = Math.random();
    let type: TileType;
    if (level <= 5) {
      type = rand < 0.60 ? 'stone' : rand < 0.82 ? 'coal' : 'iron';
    } else if (level <= 15) {
      type =
        rand < 0.40 ? 'stone' :
        rand < 0.58 ? 'coal' :
        rand < 0.76 ? 'iron' :
        rand < 0.93 ? 'gold' : 'gem';
    } else {
      type =
        rand < 0.20 ? 'stone' :
        rand < 0.35 ? 'coal' :
        rand < 0.52 ? 'iron' :
        rand < 0.70 ? 'gold' :
        rand < 0.90 ? 'gem' : 'diamond';
    }
    return { id: i, type, mined: false };
  });
}

const DEFAULT_FARM_PLOTS: FarmPlot[] = Array.from({ length: FARM_PLOTS_COUNT }, (_, i) => ({
  id: i,
  state: 'empty',
  cropId: null,
  daysGrown: 0,
  watered: false,
}));

const DEFAULT_NPC_STATES: NPCState[] = NPCS.map(n => ({
  id: n.id,
  hearts: 0,
  lastGiftDay: -1,
}));

function createInitialState(): GameState {
  return {
    day: 1,
    season: 'spring',
    year: 1,
    gold: STARTING_GOLD,
    energy: MAX_ENERGY,
    maxEnergy: MAX_ENERGY,
    farmPlots: DEFAULT_FARM_PLOTS,
    inventory: [],
    npcs: DEFAULT_NPC_STATES,
    mineLevel: 1,
    mineFloor: generateMineFloor(1),
    daysSurvived: 0,
    totalGoldEarned: 0,
  };
}

type GameAction =
  | { type: 'LOAD'; payload: GameState }
  | { type: 'PLANT'; plotId: number; cropId: string }
  | { type: 'WATER'; plotId: number }
  | { type: 'HARVEST'; plotId: number }
  | { type: 'SLEEP' }
  | { type: 'GIFT_NPC'; npcId: string; itemId: string }
  | { type: 'MINE_TILE'; tileId: number }
  | { type: 'DESCEND_MINE'; newLevel: number; newFloor: MineTile[] }
  | { type: 'SELL_ITEM'; itemId: string; quantity: number }
  | { type: 'SELL_ALL' };

function addToInventory(inventory: InventoryItem[], id: string, name: string, sellPrice: number, qty = 1): InventoryItem[] {
  const existing = inventory.find(i => i.id === id);
  if (existing) {
    return inventory.map(i => i.id === id ? { ...i, quantity: i.quantity + qty } : i);
  }
  return [...inventory, { id, name, quantity: qty, sellPrice }];
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'LOAD':
      return action.payload;

    case 'PLANT': {
      const crop = CROPS.find(c => c.id === action.cropId);
      if (!crop) return state;
      if (state.energy < PLANT_ENERGY_COST) return state;
      if (state.gold < crop.seedCost) return state;
      if (!crop.seasons.includes(state.season)) return state;
      const plot = state.farmPlots.find(p => p.id === action.plotId);
      if (!plot || plot.state !== 'empty') return state;
      return {
        ...state,
        energy: state.energy - PLANT_ENERGY_COST,
        gold: state.gold - crop.seedCost,
        farmPlots: state.farmPlots.map(p =>
          p.id === action.plotId
            ? { ...p, state: 'seeded', cropId: action.cropId, daysGrown: 0, watered: false }
            : p
        ),
      };
    }

    case 'WATER': {
      const plot = state.farmPlots.find(p => p.id === action.plotId);
      if (!plot || plot.state === 'empty' || plot.state === 'ready' || plot.watered) return state;
      if (state.energy < WATER_ENERGY_COST) return state;
      return {
        ...state,
        energy: state.energy - WATER_ENERGY_COST,
        farmPlots: state.farmPlots.map(p =>
          p.id === action.plotId ? { ...p, watered: true } : p
        ),
      };
    }

    case 'HARVEST': {
      const plot = state.farmPlots.find(p => p.id === action.plotId);
      if (!plot || plot.state !== 'ready') return state;
      if (state.energy < HARVEST_ENERGY_COST) return state;
      const crop = CROPS.find(c => c.id === plot.cropId);
      if (!crop) return state;
      return {
        ...state,
        energy: state.energy - HARVEST_ENERGY_COST,
        farmPlots: state.farmPlots.map(p =>
          p.id === action.plotId
            ? { id: p.id, state: 'empty', cropId: null, daysGrown: 0, watered: false }
            : p
        ),
        inventory: addToInventory(state.inventory, crop.id, crop.name, crop.sellPrice),
      };
    }

    case 'SLEEP': {
      const rawNextDay = state.day + 1;
      const seasonIndex = SEASONS.indexOf(state.season);
      const seasonOver = rawNextDay > DAYS_PER_SEASON;
      const nextSeasonIndex = seasonOver ? (seasonIndex + 1) % 4 : seasonIndex;
      const nextSeason = SEASONS[nextSeasonIndex];
      const nextDay = seasonOver ? 1 : rawNextDay;
      const nextYear = seasonOver && nextSeasonIndex === 0 ? state.year + 1 : state.year;
      const seasonChanged = nextSeason !== state.season;

      const updatedPlots = state.farmPlots.map(plot => {
        if (plot.state === 'empty' || plot.state === 'ready') return plot;
        const crop = CROPS.find(c => c.id === plot.cropId);
        if (!crop) return { id: plot.id, state: 'empty' as const, cropId: null, daysGrown: 0, watered: false };
        if (seasonChanged && !crop.seasons.includes(nextSeason)) {
          return { id: plot.id, state: 'empty' as const, cropId: null, daysGrown: 0, watered: false };
        }
        const newDaysGrown = plot.watered ? plot.daysGrown + 1 : plot.daysGrown;
        const isReady = newDaysGrown >= crop.growDays;
        return {
          ...plot,
          state: isReady ? 'ready' as const : (newDaysGrown > 0 ? 'growing' as const : 'seeded' as const),
          daysGrown: newDaysGrown,
          watered: false,
        };
      });

      return {
        ...state,
        day: nextDay,
        season: nextSeason,
        year: nextYear,
        energy: state.maxEnergy,
        daysSurvived: state.daysSurvived + 1,
        farmPlots: updatedPlots,
      };
    }

    case 'GIFT_NPC': {
      const invItem = state.inventory.find(i => i.id === action.itemId);
      if (!invItem || invItem.quantity < 1) return state;
      if (state.energy < GIFT_ENERGY_COST) return state;
      const npc = state.npcs.find(n => n.id === action.npcId);
      if (!npc) return state;
      if (npc.lastGiftDay === state.daysSurvived) return state;
      const npcData = NPCS.find(n => n.id === action.npcId);
      const isFavorite = npcData?.favoriteItems.includes(action.itemId) ?? false;
      const heartsGain = isFavorite ? 2 : 1;
      const newInventory = invItem.quantity === 1
        ? state.inventory.filter(i => i.id !== action.itemId)
        : state.inventory.map(i => i.id === action.itemId ? { ...i, quantity: i.quantity - 1 } : i);
      return {
        ...state,
        energy: state.energy - GIFT_ENERGY_COST,
        inventory: newInventory,
        npcs: state.npcs.map(n =>
          n.id === action.npcId
            ? { ...n, hearts: Math.min(10, n.hearts + heartsGain), lastGiftDay: state.daysSurvived }
            : n
        ),
      };
    }

    case 'MINE_TILE': {
      const tile = state.mineFloor.find(t => t.id === action.tileId);
      if (!tile || tile.mined) return state;
      if (state.energy < MINE_ENERGY_COST) return state;
      const resource = MINE_RESOURCES.find(r => r.id === tile.type);
      if (!resource) return state;
      return {
        ...state,
        energy: state.energy - MINE_ENERGY_COST,
        mineFloor: state.mineFloor.map(t => t.id === action.tileId ? { ...t, mined: true } : t),
        inventory: addToInventory(state.inventory, resource.id, resource.name, resource.sellPrice),
      };
    }

    case 'DESCEND_MINE':
      return {
        ...state,
        mineLevel: action.newLevel,
        mineFloor: action.newFloor,
      };

    case 'SELL_ITEM': {
      const item = state.inventory.find(i => i.id === action.itemId);
      if (!item) return state;
      const qty = Math.min(action.quantity, item.quantity);
      const earned = item.sellPrice * qty;
      const newInventory = item.quantity - qty === 0
        ? state.inventory.filter(i => i.id !== action.itemId)
        : state.inventory.map(i => i.id === action.itemId ? { ...i, quantity: i.quantity - qty } : i);
      return {
        ...state,
        gold: state.gold + earned,
        totalGoldEarned: state.totalGoldEarned + earned,
        inventory: newInventory,
      };
    }

    case 'SELL_ALL': {
      const totalEarned = state.inventory.reduce((sum, i) => sum + i.sellPrice * i.quantity, 0);
      return {
        ...state,
        gold: state.gold + totalEarned,
        totalGoldEarned: state.totalGoldEarned + totalEarned,
        inventory: [],
      };
    }

    default:
      return state;
  }
}

interface GameContextValue {
  state: GameState;
  loading: boolean;
  actions: {
    plant: (plotId: number, cropId: string) => void;
    water: (plotId: number) => void;
    harvest: (plotId: number) => void;
    sleep: () => void;
    giftNPC: (npcId: string, itemId: string) => void;
    mineTile: (tileId: number) => void;
    descendMine: (currentLevel: number) => void;
    sellItem: (itemId: string, quantity: number) => void;
    sellAll: () => void;
  };
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);

  useEffect(() => {
    AsyncStorage.getItem(SAVE_KEY)
      .then(data => {
        if (data) {
          try {
            const saved = JSON.parse(data) as GameState;
            dispatch({ type: 'LOAD', payload: saved });
          } catch {}
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading) {
      AsyncStorage.setItem(SAVE_KEY, JSON.stringify(state)).catch(() => {});
    }
  }, [state, loading]);

  const actions: GameContextValue['actions'] = {
    plant: (plotId, cropId) => dispatch({ type: 'PLANT', plotId, cropId }),
    water: (plotId) => dispatch({ type: 'WATER', plotId }),
    harvest: (plotId) => dispatch({ type: 'HARVEST', plotId }),
    sleep: () => dispatch({ type: 'SLEEP' }),
    giftNPC: (npcId, itemId) => dispatch({ type: 'GIFT_NPC', npcId, itemId }),
    mineTile: (tileId) => dispatch({ type: 'MINE_TILE', tileId }),
    descendMine: (currentLevel) =>
      dispatch({ type: 'DESCEND_MINE', newLevel: currentLevel + 1, newFloor: generateMineFloor(currentLevel + 1) }),
    sellItem: (itemId, quantity) => dispatch({ type: 'SELL_ITEM', itemId, quantity }),
    sellAll: () => dispatch({ type: 'SELL_ALL' }),
  };

  return (
    <GameContext.Provider value={{ state, loading, actions }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
