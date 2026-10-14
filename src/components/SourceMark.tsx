import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { SourceId } from '../types';
import { SOURCE_META } from '../services/sources/catalog';

export function SourceMark({ sourceId, size = 36 }: { sourceId: SourceId; size?: number }) {
  const meta = SOURCE_META[sourceId];
  return (
    <View
      style={[
        styles.mark,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: `${meta.tint}22`,
        },
      ]}
    >
      <Ionicons name={meta.icon} size={size * 0.5} color={meta.tint} />
    </View>
  );
}

const styles = StyleSheet.create({
  mark: { alignItems: 'center', justifyContent: 'center' },
});
