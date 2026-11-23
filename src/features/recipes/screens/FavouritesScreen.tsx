import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, Text } from 'react-native';

import type { MainTabScreenProps } from '../../../navigation/types';
import { RecipeCard } from '../../../shared/components/RecipeCard';
import { theme } from '../../../shared/theme/theme';

type Props = MainTabScreenProps<'Favourites'>;

export function FavouritesScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Favourites</Text>
        <Text style={styles.description}>
          Sample content for previewing recipe details from this tab.
        </Text>
        <RecipeCard
          title="Sample favourite"
          category="Development preview"
          description="Recipe data and saved favourites are not connected yet."
          prepTime="20 min"
          isFavorite
          onPress={() =>
            navigation.navigate('RecipeDetails', {
              recipeId: 'sample-favourite-001',
            })
          }
          style={styles.recipeCard}
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
  description: {
    marginTop: theme.spacing.sm,
    color: theme.colors.chocolateBrown,
    fontSize: theme.typography.body,
    lineHeight: theme.typography.lineHeight.body,
  },
  recipeCard: {
    marginTop: theme.spacing.lg,
  },
});
