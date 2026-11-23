import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';

import type { MainStackParamList } from '../../../navigation/types';
import { PlaceholderScreen } from '../../../shared/components/PlaceholderScreen';
import { theme } from '../../../shared/theme/theme';

type Props = NativeStackScreenProps<MainStackParamList, 'RecipeDetails'>;

export function RecipeDetailsScreen({ route }: Props) {
  return (
    <PlaceholderScreen
      title="Recipe details"
      description="Recipe details will be loaded in a later stage."
      icon="book-open"
    >
      <View style={styles.recipeId}>
        <Text style={styles.label}>Recipe ID</Text>
        <Text style={styles.value}>{route.params.recipeId}</Text>
      </View>
    </PlaceholderScreen>
  );
}

const styles = StyleSheet.create({
  recipeId: {
    width: '100%',
    maxWidth: 360,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.white,
  },
  label: {
    color: theme.colors.chocolateBrown,
    fontSize: theme.typography.caption,
    fontWeight: theme.typography.weight.semibold,
  },
  value: {
    marginTop: theme.spacing.xs,
    color: theme.colors.darkBrown,
    fontSize: theme.typography.body,
    fontWeight: theme.typography.weight.semibold,
  },
});
