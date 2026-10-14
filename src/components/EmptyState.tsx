import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, space } from '../theme/tokens';
import { AppText } from './AppText';
import { Button } from './Button';

interface Props {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, body, actionLabel, onAction }: Props) {
  return (
    <View style={styles.wrap}>
      <Ionicons name="checkmark-circle-outline" size={28} color={colors.lime} />
      <AppText variant="heading" style={styles.center}>
        {title}
      </AppText>
      <AppText variant="small" color={colors.textMuted} style={styles.center}>
        {body}
      </AppText>
      {actionLabel && onAction ? <Button label={actionLabel} variant="secondary" onPress={onAction} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: space.sm, paddingVertical: space.xl },
  center: { textAlign: 'center' },
});
