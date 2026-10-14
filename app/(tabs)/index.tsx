import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../src/store/useAppStore';
import type { FeedFilter, SimulationKind } from '../../src/types';
import { comingUp, countAttention, countDueSoon, selectFeed } from '../../src/services/notifications/sorting';
import { tapHaptic } from '../../src/services/haptics';
import { attentionSummary, formatCountdown, formatFullDate, greeting } from '../../src/utils/time';
import { colors, radii, space } from '../../src/theme/tokens';
import { Screen } from '../../src/components/Screen';
import { AppText } from '../../src/components/AppText';
import { DemoBadge } from '../../src/components/Pill';
import { NotificationCard } from '../../src/components/NotificationCard';
import { EmptyState } from '../../src/components/EmptyState';
import { Sheet } from '../../src/components/Sheet';

const FILTERS: { id: FeedFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'urgent', label: 'Urgent' },
  { id: 'reply', label: 'Reply needed' },
  { id: 'deadlines', label: 'Deadlines' },
];

const SIMULATIONS: { id: SimulationKind; label: string; detail: string }[] = [
  { id: 'random', label: 'Random sample', detail: 'Add a varied demo message' },
  { id: 'security', label: 'Urgent security alert', detail: 'Fictional bank sign-in' },
  { id: 'due_soon', label: 'Due in two minutes', detail: 'A reply with a short deadline' },
  { id: 'low', label: 'Low-priority update', detail: 'A promotion that stays quiet' },
];

export default function TodayScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const notifications = useAppStore((state) => state.notifications);
  const now = useAppStore((state) => state.now);
  const hidePreviews = useAppStore((state) => state.settings.hidePreviews);
  const simulate = useAppStore((state) => state.simulate);
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const moment = new Date(now);
  const feed = selectFeed(notifications, filter);
  const upcoming = comingUp(notifications, moment);
  const summary = attentionSummary(countAttention(notifications), countDueSoon(notifications, moment));

  const runSimulation = (kind: SimulationKind) => {
    tapHaptic();
    const message = simulate(kind);
    setNote(message);
    if (!message) setSimulatorOpen(false);
  };

  return (
    <Screen>
      <View style={styles.dateRow}>
        <View style={styles.dateCopy}>
          <AppText variant="heading">{greeting(moment)}</AppText>
          <AppText variant="meta">{formatFullDate(moment)}</AppText>
        </View>
        <DemoBadge />
      </View>
      <AppText variant="display" style={compact ? styles.compactTitle : undefined}>
        Your attention, organised.
      </AppText>
      <AppText variant="body" color={colors.textMuted}>
        {summary}
      </AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {FILTERS.map((item) => {
          const selected = filter === item.id;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Filter ${item.label}`}
              onPress={() => setFilter(item.id)}
              style={[styles.filter, selected && styles.filterOn]}
            >
              <AppText variant="small" color={selected ? colors.limeInk : colors.text}>
                {item.label}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
      {feed.length === 0 ? (
        <EmptyState
          title={filter === 'all' ? 'You are caught up' : 'Nothing in this filter'}
          body={
            filter === 'all'
              ? 'Handled items leave the feed. You can still add a demo notification.'
              : 'Try another filter, or come back when something new arrives.'
          }
          actionLabel={filter === 'all' ? undefined : 'Show all'}
          onAction={filter === 'all' ? undefined : () => setFilter('all')}
        />
      ) : (
        <View style={styles.feed}>
          {feed.map((item) => (
            <NotificationCard key={item.id} item={item} now={now} hidePreviews={hidePreviews} />
          ))}
        </View>
      )}
      {upcoming.length > 0 ? (
        <View style={styles.section}>
          <AppText variant="heading">Coming up</AppText>
          {upcoming.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}. Opens details.`}
              onPress={() => router.push(`/notification/${item.id}`)}
              style={styles.upcoming}
            >
              <AppText variant="heading">{item.title}</AppText>
              <AppText variant="meta">{item.deadlineAt ? formatCountdown(item.deadlineAt, moment) : 'Deadline unknown'}</AppText>
            </Pressable>
          ))}
        </View>
      ) : null}
      <Pressable accessibilityRole="button" accessibilityLabel="Simulate a notification" onPress={() => setSimulatorOpen(true)} style={styles.simulate}>
        <AppText variant="heading" color={colors.lime}>
          Simulate a notification
        </AppText>
      </Pressable>
      {note ? (
        <AppText variant="small" color={colors.amber}>
          {note}
        </AppText>
      ) : null}
      <Sheet visible={simulatorOpen} title="Add a demo notification" onClose={() => setSimulatorOpen(false)}>
        {SIMULATIONS.map((item) => (
          <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={item.label} onPress={() => runSimulation(item.id)} style={styles.simRow}>
            <AppText variant="heading">{item.label}</AppText>
            <AppText variant="meta">{item.detail}</AppText>
          </Pressable>
        ))}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: space.md },
  dateCopy: { flex: 1, gap: space.xs },
  compactTitle: { fontSize: 30, lineHeight: 36 },
  filters: { gap: space.sm, paddingRight: space.lg },
  filter: {
    minHeight: 40,
    paddingHorizontal: space.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  filterOn: { backgroundColor: colors.lime, borderColor: colors.lime },
  feed: { gap: space.md },
  section: { gap: space.sm },
  upcoming: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.xs,
  },
  simulate: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  simRow: {
    minHeight: 56,
    justifyContent: 'center',
    gap: 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});
