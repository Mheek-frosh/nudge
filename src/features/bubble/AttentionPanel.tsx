import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore';
import { comingUp, countAttention, countDueSoon, topPending } from '../../services/notifications/sorting';
import { SOURCE_META } from '../../services/sources/catalog';
import { successHaptic, tapHaptic } from '../../services/haptics';
import { attentionSummary, formatCountdown } from '../../utils/time';
import { previewText } from '../notifications/presentation';
import { colors, radii, space } from '../../theme/tokens';
import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';

export function AttentionPanel() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const notifications = useAppStore((state) => state.notifications);
  const now = useAppStore((state) => state.now);
  const settings = useAppStore((state) => state.settings);
  const setBubbleOpen = useAppStore((state) => state.setBubbleOpen);
  const setBubbleAnchor = useAppStore((state) => state.setBubbleAnchor);
  const markHandled = useAppStore((state) => state.markHandled);
  const snooze = useAppStore((state) => state.snooze);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const moment = new Date(now);
  const pending = topPending(notifications, 3);
  const upcoming = comingUp(notifications, moment);
  const attention = countAttention(notifications);
  const dueSoon = countDueSoon(notifications, moment);

  const close = () => setBubbleOpen(false);

  return (
    <View style={styles.fill} pointerEvents="box-none">
      <Pressable accessibilityLabel="Dismiss attention panel" style={styles.backdrop} onPress={close} />
      <View style={[styles.sheet, { marginBottom: Math.max(insets.bottom, 10), maxHeight: height * 0.72 }]}>
        <View style={styles.handle} />
        <AppText variant="heading">{attention === 0 ? 'Nothing urgent' : 'Needs your attention'}</AppText>
        <AppText variant="meta">{attentionSummary(attention, dueSoon)}</AppText>
        {settings.pauseReminders ? (
          <AppText variant="small" color={colors.amber}>
            Reminders are paused.
          </AppText>
        ) : null}
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {pending.length === 0 ? (
            <AppText variant="small" color={colors.textMuted}>
              You are clear for the moment.
            </AppText>
          ) : (
            pending.map((item) => (
              <View key={item.id} style={styles.item}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${item.title}`}
                  onPress={() => {
                    close();
                    router.push(`/notification/${item.id}`);
                  }}
                >
                  <AppText variant="meta" color={colors.textMuted}>
                    {SOURCE_META[item.sourceId].name} · {item.sender}
                  </AppText>
                  <AppText variant="heading">{item.title}</AppText>
                  <AppText variant="small" color={colors.textMuted} numberOfLines={1}>
                    {item.deadlineAt ? formatCountdown(item.deadlineAt, moment) : previewText(item.summary, settings.hidePreviews)}
                  </AppText>
                </Pressable>
                <View style={styles.actions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Snooze ${item.title}`}
                    style={styles.action}
                    onPress={() => {
                      tapHaptic();
                      snooze(item.id, new Date(Date.now() + settings.defaultSnoozeMinutes * 60_000).toISOString());
                    }}
                  >
                    <AppText variant="small">Snooze {settings.defaultSnoozeMinutes === 60 ? '1 hour' : '15 min'}</AppText>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Mark ${item.title} handled`}
                    style={styles.action}
                    onPress={() => {
                      successHaptic();
                      markHandled(item.id);
                    }}
                  >
                    <AppText variant="small" color={colors.lime}>
                      Handled
                    </AppText>
                  </Pressable>
                </View>
              </View>
            ))
          )}
          {upcoming.length > 0 ? (
            <View style={styles.upcoming}>
              <AppText variant="meta">Coming up</AppText>
              {upcoming.map((item) => (
                <AppText key={item.id} variant="small" color={colors.textMuted}>
                  {item.title} · {item.deadlineAt ? formatCountdown(item.deadlineAt, moment) : ''}
                </AppText>
              ))}
            </View>
          ) : null}
        </ScrollView>
        <Button
          label="View all"
          onPress={() => {
            close();
            router.navigate('/');
          }}
        />
        <Button
          label={settings.pauseReminders ? 'Resume reminders' : 'Pause reminders'}
          variant="secondary"
          onPress={() => {
            tapHaptic();
            updateSettings({ pauseReminders: !settings.pauseReminders });
          }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Move bubble to the other edge"
          onPress={() => setBubbleAnchor(settings.bubbleAnchor === 'left' ? 'right' : 'left')}
          style={styles.link}
        >
          <AppText variant="small" color={colors.textMuted}>
            Move bubble to the {settings.bubbleAnchor === 'left' ? 'right' : 'left'}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay },
  sheet: {
    marginHorizontal: space.md,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.sm,
  },
  handle: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong, marginBottom: space.xs },
  list: { gap: space.md, paddingVertical: space.sm },
  item: { gap: space.sm, paddingBottom: space.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  actions: { flexDirection: 'row', gap: space.sm },
  action: {
    flex: 1,
    minHeight: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcoming: { gap: space.xs },
  link: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
