import { useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAppStore } from '../../src/store/useAppStore';
import type { SourceOpenResult } from '../../src/types';
import { SOURCE_META } from '../../src/services/sources/catalog';
import { sourceOpener } from '../../src/services/sources/opener';
import { successHaptic, tapHaptic } from '../../src/services/haptics';
import { addMinutes, formatCountdown, formatDeadlineDetail, formatReceived, formatShortWhen, tomorrowMorning } from '../../src/utils/time';
import { categoryLabel, categoryTone, previewText } from '../../src/features/notifications/presentation';
import { colors, radii, space } from '../../src/theme/tokens';
import { Screen } from '../../src/components/Screen';
import { AppText } from '../../src/components/AppText';
import { Button } from '../../src/components/Button';
import { Pill } from '../../src/components/Pill';
import { SourceMark } from '../../src/components/SourceMark';
import { EmptyState } from '../../src/components/EmptyState';

export default function NotificationDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const notification = useAppStore((state) => state.notifications.find((item) => item.id === id));
  const now = useAppStore((state) => state.now);
  const hidePreviews = useAppStore((state) => state.settings.hidePreviews);
  const markHandled = useAppStore((state) => state.markHandled);
  const snooze = useAppStore((state) => state.snooze);
  const reopen = useAppStore((state) => state.reopen);
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [customDate, setCustomDate] = useState(() => addMinutes(new Date(), 30));
  const [showPicker, setShowPicker] = useState(false);
  const [snoozeError, setSnoozeError] = useState<string | null>(null);
  const [openResult, setOpenResult] = useState<SourceOpenResult | null>(null);
  const [reveal, setReveal] = useState(false);

  if (!notification) {
    return (
      <Screen tabBar={false}>
        <EmptyState title="This item is gone" body="It may have been reset with the demo data." actionLabel="Back" onAction={() => router.back()} />
      </Screen>
    );
  }

  const moment = new Date(now);
  const source = SOURCE_META[notification.sourceId];
  const hidden = hidePreviews && !reveal;

  const applySnooze = (until: Date) => {
    const ok = snooze(notification.id, until.toISOString());
    if (!ok) {
      setSnoozeError('Choose a time in the future.');
      return;
    }
    tapHaptic();
    setSnoozeOpen(false);
    setSnoozeError(null);
  };

  const openApp = async () => {
    const result = await sourceOpener.openApp(notification.sourceId);
    setOpenResult(result);
  };

  const openSite = async () => {
    const result = await sourceOpener.openWebsite(notification.sourceId);
    setOpenResult(result);
  };

  return (
    <Screen tabBar={false}>
      <View style={styles.top}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <SourceMark sourceId={notification.sourceId} />
        <View style={styles.topCopy}>
          <AppText variant="heading">{source.name}</AppText>
          <AppText variant="meta">{formatReceived(notification.receivedAt, moment)}</AppText>
        </View>
      </View>
      <AppText variant="meta">{notification.sender}</AppText>
      <AppText variant="title">{notification.title}</AppText>
      <View style={styles.pills}>
        <Pill label={categoryLabel(notification.category)} tone={categoryTone(notification.category)} />
        <Pill label="Demo analysis" tone="muted" />
        {notification.deadlineAt ? <Pill label={formatCountdown(notification.deadlineAt, moment)} tone="amber" /> : null}
      </View>

      <Section title="Original sample">
        <AppText variant="body" color={colors.textMuted}>
          {hidden ? 'Preview hidden in Settings.' : notification.originalText}
        </AppText>
        {hidePreviews ? (
          <Button label={reveal ? 'Hide preview' : 'Show this preview'} variant="ghost" onPress={() => setReveal((value) => !value)} />
        ) : null}
      </Section>

      <Section title="Demo analysis">
        <AppText variant="body">{notification.analysisReason}</AppText>
        <AppText variant="meta">Confidence {Math.round(notification.confidence * 100)}% · local demo rule</AppText>
      </Section>

      <Section title="Suggested action">
        <AppText variant="body">{notification.suggestedAction}</AppText>
      </Section>

      <Section title="Deadline">
        {notification.deadlineAt ? (
          <AppText variant="body">{formatDeadlineDetail(notification.deadlineAt, notification.timeZone)}</AppText>
        ) : (
          <AppText variant="body" color={colors.textMuted}>
            No exact deadline was included. Nudge does not invent one.
          </AppText>
        )}
        {notification.status === 'snoozed' && notification.snoozeUntil ? (
          <AppText variant="small" color={colors.amber}>
            Snoozed until {formatShortWhen(notification.snoozeUntil, moment)}
          </AppText>
        ) : null}
      </Section>

      {notification.status === 'handled' ? (
        <Button
          label="Reopen"
          onPress={() => {
            reopen(notification.id);
            successHaptic();
          }}
        />
      ) : (
        <Button
          label="Mark handled"
          onPress={() => {
            markHandled(notification.id);
            successHaptic();
          }}
        />
      )}

      {notification.status !== 'handled' ? (
        <Button label={snoozeOpen ? 'Hide snooze' : 'Snooze'} variant="secondary" onPress={() => setSnoozeOpen((value) => !value)} />
      ) : null}

      {snoozeOpen ? (
        <View style={styles.snooze}>
          <SnoozeChoice label="15 minutes" onPress={() => applySnooze(addMinutes(new Date(), 15))} />
          <SnoozeChoice label="1 hour" onPress={() => applySnooze(addMinutes(new Date(), 60))} />
          <SnoozeChoice label="Tomorrow morning" onPress={() => applySnooze(tomorrowMorning(new Date()))} />
          <SnoozeChoice label="Custom date and time" onPress={() => setShowPicker(true)} />
          {showPicker ? (
            <DateTimePicker
              value={customDate}
              mode="datetime"
              minimumDate={new Date()}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              themeVariant="dark"
              onChange={(event, selected) => {
                if (Platform.OS !== 'ios') setShowPicker(false);
                if (event.type === 'dismissed' || !selected) return;
                setCustomDate(selected);
              }}
            />
          ) : null}
          {showPicker ? <Button label={`Snooze until ${formatShortWhen(customDate.toISOString(), new Date())}`} onPress={() => applySnooze(customDate)} /> : null}
          {snoozeError ? (
            <AppText variant="small" color={colors.coral}>
              {snoozeError}
            </AppText>
          ) : null}
        </View>
      ) : null}

      {notification.status === 'snoozed' ? <Button label="Return to feed" variant="secondary" onPress={() => reopen(notification.id)} /> : null}

      {notification.sourceId === 'banking' ? (
        <AppText variant="small" color={colors.textMuted}>
          Harbor Mutual is fictional. There is no banking app to open, and this item is not marked handled.
        </AppText>
      ) : (
        <>
          <Button label="Open source" variant="secondary" onPress={() => void openApp()} />
          <Button label="Open public website" variant="ghost" onPress={() => void openSite()} />
        </>
      )}
      {openResult ? (
        <AppText variant="small" color={openResult.status === 'opened' ? colors.textMuted : colors.amber}>
          {openResult.message}
        </AppText>
      ) : null}
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="meta" color={colors.lime}>
        {title}
      </AppText>
      {children}
    </View>
  );
}

function SnoozeChoice({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.choice}>
      <AppText variant="heading">{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  topCopy: { flex: 1, gap: 2 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  section: { gap: space.sm },
  snooze: { gap: space.sm },
  choice: {
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.md,
    backgroundColor: colors.card,
  },
});
