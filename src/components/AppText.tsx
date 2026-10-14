import { Text, type TextProps, type TextStyle } from 'react-native';
import { colors, typeScale } from '../theme/tokens';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'small' | 'meta';

const styles: Record<Variant, TextStyle> = {
  display: { fontSize: typeScale.display, lineHeight: 40, fontWeight: '600', letterSpacing: -0.7, color: colors.text },
  title: { fontSize: typeScale.title, lineHeight: 32, fontWeight: '600', letterSpacing: -0.4, color: colors.text },
  heading: { fontSize: typeScale.heading, lineHeight: 22, fontWeight: '600', color: colors.text },
  body: { fontSize: typeScale.body, lineHeight: 22, fontWeight: '400', color: colors.text },
  small: { fontSize: typeScale.small, lineHeight: 20, fontWeight: '400', color: colors.text },
  meta: { fontSize: typeScale.meta, lineHeight: 16, fontWeight: '500', letterSpacing: 0.2, color: colors.textMuted },
};

interface Props extends TextProps {
  variant?: Variant;
  color?: string;
}

export function AppText({ variant = 'body', color, style, ...props }: Props) {
  return (
    <Text
      allowFontScaling
      maxFontSizeMultiplier={variant === 'display' || variant === 'title' ? 1.25 : 1.4}
      style={[styles[variant], color ? { color } : null, style]}
      {...props}
    />
  );
}
