import { Pressable, StyleSheet, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radii, space } from '../theme/tokens';
import { selectHaptic } from '../services/haptics';
import { AppText } from './AppText';

const ICONS = {
  index: 'sunny-outline',
  activity: 'time-outline',
  sources: 'grid-outline',
  settings: 'options-outline',
} as const;

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { bottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const title = descriptors[route.key]?.options.title ?? route.name;
        const icon = ICONS[route.name as keyof typeof ICONS] ?? 'ellipse-outline';
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={title}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) {
                selectHaptic();
                navigation.navigate(route.name);
              }
            }}
            style={styles.item}
          >
            <Ionicons name={icon} size={20} color={focused ? colors.lime : colors.textMuted} />
            <AppText variant="meta" color={focused ? colors.lime : colors.textMuted} maxFontSizeMultiplier={1.2}>
              {title}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    minHeight: 64,
    borderRadius: radii.xl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    paddingHorizontal: space.xs,
    paddingVertical: space.sm,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, minHeight: 48 },
});
