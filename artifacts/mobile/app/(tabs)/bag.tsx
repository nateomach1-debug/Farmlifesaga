import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Platform,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useGame, InventoryItem } from '@/context/GameContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SEASON_NAMES, DAYS_PER_SEASON, CROPS } from '@/constants/gameData';

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatRow({ icon, label, value, accent }: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  value: string;
  accent?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={styles.statRow}>
      <MaterialCommunityIcons name={icon} size={16} color={accent ? colors.accent : colors.mutedForeground} />
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.statValue, { color: accent ? colors.accent : colors.foreground }]}>{value}</Text>
    </View>
  );
}

// ─── Inventory Item Card ──────────────────────────────────────────────────────

interface InventoryCardProps {
  item: InventoryItem;
  onSell: () => void;
}

function InventoryCard({ item, onSell }: InventoryCardProps) {
  const colors = useColors();
  const isCrop = CROPS.some(c => c.id === item.id);
  const iconName: React.ComponentProps<typeof MaterialCommunityIcons>['name'] = isCrop ? 'sprout' : 'diamond-stone';

  return (
    <View style={[styles.invCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.invIcon, { backgroundColor: isCrop ? colors.primary + '30' : colors.accent + '30' }]}>
        <MaterialCommunityIcons name={iconName} size={22} color={isCrop ? colors.primary : colors.accent} />
      </View>
      <Text style={[styles.invName, { color: colors.foreground }]} numberOfLines={2}>{item.name}</Text>
      <View style={styles.invBottom}>
        <Text style={[styles.invQty, { color: colors.mutedForeground }]}>×{item.quantity}</Text>
        <TouchableOpacity
          style={[styles.sellBtn, { backgroundColor: colors.secondary }]}
          onPress={onSell}
          hitSlop={8}
        >
          <MaterialCommunityIcons name="gold" size={11} color={colors.accent} />
          <Text style={[styles.sellBtnText, { color: colors.accent }]}>{item.sellPrice}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Bag Screen ───────────────────────────────────────────────────────────────

export default function BagScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state, actions } = useGame();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const seasonProgress = (state.day - 1) / DAYS_PER_SEASON;
  const totalInventoryValue = state.inventory.reduce((s, i) => s + i.sellPrice * i.quantity, 0);

  const handleSell = (itemId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    actions.sellItem(itemId, 1);
  };

  const handleSellAll = () => {
    if (state.inventory.length === 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    actions.sellAll();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Farmer's Bag</Text>
        <View style={[styles.goldChip, { backgroundColor: colors.secondary }]}>
          <MaterialCommunityIcons name="gold" size={14} color={colors.accent} />
          <Text style={[styles.goldText, { color: colors.accent }]}>{state.gold}g</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Player Stats */}
        <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Farm Stats</Text>
          <StatRow icon="calendar-today" label="Day" value={`${state.day} of ${DAYS_PER_SEASON}`} />
          <StatRow icon="leaf" label="Season" value={`${SEASON_NAMES[state.season]} · Year ${state.year}`} />
          <StatRow icon="lightning-bolt" label="Energy" value={`${state.energy} / ${state.maxEnergy}`} />
          <StatRow icon="counter" label="Days Survived" value={`${state.daysSurvived}`} />
          <StatRow icon="treasure-chest" label="Total Earned" value={`${state.totalGoldEarned}g`} accent />

          {/* Season progress */}
          <View style={styles.seasonBarWrap}>
            <Text style={[styles.seasonBarLabel, { color: colors.mutedForeground }]}>Season Progress</Text>
            <View style={[styles.seasonBar, { backgroundColor: colors.secondary }]}>
              <View style={[styles.seasonBarFill, { width: `${seasonProgress * 100}%`, backgroundColor: colors.primary }]} />
            </View>
            <Text style={[styles.seasonBarDays, { color: colors.mutedForeground }]}>
              {DAYS_PER_SEASON - state.day + 1} days left
            </Text>
          </View>
        </View>

        {/* Inventory */}
        <View style={styles.invSection}>
          <View style={styles.invHeader}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              INVENTORY · {state.inventory.length} items
            </Text>
            {state.inventory.length > 0 && (
              <TouchableOpacity
                style={[styles.sellAllBtn, { backgroundColor: colors.accent }]}
                onPress={handleSellAll}
              >
                <MaterialCommunityIcons name="gold" size={14} color={colors.accentForeground} />
                <Text style={[styles.sellAllText, { color: colors.accentForeground }]}>
                  Sell All  {totalInventoryValue}g
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {state.inventory.length === 0 ? (
            <View style={[styles.emptyInv, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="bag-outline" size={44} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Bag is Empty</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Harvest your crops or mine resources to fill it up.
              </Text>
            </View>
          ) : (
            <FlatList
              data={state.inventory}
              keyExtractor={i => i.id}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={styles.invRow}
              contentContainerStyle={{ gap: 10 }}
              renderItem={({ item }: { item: InventoryItem }) => (
                <InventoryCard
                  item={item}
                  onSell={() => handleSell(item.id)}
                />
              )}
            />
          )}
        </View>

        {/* Farm overview */}
        <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 16 }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Farm Overview</Text>
          {(() => {
            const empty = state.farmPlots.filter(p => p.state === 'empty').length;
            const growing = state.farmPlots.filter(p => p.state === 'growing' || p.state === 'seeded').length;
            const ready = state.farmPlots.filter(p => p.state === 'ready').length;
            return (
              <>
                <StatRow icon="sprout-outline" label="Growing" value={`${growing} plots`} />
                <StatRow icon="flower" label="Ready to Harvest" value={`${ready} plots`} accent={ready > 0} />
                <StatRow icon="crop" label="Empty Plots" value={`${empty} plots`} />
                <StatRow icon="pickaxe" label="Mine Floor" value={`B${state.mineLevel}`} />
              </>
            );
          })()}
        </View>
      </ScrollView>
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
  headerTitle: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  goldChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  goldText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  scrollContent: { padding: 16, gap: 16 },
  statsCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  cardTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statLabel: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular' },
  statValue: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  seasonBarWrap: { marginTop: 4, gap: 6 },
  seasonBarLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', letterSpacing: 0.5 },
  seasonBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  seasonBarFill: { height: 6, borderRadius: 3 },
  seasonBarDays: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  invSection: { gap: 12 },
  invHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.2 },
  sellAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  sellAllText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  invRow: { gap: 10 },
  invCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'flex-start',
    gap: 6,
    minHeight: 110,
  },
  invIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  invName: { fontSize: 13, fontFamily: 'Inter_600SemiBold', flex: 1 },
  invBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  invQty: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  sellBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sellBtnText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  emptyInv: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
});
