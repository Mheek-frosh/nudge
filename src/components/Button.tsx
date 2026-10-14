import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { colors, layout, radii, space } from '../theme/tokens';
import { AppText } from './AppText';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export function Button({ label, onPress, variant = 'primary', accessibilityLabel, style, disabled }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.base, styles[variant], pressed && styles.pressed, disabled && styles.disabled, style]}
    >
      <AppText variant="heading" color={variant === 'primary' ? colors.limeInk : variant === 'danger' ? colors.coral : colors.text} style={styles.label}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: layout.minTouch,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  primary: { backgroundColor: colors.lime },
  secondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderStrong },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.coralSoft },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.4 },
  label: { fontSize: 16 },
});
