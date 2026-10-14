import { StyleSheet, Switch, View } from 'react-native';
import { colors, space } from '../theme/tokens';
import { AppText } from './AppText';

interface Props {
  label: string;
  detail?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export function ToggleRow({ label, detail, value, onValueChange }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <AppText variant="heading">{label}</AppText>
        {detail ? (
          <AppText variant="small" color={colors.textMuted}>
            {detail}
          </AppText>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#343B49', true: colors.lime }}
        thumbColor={value ? colors.limeInk : colors.text}
        ios_backgroundColor="#343B49"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },
  copy: { flex: 1, gap: space.xs },
});
