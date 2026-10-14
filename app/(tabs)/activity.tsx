import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAppStore } from '../../src/store/useAppStore';
import type { ActivityType } from '../../src/types';
import { dayKey, dayLabel, formatTime } from '../../src/utils/time';
import { colors, radii, space } from '../../src/theme/tokens';
import { Screen } from '../../src/components/Screen';
import { AppText } from '../../src/components/AppText';
import { EmptyState } from '../../src/components/EmptyState';

const LABELS: Record<ActivityType, string> = {
  received: 'Received',
  snoozed: 'Snoozed',
  handled: 'Handled',
  reopened: 'Reopened',
  reminder_due: 'Reminder due',
};

const ICONS: Record<ActivityType, keyof typeof Ionicons.glyphMap> = {
  received: 'arrow-down-circle-outline',
  snoozed: 'time-outline',
  handled: 'checkmark-circle-outline',
  reopened: 'refresh-outline',
  reminder_due: 'alarm-outline',
};

export default function ActivityScreen() {
  const router = useRouter();
  const activity = useAppStore((state) => state.activity);
  const notifications = useAppStore((state) => state.notifications);
  const now = useAppStore((state) => state.now);
  const hidePreviews = useAppStore((state) => state.settings.hidePreviews);
  const groups = useMemo(() => {
    const moment = new Date(now);
    const sorted = [...activity].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    const grouped = new Map<string, { key: string; label: string; ids: string[] }>();
    for (const event of sorted) {
      const key = dayKey(event.at);
      const existing = grouped.get(key);
      if (existing) existing.ids.push(event.id);
      else grouped.set(key, { key, label: dayLabel(event.at, moment), ids: [event.id] });
    }
    return [...grouped.values()];
  }, [activity, now]);

  const byId = new Map(activity.map((event) => [event.id, event]));

  return (
    <Screen>
      <AppText variant="display">Activity</AppText>
      <AppText variant="body" color={colors.textMuted}>
        What arrived, what you snoozed, and what you handled.
      </AppText>
      {activity.length === 0 ? (
        <EmptyState title="No history yet" body="Demo notifications and the actions you take will show up here." />
      ) : (
        groups.map((group) => (
          <View key={group.key} style={styles.group}>
            <AppText variant="heading">{group.label}</AppText>
            {group.ids.map((id) => {
              const event = byId.get(id);
              if (!event) return null;
              const notification = notifications.find((item) => item.id === event.notificationId);
              const subtitle = hidePreviews ? (event.detail ?? 'Preview hidden') : (notification?.summary ?? event.detail ?? event.title);
              return (
                <Pressable
                  key={event.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${LABELS[event.type]} ${event.title}. Opens the item.`}
                  onPress={() => {
                    if (notification) router.push(`/notification/${notification.id}`);
                  }}
                  style={styles.row}
                >
                  <Ionicons name={ICONS[event.type]} size={20} color={event.type === 'reminder_due' ? colors.amber : colors.lime} />
                  <View style={styles.copy}>
                    <AppText variant="meta">
                      {LABELS[event.type]} · {formatTime(event.at)}
                    </AppText>
                    <AppText variant="heading">{event.title}</AppText>
                    <AppText variant="small" color={colors.textMuted} numberOfLines={2}>
                      {subtitle}
                    </AppText>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { gap: space.sm },
  row: {
    flexDirection: 'row',
    gap: space.md,
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
  },
  copy: { flex: 1, gap: 2 },
});
