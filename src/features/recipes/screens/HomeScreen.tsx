import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, Text } from 'react-native';

import type { MainTabScreenProps } from '../../../navigation/types';
import { RecipeCard } from '../../../shared/components/RecipeCard';
import { theme } from '../../../shared/theme/theme';

type Props = MainTabScreenProps<'Home'>;

export function HomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>GOOD FOOD STARTS HERE</Text>
        <Text style={styles.title}>Find your next favourite.</Text>
        <Text style={styles.description}>
          This sample card demonstrates navigation to recipe details.
        </Text>
        <RecipeCard
          title="Sample recipe"
          category="Development preview"
          description="A placeholder recipe for checking typed navigation."
          prepTime="25 min"
          rating={4.8}
          onPress={() =>
            navigation.navigate('RecipeDetails', {
              recipeId: 'sample-recipe-001',
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
  eyebrow: {
    color: theme.colors.deepOrange,
    fontSize: theme.typography.caption,
    fontWeight: theme.typography.weight.bold,
    letterSpacing: 1,
  },
  title: {
    marginTop: theme.spacing.sm,
    color: theme.colors.darkBrown,
    fontSize: theme.typography.title,
    fontWeight: theme.typography.weight.bold,
    lineHeight: theme.typography.lineHeight.title,
  },
  description: {
    marginTop: theme.spacing.sm,
    color: theme.colors.chocolateBrown,
    fontSize: theme.typography.body,
    lineHeight: theme.typography.lineHeight.body,
  },
  recipeCard: {
    marginTop: theme.spacing.xl,
  },
});
