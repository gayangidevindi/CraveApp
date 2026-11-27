import { useEffect, useState } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useCraveThemeStyles } from '../theme/useCraveTheme';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface RecipeSkeletonCardProps {
  style?: StyleProp<ViewStyle>;
}

export function RecipeSkeletonCard({ style }: RecipeSkeletonCardProps) {
  const { theme, styles } = useCraveThemeStyles(createStyles);
  const reducedMotion = useReducedMotion();
  const [opacity] = useState(() => new Animated.Value(0.55));

  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(0.7);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 750,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacity, {
          toValue: 0.55,
          duration: 750,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    );
    animation.start();

    return () => animation.stop();
  }, [opacity, reducedMotion]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.card, style, { opacity }]}
    >
      <View style={[styles.block, styles.image]} />
      <View style={styles.copy}>
        <View style={[styles.block, styles.category]} />
        <View style={[styles.block, styles.title]} />
        <View style={[styles.block, styles.description]} />
      </View>
      <View
        style={[styles.favorite, { backgroundColor: theme.colors.card }]}
      />
    </Animated.View>
  );
}

function createStyles(theme: import('../theme/theme').CraveTheme) {
  return StyleSheet.create({
    card: {
      position: 'relative',
      overflow: 'hidden',
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.card,
      ...theme.shadows.card,
    },
    block: {
      backgroundColor: theme.colors.border,
      borderRadius: theme.radius.sm,
    },
    image: {
      width: '100%',
      aspectRatio: 1.65,
      borderRadius: 0,
    },
    copy: {
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
    },
    category: {
      width: '38%',
      height: 12,
    },
    title: {
      width: '82%',
      height: 20,
    },
    description: {
      width: '62%',
      height: 14,
    },
    favorite: {
      position: 'absolute',
      top: theme.spacing.sm,
      right: theme.spacing.sm,
      width: 44,
      height: 44,
      borderRadius: theme.radius.pill,
      opacity: 0.9,
    },
  });
}
