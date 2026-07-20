import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useGame, FarmPlot } from '@/context/GameContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  CROPS,
  SEASON_NAMES,
  SEASON_COLORS,
  PLANT_ENERGY_COST,
  WATER_ENERGY_COST,
  HARVEST_ENERGY_COST,
  CropData,
} from '@/constants/gameData';

// ─── Plot State Helpers ───────────────────────────────────────────────────────

function getPlotIcon(plot: FarmPlot, primaryColor: string, accentColor: string, mutedColor: string) {
  switch (plot.state) {
    case 'empty':
      return <MaterialCommunityIcons name="plus" size={28} color={mutedColor} />;
    case 'seeded':
      return <MaterialCommunityIcons name="seed-outline" size={28} color="#A07840" />;
    case 'growing':
      return <MaterialCommunityIcons name="sprout-outline" size={28} color={primaryColor} />;
    case 'ready':
      return <MaterialCommunityIcons name="flower" size={28} color={accentColor} />;
    default:
      return null;
  }
}

function getPlotBg(plot: FarmPlot, card: string, border: string): string {
  switch (plot.state) {
    case 'empty': return card;
    case 'seeded': return '#2A1C10';
    case 'growing': return '#182A10';
    case 'ready': return '#1E3A14';
    default: return card;
  }
}

// ─── Plot Cell ────────────────────────────────────────────────────────────────

interface PlotCellProps {
  plot: FarmPlot;
  isSelected: boolean;
  onPress: () => void;
  cellSize: number;
}

function PlotCell({ plot, isSelected, onPress, cellSize }: PlotCellProps) {
  const colors = useColors();
  const crop = CROPS.find(c => c.id === plot.cropId);
  const bgColor = getPlotBg(plot, colors.card, colors.border);
  const borderColor = isSelected
    ? colors.primary
    : plot.state === 'ready'
    ? colors.accent
    : colors.border;

  return (
    <TouchableOpacity
      style={[
        styles.plotCell,
        {
          width: cellSize,
          height: cellSize,
          backgroundColor: bgColor,
          borderColor,
          borderWidth: isSelected || plot.state === 'ready' ? 2 : 1,
          borderRadius: colors.radius,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {getPlotIcon(plot, colors.primary, colors.accent, colors.mutedForeground)}
      {plot.watered && plot.state !== 'empty' && plot.state !== 'ready' && (
        <View style={styles.wateredDot}>
          <Ionicons name="water" size={10} color="#4A8FD8" />
        </View>
      )}
      {crop && plot.state !== 'empty' && (
        <Text style={[styles.plotCropName, { color: colors.mutedForeground }]} numberOfLines={1}>
          {crop.name}
        </Text>
      )}
      {crop && (plot.state === 'growing' || plot.state === 'seeded') && (
        <View style={[styles.progressBar, { backgroundColor: colors.secondary }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary,
                width: `${Math.min(100, (plot.daysGrown / crop.growDays) * 100)}%`,
              },
            ]}
          />
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Seed Shop ────────────────────────────────────────────────────────────────

interface SeedShopProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (cropId: string) => void;
  season: string;
  gold: number;
  energy: number;
}

function SeedShop({ visible, onClose, onSelect, season, gold, energy }: SeedShopProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const seasonCrops = CROPS.filter(c => c.seasons.includes(season as any));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalSheet,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Plant Seeds</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={seasonCrops}
            keyExtractor={c => c.id}
            renderItem={({ item }: { item: CropData }) => {
              const canAfford = gold >= item.seedCost;
              const hasEnergy = energy >= PLANT_ENERGY_COST;
              const disabled = !canAfford || !hasEnergy;
              return (
                <TouchableOpacity
                  style={[styles.seedRow, { borderBottomColor: colors.border, opacity: disabled ? 0.45 : 1 }]}
                  onPress={() => onSelect(item.id)}
                  disabled={disabled}
                >
                  <MaterialCommunityIcons name="seed-outline" size={22} color={colors.primary} />
                  <View style={styles.seedInfo}>
                    <Text style={[styles.seedName, { color: colors.foreground }]}>{item.name}</Text>
                    <Text style={[styles.seedMeta, { color: colors.mutedForeground }]}>
                      {item.growDays}d · Sells {item.sellPrice}g
                    </Text>
                  </View>
                  <View style={[styles.costBadge, { backgroundColor: canAfford ? colors.secondary : colors.destructive }]}>
                    <MaterialCommunityIcons name="gold" size={12} color={colors.accent} />
                    <Text style={[styles.costText, { color: colors.foreground }]}>{item.seedCost}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="snowflake" size={40} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  No crops grow in Winter.{'\n'}Rest and explore the mine.
                </Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
}

// ─── Farm Screen ──────────────────────────────────────────────────────────────

export default function FarmScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state, actions } = useGame();
  const [selectedPlot, setSelectedPlot] = useState<FarmPlot | null>(null);
  const [showShop, setShowShop] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const handlePlotPress = useCallback((plot: FarmPlot) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPlot(prev => prev?.id === plot.id ? null : plot);
  }, []);

  const handlePlant = useCallback((cropId: string) => {
    if (!selectedPlot) return;
    actions.plant(selectedPlot.id, cropId);
    setSelectedPlot(null);
    setShowShop(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [selectedPlot, actions]);

  const handleWater = useCallback(() => {
    if (!selectedPlot) return;
    actions.water(selectedPlot.id);
    setSelectedPlot(s => s ? { ...s, watered: true } : null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [selectedPlot, actions]);

  const handleHarvest = useCallback(() => {
    if (!selectedPlot) return;
    actions.harvest(selectedPlot.id);
    setSelectedPlot(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [selectedPlot, actions]);

  const handleSleep = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    actions.sleep();
    setSelectedPlot(null);
  }, [actions]);

  const seasonColor = SEASON_COLORS[state.season];
  const energyPct = state.energy / state.maxEnergy;

  // Sync selectedPlot with latest state
  const currentPlot = selectedPlot
    ? state.farmPlots.find(p => p.id === selectedPlot.id) ?? null
    : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.seasonLabel, { color: seasonColor }]}>
            {SEASON_NAMES[state.season]} · Day {state.day}
          </Text>
          <Text style={[styles.yearLabel, { color: colors.mutedForeground }]}>Year {state.year}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.statChip, { backgroundColor: colors.secondary }]}>
            <MaterialCommunityIcons name="lightning-bolt" size={13} color={colors.accent} />
            <Text style={[styles.statText, { color: colors.foreground }]}>{state.energy}/{state.maxEnergy}</Text>
          </View>
          <View style={[styles.statChip, { backgroundColor: colors.secondary }]}>
            <MaterialCommunityIcons name="gold" size={13} color={colors.accent} />
            <Text style={[styles.statText, { color: colors.foreground }]}>{state.gold}g</Text>
          </View>
          <TouchableOpacity
            style={[styles.sleepBtn, { backgroundColor: colors.secondary }]}
            onPress={handleSleep}
          >
            <Ionicons name="moon" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Energy Bar ── */}
      <View style={[styles.energyBarWrap, { backgroundColor: colors.secondary }]}>
        <View style={[styles.energyBarFill, { width: `${energyPct * 100}%`, backgroundColor: energyPct > 0.3 ? colors.primary : colors.destructive }]} />
      </View>

      {/* ── Plot Grid ── */}
      <ScrollView
        contentContainerStyle={[styles.gridContainer, { paddingBottom: bottomPad + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.plotGrid}>
          {state.farmPlots.map(plot => {
            const cellSize = 110;
            return (
              <PlotCell
                key={plot.id}
                plot={state.farmPlots.find(p => p.id === plot.id)!}
                isSelected={currentPlot?.id === plot.id}
                onPress={() => handlePlotPress(plot)}
                cellSize={cellSize}
              />
            );
          })}
        </View>
      </ScrollView>

      {/* ── Action Bar ── */}
      {currentPlot && (
        <View style={[styles.actionBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: bottomPad + 8 }]}>
          <View style={styles.actionLeft}>
            {currentPlot.state === 'empty' && state.season !== 'winter' && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                onPress={() => setShowShop(true)}
                disabled={state.energy < PLANT_ENERGY_COST}
              >
                <MaterialCommunityIcons name="seed-outline" size={16} color={colors.primaryForeground} />
                <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>Plant  –{PLANT_ENERGY_COST}</Text>
              </TouchableOpacity>
            )}
            {currentPlot.state === 'empty' && state.season === 'winter' && (
              <Text style={[styles.winterMsg, { color: colors.mutedForeground }]}>Fields rest in winter</Text>
            )}
            {(currentPlot.state === 'seeded' || currentPlot.state === 'growing') && !currentPlot.watered && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#2A5FA8', opacity: state.energy < WATER_ENERGY_COST ? 0.5 : 1 }]}
                onPress={handleWater}
                disabled={state.energy < WATER_ENERGY_COST}
              >
                <Ionicons name="water" size={16} color="#FFF" />
                <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Water  –{WATER_ENERGY_COST}</Text>
              </TouchableOpacity>
            )}
            {(currentPlot.state === 'seeded' || currentPlot.state === 'growing') && currentPlot.watered && (
              <Text style={[styles.wateredMsg, { color: colors.primary }]}>
                Watered today
              </Text>
            )}
            {currentPlot.state === 'ready' && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.accent, opacity: state.energy < HARVEST_ENERGY_COST ? 0.5 : 1 }]}
                onPress={handleHarvest}
                disabled={state.energy < HARVEST_ENERGY_COST}
              >
                <MaterialCommunityIcons name="hand-back-right-outline" size={16} color={colors.accentForeground} />
                <Text style={[styles.actionBtnText, { color: colors.accentForeground }]}>Harvest  –{HARVEST_ENERGY_COST}</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={() => setSelectedPlot(null)} hitSlop={12}>
            <Ionicons name="close-circle" size={26} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      )}

      <SeedShop
        visible={showShop}
        onClose={() => setShowShop(false)}
        onSelect={handlePlant}
        season={state.season}
        gold={state.gold}
        energy={state.energy}
      />
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
  seasonLabel: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  yearLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  sleepBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  energyBarWrap: { height: 3, width: '100%' },
  energyBarFill: { height: 3 },
  gridContainer: { paddingHorizontal: 16, paddingTop: 16 },
  plotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  plotCell: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    gap: 2,
  },
  wateredDot: { position: 'absolute', top: 6, right: 6 },
  plotCropName: { fontSize: 9, fontFamily: 'Inter_500Medium', textAlign: 'center' },
  progressBar: { width: '80%', height: 3, borderRadius: 2, marginTop: 2 },
  progressFill: { height: 3, borderRadius: 2 },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
  },
  actionBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  winterMsg: { fontSize: 14, fontFamily: 'Inter_400Regular', fontStyle: 'italic' },
  wateredMsg: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  seedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  seedInfo: { flex: 1 },
  seedName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  seedMeta: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  costBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  costText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22 },
});
