import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { NudgeNotification } from '../types';
import { SOURCE_META } from '../services/sources/catalog';
import { colors, radii, space } from '../theme/tokens';
import { formatCountdown, formatReceived } from '../utils/time';
import { categoryLabel, categoryTone, previewText } from '../features/notifications/presentation';
import { AppText } from './AppText';
import { Pill } from './Pill';
import { SourceMark } from './SourceMark';

interface Props {
  item: NudgeNotification;
  now: number;
  hidePreviews: boolean;
}

export function NotificationCard({ item, now, hidePreviews }: Props) {
  const router = useRouter();
  const source = SOURCE_META[item.sourceId];
  const moment = new Date(now);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${source.name} from ${item.sender}. ${item.title}. Opens details.`}
      onPress={() => router.push(`/notification/${item.id}`)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <SourceMark sourceId={item.sourceId} />
        <View style={styles.headerText}>
          <AppText variant="meta" color={colors.text}>
            {source.name}
          </AppText>
          <AppText variant="meta">{formatReceived(item.receivedAt, moment)}</AppText>
        </View>
      </View>
      <AppText variant="small" color={colors.textMuted}>
        {item.sender}
      </AppText>
      <AppText variant="heading">{item.title}</AppText>
      <AppText variant="small" color={colors.textMuted} numberOfLines={2}>
        {previewText(item.summary, hidePreviews)}
      </AppText>
      <View style={styles.pills}>
        <Pill label={categoryLabel(item.category)} tone={categoryTone(item.category)} />
        {item.deadlineAt ? <Pill label={formatCountdown(item.deadlineAt, moment)} tone="amber" /> : null}
      </View>
      <View style={styles.why}>
        <AppText variant="meta" color={colors.lime}>
          Why Nudge flagged this
        </AppText>
        <AppText variant="small" color={colors.textMuted} numberOfLines={2}>
          {item.analysisReason}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.sm,
  },
  pressed: { opacity: 0.86 },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  headerText: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.xs },
  why: { gap: space.xs, marginTop: space.xs },
});
