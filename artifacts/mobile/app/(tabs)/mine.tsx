import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useGame, MineTile } from '@/context/GameContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { MINE_RESOURCES, MINE_ENERGY_COST, MINE_FLOOR_SIZE, MineResourceData } from '@/constants/gameData';
import { TileType } from '@/constants/gameData';

const NUM_COLS = 5;
const DESCEND_THRESHOLD = Math.floor(MINE_FLOOR_SIZE * 0.8);

const TILE_CONFIG: Record<TileType, { color: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'] }> = {
  stone: { color: '#5A5A5A', icon: 'cube-outline' },
  coal: { color: '#2A2A2A', icon: 'circle' },
  iron: { color: '#A05020', icon: 'triangle-outline' },
  gold: { color: '#C8960A', icon: 'star-outline' },
  gem: { color: '#7B2FBE', icon: 'diamond-outline' },
  diamond: { color: '#00A8C8', icon: 'diamond' },
};

// ─── Mine Tile Cell ───────────────────────────────────────────────────────────

interface MineTileCellProps {
  tile: MineTile;
  cellSize: number;
  onPress: () => void;
  canMine: boolean;
}

function MineTileCell({ tile, cellSize, onPress, canMine }: MineTileCellProps) {
  const colors = useColors();
  const config = TILE_CONFIG[tile.type];

  if (tile.mined) {
    return (
      <View
        style={[
          styles.tileCell,
          {
            width: cellSize,
            height: cellSize,
            backgroundColor: colors.muted,
            borderColor: colors.border,
            borderRadius: 6,
          },
        ]}
      />
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.tileCell,
        {
          width: cellSize,
          height: cellSize,
          backgroundColor: config.color + 'CC',
          borderColor: config.color,
          borderRadius: 6,
          opacity: canMine ? 1 : 0.6,
        },
      ]}
      onPress={onPress}
      disabled={!canMine || tile.mined}
      activeOpacity={0.65}
    >
      <MaterialCommunityIcons name={config.icon} size={20} color="#FFFFFF99" />
    </TouchableOpacity>
  );
}

// ─── Legend Item ──────────────────────────────────────────────────────────────

function LegendItem({ resource }: { resource: MineResourceData }) {
  const colors = useColors();
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: resource.color }]} />
      <Text style={[styles.legendName, { color: colors.mutedForeground }]}>{resource.name}</Text>
      <Text style={[styles.legendPrice, { color: colors.accent }]}>{resource.sellPrice}g</Text>
    </View>
  );
}

// ─── Mine Screen ──────────────────────────────────────────────────────────────

export default function MineScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state, actions } = useGame();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const minedCount = state.mineFloor.filter(t => t.mined).length;
  const totalTiles = state.mineFloor.length;
  const progressPct = minedCount / totalTiles;
  const canDescend = minedCount >= DESCEND_THRESHOLD;
  const canMine = state.energy >= MINE_ENERGY_COST;

  const handleMineTile = useCallback((tileId: number) => {
    if (!canMine) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    actions.mineTile(tileId);
  }, [canMine, actions]);

  const handleDescend = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    actions.descendMine(state.mineLevel);
  }, [actions, state.mineLevel]);

  // Cell sizing
  const gridPad = 32;
  const gap = 6;
  const cellSize = Math.floor((350 - gridPad - (gap * (NUM_COLS - 1))) / NUM_COLS);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.floorLabel, { color: colors.accent }]}>Floor B{state.mineLevel}</Text>
          <Text style={[styles.floorSub, { color: colors.mutedForeground }]}>
            {minedCount}/{totalTiles} tiles mined
          </Text>
        </View>
        <View style={styles.headerStats}>
          <View style={[styles.statChip, { backgroundColor: colors.secondary }]}>
            <MaterialCommunityIcons name="lightning-bolt" size={13} color={colors.accent} />
            <Text style={[styles.statText, { color: colors.foreground }]}>{state.energy}/{state.maxEnergy}</Text>
          </View>
          {canDescend && (
            <TouchableOpacity
              style={[styles.descendBtn, { backgroundColor: colors.accent }]}
              onPress={handleDescend}
            >
              <MaterialCommunityIcons name="arrow-down-bold" size={16} color={colors.accentForeground} />
              <Text style={[styles.descendText, { color: colors.accentForeground }]}>Descend</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressWrap, { backgroundColor: colors.secondary }]}>
        <View style={[styles.progressFill, { width: `${progressPct * 100}%`, backgroundColor: canDescend ? colors.accent : colors.primary }]} />
      </View>

      {/* Energy warning */}
      {!canMine && (
        <View style={[styles.warningBar, { backgroundColor: colors.destructive + '22' }]}>
          <MaterialCommunityIcons name="lightning-bolt-outline" size={14} color={colors.destructive} />
          <Text style={[styles.warningText, { color: colors.destructive }]}>
            No energy — sleep to restore
          </Text>
        </View>
      )}

      {/* Mine Grid */}
      <View style={[styles.gridWrap, { paddingBottom: bottomPad + 100 }]}>
        <FlatList
          data={state.mineFloor}
          keyExtractor={t => t.id.toString()}
          numColumns={NUM_COLS}
          scrollEnabled={false}
          columnWrapperStyle={{ gap }}
          contentContainerStyle={{ gap }}
          renderItem={({ item }) => (
            <MineTileCell
              tile={item}
              cellSize={cellSize}
              onPress={() => handleMineTile(item.id)}
              canMine={canMine}
            />
          )}
        />
      </View>

      {/* Resources Legend */}
      <View style={[styles.legend, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: bottomPad + 8 }]}>
        <Text style={[styles.legendTitle, { color: colors.mutedForeground }]}>RESOURCES  ·  COST {MINE_ENERGY_COST} ENERGY</Text>
        <View style={styles.legendGrid}>
          {MINE_RESOURCES.map(r => <LegendItem key={r.id} resource={r} />)}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  floorLabel: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  floorSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  headerStats: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  descendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  descendText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  progressWrap: { height: 4, width: '100%' },
  progressFill: { height: 4 },
  warningBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  warningText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  gridWrap: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  tileCell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  legend: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  legendTitle: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 1, marginBottom: 8 },
  legendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5, minWidth: 100 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendName: { fontSize: 11, fontFamily: 'Inter_400Regular', flex: 1 },
  legendPrice: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
});
