import { StyleSheet, View } from 'react-native';
import { colors, radii, space } from '../theme/tokens';
import { AppText } from './AppText';

type Tone = 'lime' | 'amber' | 'coral' | 'muted';

const tones: Record<Tone, { background: string; text: string }> = {
  lime: { background: colors.limeSoft, text: colors.lime },
  amber: { background: colors.amberSoft, text: colors.amber },
  coral: { background: colors.coralSoft, text: colors.coral },
  muted: { background: 'rgba(154, 164, 181, 0.12)', text: colors.textMuted },
};

export function Pill({ label, tone = 'muted' }: { label: string; tone?: Tone }) {
  const palette = tones[tone];
  return (
    <View style={[styles.pill, { backgroundColor: palette.background }]}>
      <AppText variant="meta" color={palette.text}>
        {label}
      </AppText>
    </View>
  );
}

export function DemoBadge() {
  return <Pill label="Demo mode" tone="lime" />;
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
  },
});
