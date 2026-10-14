import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useAppStore } from '../../store/useAppStore';
import { countAttention } from '../../services/notifications/sorting';
import { tapHaptic } from '../../services/haptics';
import { useMotionEnabled } from '../../hooks/useMotion';
import { colors, layout } from '../../theme/tokens';
import { AppText } from '../../components/AppText';

interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function FloatingBubble() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const anchor = useAppStore((state) => state.settings.bubbleAnchor);
  const savedY = useAppStore((state) => state.settings.bubbleY);
  const setBubblePlacement = useAppStore((state) => state.setBubblePlacement);
  const setBubbleAnchor = useAppStore((state) => state.setBubbleAnchor);
  const setBubbleOpen = useAppStore((state) => state.setBubbleOpen);
  const notifications = useAppStore((state) => state.notifications);
  const pulse = useAppStore((state) => state.pulse);
  const motion = useMotionEnabled();
  const count = countAttention(notifications);
  const [placed, setPlaced] = useState(false);

  const bounds: Bounds = {
    minX: 12,
    maxX: Math.max(12, width - layout.bubble - 12),
    minY: insets.top + 8,
    maxY: Math.max(insets.top + 8, height - insets.bottom - layout.tabClearance - layout.bubble),
  };

  const x = useSharedValue(bounds.maxX);
  const y = useSharedValue(bounds.maxY);
  const scale = useSharedValue(1);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const minX = useSharedValue(bounds.minX);
  const maxX = useSharedValue(bounds.maxX);
  const minY = useSharedValue(bounds.minY);
  const maxY = useSharedValue(bounds.maxY);
  const reduce = useSharedValue(motion ? 0 : 1);

  minX.value = bounds.minX;
  maxX.value = bounds.maxX;
  minY.value = bounds.minY;
  maxY.value = bounds.maxY;
  reduce.value = motion ? 0 : 1;

  useEffect(() => {
    const nextY = clamp(savedY ?? bounds.maxY - 16, bounds.minY, bounds.maxY);
    const nextX = anchor === 'left' ? bounds.minX : bounds.maxX;
    if (Math.abs(x.value - nextX) > 1 || Math.abs(y.value - nextY) > 1) {
      x.value = nextX;
      y.value = nextY;
    }
    setPlaced(true);
    if (savedY !== null && Math.abs(savedY - nextY) > 1) {
      setBubblePlacement(anchor, nextY);
    }
  }, [anchor, bounds.maxX, bounds.maxY, bounds.minX, bounds.minY, savedY, setBubblePlacement, x, y]);

  useEffect(() => {
    if (!placed || pulse === 0 || !motion) return;
    scale.value = withSequence(
      withTiming(1.08, { duration: 160 }),
      withTiming(1, { duration: 160 }),
      withTiming(1.08, { duration: 160 }),
      withTiming(1, { duration: 180 }),
    );
  }, [motion, placed, pulse, scale]);

  const finishDrag = useCallback(
    (edge: 'left' | 'right', nextY: number) => {
      tapHaptic();
      setBubblePlacement(edge, nextY);
    },
    [setBubblePlacement],
  );

  const lastOpen = useRef(0);
  const openPanel = useCallback(() => {
    const time = Date.now();
    if (time - lastOpen.current < 450) return;
    lastOpen.current = time;
    tapHaptic();
    setBubbleOpen(true);
  }, [setBubbleOpen]);

  const gesture = useMemo(() => {
    const pan = Gesture.Pan()
      .minDistance(12)
      .onStart(() => {
        dragX.value = x.value;
        dragY.value = y.value;
      })
      .onUpdate((event) => {
        x.value = Math.min(Math.max(dragX.value + event.translationX, minX.value), maxX.value);
        y.value = Math.min(Math.max(dragY.value + event.translationY, minY.value), maxY.value);
      })
      .onEnd(() => {
        const targetX = x.value < (minX.value + maxX.value) / 2 ? minX.value : maxX.value;
        const targetY = Math.min(Math.max(y.value, minY.value), maxY.value);
        const duration = reduce.value ? 0 : 220;
        x.value = withTiming(targetX, { duration });
        y.value = withTiming(targetY, { duration });
        runOnJS(finishDrag)(targetX === minX.value ? 'left' : 'right', targetY);
      });
    const tap = Gesture.Tap().onEnd(() => {
      runOnJS(openPanel)();
    });
    return Gesture.Exclusive(pan, tap);
  }, [dragX, dragY, finishDrag, maxX, maxY, minX, minY, openPanel, reduce, x, y]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: scale.value }],
  }));

  const moveBy = (delta: number) => {
    const nextY = clamp((savedY ?? bounds.maxY - 16) + delta, bounds.minY, bounds.maxY);
    setBubblePlacement(anchor, nextY);
  };

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Nudge bubble, ${count} need attention. Double tap to open. Use actions to move it without dragging.`}
        accessibilityActions={[
          { name: 'increment', label: 'Move bubble up' },
          { name: 'decrement', label: 'Move bubble down' },
          { name: 'magicTap', label: 'Move bubble to the other edge' },
        ]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'increment') moveBy(-72);
          if (event.nativeEvent.actionName === 'decrement') moveBy(72);
          if (event.nativeEvent.actionName === 'magicTap') setBubbleAnchor(anchor === 'left' ? 'right' : 'left');
        }}
        onAccessibilityTap={openPanel}
        collapsable={false}
        style={[styles.bubble, animatedStyle, styles.hit, { opacity: placed ? 1 : 0 }]}
      >
        <AppText variant="heading" color={colors.limeInk} maxFontSizeMultiplier={1.1} style={styles.count}>
          {count > 9 ? '9+' : String(count)}
        </AppText>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: layout.bubble,
    height: layout.bubble,
    borderRadius: layout.bubble / 2,
    backgroundColor: colors.lime,
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  hit: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  count: { fontSize: 18, fontWeight: '700' },
});
