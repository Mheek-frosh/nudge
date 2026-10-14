import { useEffect } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { Stack, usePathname } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useAppStore } from '../src/store/useAppStore';
import { colors } from '../src/theme/tokens';
import { AppText } from '../src/components/AppText';
import { FloatingBubble } from '../src/features/bubble/FloatingBubble';
import { AttentionPanel } from '../src/features/bubble/AttentionPanel';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const hydrated = useAppStore((state) => state.hydrated);
  const hydrate = useAppStore((state) => state.hydrate);
  const reconcile = useAppStore((state) => state.reconcile);
  const onboarded = useAppStore((state) => state.settings.onboardingComplete);
  const showBubble = useAppStore((state) => state.settings.showBubble);
  const bubbleOpen = useAppStore((state) => state.bubbleOpen);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    SplashScreen.hideAsync().catch(() => undefined);
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const timer = setInterval(() => reconcile(), 10_000);
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') reconcile();
    });
    let response: { remove: () => void } | null = null;
    try {
      response = Notifications.addNotificationResponseReceivedListener((event) => {
        const data = event.notification.request.content.data;
        const id = data && typeof data === 'object' && 'notificationId' in data ? data.notificationId : null;
        if (typeof id === 'string') router.push(`/notification/${id}`);
      });
    } catch {
      response = null;
    }
    return () => {
      clearInterval(timer);
      subscription.remove();
      response?.remove();
    };
  }, [hydrated, reconcile, router]);

  const showFloating = hydrated && onboarded && showBubble && !pathname.startsWith('/onboarding');

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      {hydrated ? (
        <Stack
          initialRouteName={onboarded ? '(tabs)' : 'onboarding'}
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="onboarding" options={{ gestureEnabled: false, animation: 'fade' }} />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="notification/[id]" options={{ animation: 'slide_from_right' }} />
        </Stack>
      ) : (
        <View style={styles.loading}>
          <AppText variant="title">Nudge</AppText>
        </View>
      )}
      {showFloating ? (
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          {bubbleOpen ? <AttentionPanel /> : <FloatingBubble />}
        </View>
      ) : null}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
});
