import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '../../../shared/components/EmptyState';
import { theme } from '../../../shared/theme/theme';

export function FavouritesScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Favourites</Text>
        <EmptyState
          title="No favourites yet"
          message="Saved recipes will appear here when recipe browsing is available."
          icon="heart"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.warmCream,
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing.lg,
  },
  title: {
    color: theme.colors.darkBrown,
    fontSize: theme.typography.title,
    fontWeight: theme.typography.weight.bold,
  },
});
