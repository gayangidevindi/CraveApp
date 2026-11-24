import { Feather } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';

import { useCraveThemeStyles } from '../theme/useCraveTheme';

type FeatherIconName = ComponentProps<typeof Feather>['name'];

interface PlaceholderScreenProps {
  title: string;
  description: string;
  icon: FeatherIconName;
  children?: ReactNode;
}

export function PlaceholderScreen({
  title,
  description,
  icon,
  children,
}: PlaceholderScreenProps) {
  const { theme, styles } = useCraveThemeStyles(createStyles);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Feather
            name={icon}
            size={30}
            color={theme.colors.deepOrange}
            accessible={false}
          />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        {children}
      </View>
    </SafeAreaView>
  );
}

function createStyles(theme: import('../theme/theme').CraveTheme) {
  return StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.warmCream,
  },
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  iconContainer: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.elevatedSurface,
  },
  title: {
    marginTop: theme.spacing.lg,
    color: theme.colors.heading,
    fontSize: theme.typography.heading,
    fontWeight: theme.typography.weight.bold,
    textAlign: 'center',
  },
  description: {
    maxWidth: 400,
    marginTop: theme.spacing.sm,
    color: theme.colors.chocolateBrown,
    fontSize: theme.typography.body,
    lineHeight: theme.typography.lineHeight.body,
    textAlign: 'center',
  },
  });
}
