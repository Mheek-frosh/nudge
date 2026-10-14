import { StyleSheet, View } from 'react-native';
import { useAppStore } from '../../src/store/useAppStore';
import type { SourcePriority } from '../../src/types';
import { CAPABILITIES, SOURCE_META } from '../../src/services/sources/catalog';
import { selectHaptic } from '../../src/services/haptics';
import { colors, radii, space } from '../../src/theme/tokens';
import { Screen } from '../../src/components/Screen';
import { AppText } from '../../src/components/AppText';
import { DemoBadge } from '../../src/components/Pill';
import { SourceMark } from '../../src/components/SourceMark';
import { ToggleRow } from '../../src/components/ToggleRow';
import { SegmentedControl } from '../../src/components/SegmentedControl';

export default function SourcesScreen() {
  const sources = useAppStore((state) => state.sources);
  const toggleSource = useAppStore((state) => state.toggleSource);
  const setSourcePriority = useAppStore((state) => state.setSourcePriority);

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="display">Sources</AppText>
        <DemoBadge />
      </View>
      <AppText variant="body" color={colors.textMuted}>
        Turning a source off stops new samples from arriving. Messages already in Nudge stay, with their original source.
      </AppText>
      {sources.map((source) => {
        const meta = SOURCE_META[source.id];
        return (
          <View key={source.id} style={styles.card}>
            <View style={styles.titleRow}>
              <SourceMark sourceId={source.id} />
              <View style={styles.copy}>
                <AppText variant="heading">{meta.name}</AppText>
                <AppText variant="meta" color={colors.lime}>
                  Demo source
                </AppText>
              </View>
            </View>
            <AppText variant="small" color={colors.textMuted}>
              {meta.explanation}
            </AppText>
            <ToggleRow label="Receive samples" value={source.enabled} onValueChange={(enabled) => toggleSource(source.id, enabled)} />
            <AppText variant="meta">Priority for new samples</AppText>
            <SegmentedControl
              accessibilityLabel={`${meta.name} priority`}
              value={source.priority}
              onChange={(priority) => {
                selectHaptic();
                setSourcePriority(source.id, priority);
              }}
              options={[
                { value: 'low' as SourcePriority, label: 'Low' },
                { value: 'default' as SourcePriority, label: 'Default' },
                { value: 'high' as SourcePriority, label: 'High' },
              ]}
            />
          </View>
        );
      })}
      <View style={styles.section}>
        <AppText variant="heading">What this build can do</AppText>
        {CAPABILITIES.map((item) => (
          <View key={item.title} style={styles.note}>
            <AppText variant="heading">{item.title}</AppText>
            <AppText variant="small" color={colors.textMuted}>
              {item.body}
            </AppText>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: space.md },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.sm,
  },
  titleRow: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  copy: { flex: 1, gap: 2 },
  section: { gap: space.md },
  note: { gap: space.xs },
});
