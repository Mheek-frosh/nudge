import { Pressable, StyleSheet, View } from 'react-native';
import { colors, layout, radii, space } from '../theme/tokens';
import { selectHaptic } from '../services/haptics';
import { AppText } from './AppText';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}

export function SegmentedControl<T extends string>({ options, value, onChange, accessibilityLabel }: Props<T>) {
  return (
    <View accessibilityRole="tablist" accessibilityLabel={accessibilityLabel} style={styles.row}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            onPress={() => {
              selectHaptic();
              onChange(option.value);
            }}
            style={[styles.option, selected && styles.selected]}
          >
            <AppText variant="small" color={selected ? colors.limeInk : colors.text} style={styles.label}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: radii.md,
    padding: 4,
    gap: 4,
  },
  option: {
    flex: 1,
    minHeight: layout.minTouch,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.sm,
  },
  selected: { backgroundColor: colors.lime },
  label: { fontWeight: '600', textAlign: 'center' },
});
