import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { NPCS, SEASON_NAMES, NPCData, GIFT_ENERGY_COST } from '@/constants/gameData';

// ─── Heart Display ────────────────────────────────────────────────────────────

function HeartDisplay({ hearts, max = 10 }: { hearts: number; max?: number }) {
  const colors = useColors();
  return (
    <View style={styles.heartsRow}>
      {Array.from({ length: max }, (_, i) => (
        <Ionicons
          key={i}
          name={i < hearts ? 'heart' : 'heart-outline'}
          size={12}
          color={i < hearts ? '#E87070' : colors.mutedForeground}
        />
      ))}
    </View>
  );
}

// ─── NPC Detail Modal ─────────────────────────────────────────────────────────

interface NPCModalProps {
  npc: NPCData | null;
  hearts: number;
  alreadyGifted: boolean;
  onClose: () => void;
  onGift: (itemId: string) => void;
  inventory: { id: string; name: string; quantity: number }[];
  energy: number;
}

function NPCModal({ npc, hearts, alreadyGifted, onClose, onGift, inventory, energy }: NPCModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  if (!npc) return null;

  const today = new Date();
  const dialogue = npc.dialogues[today.getDate() % npc.dialogues.length];
  const giftableItems = inventory.filter(i => i.quantity > 0);
  const canGift = !alreadyGifted && energy >= GIFT_ENERGY_COST;

  return (
    <Modal visible={!!npc} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalSheet,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 16,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={[styles.npcAvatarLg, { backgroundColor: npc.color + '33', borderColor: npc.color }]}>
              <Text style={[styles.npcInitialLg, { color: npc.color }]}>{npc.name[0]}</Text>
            </View>
            <View style={styles.modalNpcInfo}>
              <Text style={[styles.modalNpcName, { color: colors.foreground }]}>{npc.name}</Text>
              <Text style={[styles.modalNpcRole, { color: colors.mutedForeground }]}>{npc.role}</Text>
              <HeartDisplay hearts={hearts} />
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Dialogue */}
          <View style={[styles.dialogueBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Ionicons name="chatbubble-ellipses" size={16} color={colors.mutedForeground} style={{ marginRight: 8 }} />
            <Text style={[styles.dialogueText, { color: colors.foreground }]}>{dialogue}</Text>
          </View>

          {/* Gifting */}
          <View style={styles.giftSection}>
            <Text style={[styles.giftTitle, { color: colors.foreground }]}>
              {alreadyGifted ? 'Already gifted today' : 'Give a gift'}
            </Text>
            {alreadyGifted && (
              <Text style={[styles.giftSubtitle, { color: colors.mutedForeground }]}>Come back tomorrow!</Text>
            )}
            {!alreadyGifted && energy < GIFT_ENERGY_COST && (
              <Text style={[styles.giftSubtitle, { color: colors.mutedForeground }]}>
                Need {GIFT_ENERGY_COST} energy to gift
              </Text>
            )}
          </View>

          {canGift && giftableItems.length > 0 && (
            <FlatList
              data={giftableItems}
              keyExtractor={i => i.id}
              style={styles.giftList}
              renderItem={({ item }) => {
                const isFav = npc.favoriteItems.includes(item.id);
                return (
                  <TouchableOpacity
                    style={[styles.giftRow, { borderBottomColor: colors.border }]}
                    onPress={() => onGift(item.id)}
                  >
                    <MaterialCommunityIcons
                      name={isFav ? 'star' : 'gift-outline'}
                      size={18}
                      color={isFav ? colors.accent : colors.mutedForeground}
                    />
                    <View style={styles.giftItemInfo}>
                      <Text style={[styles.giftItemName, { color: colors.foreground }]}>{item.name}</Text>
                      {isFav && (
                        <Text style={[styles.favLabel, { color: colors.accent }]}>Favorite!</Text>
                      )}
                    </View>
                    <Text style={[styles.giftQty, { color: colors.mutedForeground }]}>×{item.quantity}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {canGift && giftableItems.length === 0 && (
            <View style={styles.emptyGift}>
              <MaterialCommunityIcons name="bag-outline" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyGiftText, { color: colors.mutedForeground }]}>
                Your bag is empty. Harvest crops or mine resources first.
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── Town Screen ──────────────────────────────────────────────────────────────

export default function TownScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state, actions } = useGame();
  const [selectedNPC, setSelectedNPC] = useState<NPCData | null>(null);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleGift = (itemId: string) => {
    if (!selectedNPC) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    actions.giftNPC(selectedNPC.id, itemId);
    setSelectedNPC(null);
  };

  const selectedNPCState = state.npcs.find(n => n.id === selectedNPC?.id);
  const alreadyGifted = selectedNPCState ? selectedNPCState.lastGiftDay === state.daysSurvived : false;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Harvest Vale</Text>
        <View style={[styles.dayChip, { backgroundColor: colors.secondary }]}>
          <MaterialCommunityIcons name="calendar" size={13} color={colors.accent} />
          <Text style={[styles.dayChipText, { color: colors.foreground }]}>
            {SEASON_NAMES[state.season]} {state.day}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.listContent, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>VILLAGERS</Text>

        {NPCS.map(npc => {
          const npcState = state.npcs.find(n => n.id === npc.id);
          const hearts = npcState?.hearts ?? 0;
          const giftedToday = npcState?.lastGiftDay === state.daysSurvived;

          return (
            <TouchableOpacity
              key={npc.id}
              style={[styles.npcCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedNPC(npc);
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.npcAvatar, { backgroundColor: npc.color + '30', borderColor: npc.color }]}>
                <Text style={[styles.npcInitial, { color: npc.color }]}>{npc.name[0]}</Text>
              </View>
              <View style={styles.npcBody}>
                <View style={styles.npcTopRow}>
                  <Text style={[styles.npcName, { color: colors.foreground }]}>{npc.name}</Text>
                  {giftedToday && (
                    <View style={[styles.giftedBadge, { backgroundColor: colors.primary + '30' }]}>
                      <Ionicons name="checkmark" size={10} color={colors.primary} />
                      <Text style={[styles.giftedText, { color: colors.primary }]}>Gifted</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.npcRole, { color: colors.mutedForeground }]}>{npc.role}</Text>
                <HeartDisplay hearts={hearts} />
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          );
        })}

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 24 }]}>UPCOMING EVENTS</Text>
        <View style={[styles.eventCard, { backgroundColor: colors.card, borderColor: colors.accent + '60' }]}>
          <MaterialCommunityIcons name="flag-checkered" size={20} color={colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.eventName, { color: colors.foreground }]}>Harvest Festival</Text>
            <Text style={[styles.eventDate, { color: colors.mutedForeground }]}>Fall · Day 16</Text>
          </View>
        </View>
        <View style={[styles.eventCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="snowflake" size={20} color='#90B8D8' />
          <View style={{ flex: 1 }}>
            <Text style={[styles.eventName, { color: colors.foreground }]}>Ice Festival</Text>
            <Text style={[styles.eventDate, { color: colors.mutedForeground }]}>Winter · Day 8</Text>
          </View>
        </View>
        <View style={[styles.eventCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="flower" size={20} color='#7EC87E' />
          <View style={{ flex: 1 }}>
            <Text style={[styles.eventName, { color: colors.foreground }]}>Spring Festival</Text>
            <Text style={[styles.eventDate, { color: colors.mutedForeground }]}>Spring · Day 13</Text>
          </View>
        </View>
      </ScrollView>

      <NPCModal
        npc={selectedNPC}
        hearts={selectedNPCState?.hearts ?? 0}
        alreadyGifted={alreadyGifted}
        onClose={() => setSelectedNPC(null)}
        onGift={handleGift}
        inventory={state.inventory}
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
  headerTitle: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  dayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  dayChipText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  listContent: { padding: 16 },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.2, marginBottom: 10 },
  npcCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  npcAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  npcInitial: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  npcBody: { flex: 1, gap: 3 },
  npcTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  npcName: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  npcRole: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  giftedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  giftedText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  heartsRow: { flexDirection: 'row', gap: 2, marginTop: 2 },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  eventName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  eventDate: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 20,
    paddingBottom: 16,
  },
  npcAvatarLg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  npcInitialLg: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  modalNpcInfo: { flex: 1 },
  modalNpcName: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  modalNpcRole: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 4 },
  dialogueBox: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  dialogueText: { fontSize: 14, fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 22, fontStyle: 'italic' },
  giftSection: { paddingHorizontal: 20, marginBottom: 8 },
  giftTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  giftSubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  giftList: { maxHeight: 200 },
  giftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  giftItemInfo: { flex: 1 },
  giftItemName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  favLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', marginTop: 1 },
  giftQty: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  emptyGift: { alignItems: 'center', padding: 24, gap: 10 },
  emptyGiftText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
});
