import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, layout, radii, space } from '../theme/tokens';
import { formatClock } from '../utils/time';
import { AppText } from './AppText';

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function clockToDate(value: string): Date {
  const [hours, minutes] = value.split(':').map(Number);
  const date = new Date();
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
}

export function TimeField({ label, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${value}`}
        onPress={() => setOpen((current) => !current)}
        style={styles.row}
      >
        <AppText variant="heading">{label}</AppText>
        <AppText variant="heading" color={colors.lime}>
          {value}
        </AppText>
      </Pressable>
      {open ? (
        <DateTimePicker
          value={clockToDate(value)}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          themeVariant="dark"
          onChange={(event, selected) => {
            if (Platform.OS !== 'ios') setOpen(false);
            if (event.type === 'dismissed' || !selected) return;
            onChange(formatClock(selected));
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.xs },
  row: {
    minHeight: layout.minTouch,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    paddingHorizontal: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
