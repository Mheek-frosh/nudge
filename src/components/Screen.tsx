import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout, space } from '../theme/tokens';

interface Props {
  children: ReactNode;
  scroll?: boolean;
  tabBar?: boolean;
}

export function Screen({ children, scroll = true, tabBar = true }: Props) {
  const insets = useSafeAreaInsets();
  const paddingTop = insets.top + space.md;
  const paddingBottom = (tabBar ? layout.tabClearance : space.xxl) + insets.bottom;
  if (!scroll) {
    return <View style={[styles.root, { paddingTop, paddingBottom, paddingHorizontal: layout.screenPadding }]}>{children}</View>;
  }
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop, paddingBottom }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: layout.screenPadding, gap: space.lg },
});
