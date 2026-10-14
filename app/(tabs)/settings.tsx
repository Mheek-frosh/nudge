import { Alert, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../src/store/useAppStore';
import { successHaptic, tapHaptic } from '../../src/services/haptics';
import { colors, radii, space } from '../../src/theme/tokens';
import { Screen } from '../../src/components/Screen';
import { AppText } from '../../src/components/AppText';
import { Button } from '../../src/components/Button';
import { ToggleRow } from '../../src/components/ToggleRow';
import { TimeField } from '../../src/components/TimeField';
import { SegmentedControl } from '../../src/components/SegmentedControl';

export default function SettingsScreen() {
  const router = useRouter();
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const setBubbleAnchor = useAppStore((state) => state.setBubbleAnchor);
  const resetDemo = useAppStore((state) => state.resetDemo);
  const replayOnboarding = useAppStore((state) => state.replayOnboarding);
  const enableDeviceReminders = useAppStore((state) => state.enableDeviceReminders);
  const disableDeviceReminders = useAppStore((state) => state.disableDeviceReminders);

  const confirmReset = () => {
    Alert.alert('Reset demo data?', 'This replaces the sample inbox with a fresh set. Your settings stay as they are.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          resetDemo();
          successHaptic();
        },
      },
    ]);
  };

  return (
    <Screen>
      <AppText variant="display">Settings</AppText>
      <AppText variant="body" color={colors.textMuted}>
        Demo analysis runs on this iPhone. Nudge does not send messages anywhere, and it cannot see your real inbox.
      </AppText>

      <View style={styles.card}>
        <AppText variant="heading">Reminders</AppText>
        <ToggleRow
          label="Quiet hours"
          detail="Ordinary reminders wait. An overnight range such as 22:00 to 07:00 is supported."
          value={settings.quietHoursEnabled}
          onValueChange={(quietHoursEnabled) => updateSettings({ quietHoursEnabled })}
        />
        {settings.quietHoursEnabled ? (
          <>
            <TimeField label="Starts" value={settings.quietStart} onChange={(quietStart) => updateSettings({ quietStart })} />
            <TimeField label="Ends" value={settings.quietEnd} onChange={(quietEnd) => updateSettings({ quietEnd })} />
          </>
        ) : null}
        <ToggleRow
          label="Security alerts during quiet hours"
          detail="Lets urgent security samples through while other reminders wait."
          value={settings.securityBypassesQuietHours}
          onValueChange={(securityBypassesQuietHours) => updateSettings({ securityBypassesQuietHours })}
        />
        <AppText variant="meta">Quick snooze</AppText>
        <SegmentedControl
          accessibilityLabel="Default snooze length"
          value={String(settings.defaultSnoozeMinutes)}
          onChange={(value) => updateSettings({ defaultSnoozeMinutes: value === '60' ? 60 : 15 })}
          options={[
            { value: '15', label: '15 minutes' },
            { value: '60', label: '1 hour' },
          ]}
        />
        <ToggleRow
          label="Pause reminders"
          detail="Snoozes and deadlines stay put until you resume."
          value={settings.pauseReminders}
          onValueChange={(pauseReminders) => updateSettings({ pauseReminders })}
        />
        <ToggleRow
          label="Device reminders"
          detail="Optional local alerts. Permission is requested only when you turn this on. Remote push is not used."
          value={settings.deviceRemindersEnabled}
          onValueChange={(enabled) => {
            if (enabled) void enableDeviceReminders();
            else void disableDeviceReminders();
          }}
        />
        {settings.deviceReminderNote ? (
          <AppText variant="small" color={colors.amber}>
            {settings.deviceReminderNote}
          </AppText>
        ) : null}
      </View>

      <View style={styles.card}>
        <AppText variant="heading">Inside Nudge</AppText>
        <ToggleRow
          label="Hide previews"
          detail="Hides message text in the feed, bubble, and activity. Titles stay visible."
          value={settings.hidePreviews}
          onValueChange={(hidePreviews) => updateSettings({ hidePreviews })}
        />
        <ToggleRow
          label="Floating bubble"
          detail="The bubble stays inside Nudge. It cannot float over other iPhone apps."
          value={settings.showBubble}
          onValueChange={(showBubble) => updateSettings({ showBubble })}
        />
        <AppText variant="meta">Bubble edge</AppText>
        <SegmentedControl
          accessibilityLabel="Bubble edge"
          value={settings.bubbleAnchor}
          onChange={(bubbleAnchor) => setBubbleAnchor(bubbleAnchor)}
          options={[
            { value: 'left', label: 'Left' },
            { value: 'right', label: 'Right' },
          ]}
        />
        <AppText variant="small" color={colors.textMuted}>
          Drag the bubble, or place it here without dragging. VoiceOver actions can move it too.
        </AppText>
        <ToggleRow
          label="Reduce animation"
          detail="Turns off the bubble pulse and shortens motion. The system setting is also respected."
          value={settings.reducedMotion}
          onValueChange={(reducedMotion) => updateSettings({ reducedMotion })}
        />
      </View>

      <View style={styles.card}>
        <AppText variant="heading">Demo</AppText>
        <Button label="Reset demo data" variant="danger" onPress={confirmReset} />
        <Button
          label="Replay onboarding"
          variant="secondary"
          onPress={() => {
            tapHaptic();
            replayOnboarding();
            router.replace('/onboarding');
          }}
        />
        <AppText variant="small" color={colors.textMuted}>
          Finishing onboarding again refreshes the sample inbox from the sources you pick.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.md,
  },
});
