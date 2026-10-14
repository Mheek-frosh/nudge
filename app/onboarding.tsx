import { useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '../src/store/useAppStore';
import { SOURCE_IDS, type SourceId } from '../src/types';
import { SOURCE_META } from '../src/services/sources/catalog';
import { selectHaptic, tapHaptic } from '../src/services/haptics';
import { colors, radii, space } from '../src/theme/tokens';
import { Screen } from '../src/components/Screen';
import { AppText } from '../src/components/AppText';
import { Button } from '../src/components/Button';
import { SourceMark } from '../src/components/SourceMark';
import { ToggleRow } from '../src/components/ToggleRow';
import { TimeField } from '../src/components/TimeField';
import { SegmentedControl } from '../src/components/SegmentedControl';

const STEPS = [
  {
    eyebrow: 'Important messages, kept in sight.',
    title: 'Keep what matters in sight.',
    body: 'Nudge collects important messages, approaching deadlines, and urgent actions into one calm feed.',
  },
  {
    eyebrow: 'Demo sources',
    title: 'Choose your sources.',
    body: 'These are sample sources in this build. Nudge cannot read WhatsApp, email, Slack, or your bank.',
  },
  {
    eyebrow: 'Defaults',
    title: 'Make Nudge yours.',
    body: 'Set quiet hours and how long a quick snooze lasts. You can change both later.',
  },
] as const;

export default function OnboardingScreen() {
  const router = useRouter();
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const [step, setStep] = useState(0);
  const [enabled, setEnabled] = useState<SourceId[]>([...SOURCE_IDS]);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('07:00');
  const [securityBypassesQuietHours, setSecurityBypassesQuietHours] = useState(true);
  const [defaultSnoozeMinutes, setDefaultSnoozeMinutes] = useState<15 | 60>(15);

  const finish = () => {
    tapHaptic();
    completeOnboarding({
      enabledSourceIds: enabled,
      quietHoursEnabled,
      quietStart,
      quietEnd,
      securityBypassesQuietHours,
      defaultSnoozeMinutes,
    });
    router.replace('/(tabs)');
  };

  const toggle = (id: SourceId) => {
    selectHaptic();
    setEnabled((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const current = STEPS[step];
  if (!current) return null;

  return (
    <Screen tabBar={false}>
      <View style={styles.top}>
        <View style={styles.dots}>
          {STEPS.map((item, index) => (
            <View key={item.title} style={[styles.dot, index === step && styles.dotActive]} />
          ))}
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Skip onboarding" onPress={finish} style={styles.skip}>
          <AppText variant="heading" color={colors.textMuted}>
            Skip
          </AppText>
        </Pressable>
      </View>
      <AppText variant="meta" color={colors.lime}>
        {current.eyebrow}
      </AppText>
      <AppText variant="display" style={compact ? styles.compactTitle : undefined}>
        {current.title}
      </AppText>
      <AppText variant="body" color={colors.textMuted}>
        {current.body}
      </AppText>

      {step === 0 ? (
        <View style={styles.preview}>
          <Preview title="Unfamiliar login" meta="Harbor Mutual · Security" />
          <Preview title="Invoice approval" meta="Outlook · Tomorrow" />
          <Preview title="Review request" meta="Slack · Reply needed" />
        </View>
      ) : null}

      {step === 1 ? (
        <View style={styles.sources}>
          {SOURCE_IDS.map((id) => {
            const selected = enabled.includes(id);
            return (
              <Pressable
                key={id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={`${SOURCE_META[id].name}, demo source`}
                onPress={() => toggle(id)}
                style={[styles.source, selected && styles.sourceOn]}
              >
                <SourceMark sourceId={id} />
                <View style={styles.sourceCopy}>
                  <AppText variant="heading">{SOURCE_META[id].name}</AppText>
                  <AppText variant="meta">Demo source</AppText>
                </View>
                <AppText variant="heading" color={selected ? colors.lime : colors.textMuted}>
                  {selected ? 'On' : 'Off'}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {step === 2 ? (
        <View style={styles.settings}>
          <ToggleRow label="Quiet hours" detail="Ordinary reminders wait until quiet hours end." value={quietHoursEnabled} onValueChange={setQuietHoursEnabled} />
          {quietHoursEnabled ? (
            <>
              <TimeField label="Starts" value={quietStart} onChange={setQuietStart} />
              <TimeField label="Ends" value={quietEnd} onChange={setQuietEnd} />
            </>
          ) : null}
          <ToggleRow
            label="Security alerts during quiet hours"
            detail="Urgent security samples can still surface."
            value={securityBypassesQuietHours}
            onValueChange={setSecurityBypassesQuietHours}
          />
          <AppText variant="heading">Quick snooze</AppText>
          <SegmentedControl
            accessibilityLabel="Default snooze length"
            value={String(defaultSnoozeMinutes)}
            onChange={(value) => setDefaultSnoozeMinutes(value === '60' ? 60 : 15)}
            options={[
              { value: '15', label: '15 minutes' },
              { value: '60', label: '1 hour' },
            ]}
          />
        </View>
      ) : null}

      <View style={styles.footer}>
        {step > 0 ? <Button label="Back" variant="secondary" onPress={() => setStep((value) => value - 1)} style={styles.footerButton} /> : null}
        <Button label={step === STEPS.length - 1 ? 'Start' : 'Continue'} onPress={() => (step === STEPS.length - 1 ? finish() : setStep((value) => value + 1))} style={styles.footerButton} />
      </View>
    </Screen>
  );
}

function Preview({ title, meta }: { title: string; meta: string }) {
  return (
    <View style={styles.previewCard}>
      <AppText variant="heading">{title}</AppText>
      <AppText variant="meta">{meta}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dots: { flexDirection: 'row', gap: space.sm },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.borderStrong },
  dotActive: { width: 22, backgroundColor: colors.lime },
  skip: { minHeight: 44, justifyContent: 'center', paddingHorizontal: space.sm },
  compactTitle: { fontSize: 30, lineHeight: 36 },
  preview: { gap: space.sm },
  previewCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.xs,
  },
  sources: { gap: space.sm },
  source: {
    minHeight: 68,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  sourceOn: { borderColor: colors.borderStrong },
  sourceCopy: { flex: 1, gap: 2 },
  settings: { gap: space.md },
  footer: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  footerButton: { flex: 1 },
});
