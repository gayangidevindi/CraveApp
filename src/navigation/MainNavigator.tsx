import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { RecipeDetailsScreen } from '../features/recipes/screens/RecipeDetailsScreen';
import type { MainStackParamList } from './types';
import { MainTabNavigator } from './MainTabNavigator';
import { theme } from '../shared/theme/theme';

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.warmCream },
        headerTintColor: theme.colors.darkBrown,
        headerTitleStyle: {
          color: theme.colors.darkBrown,
          fontWeight: theme.typography.weight.semibold,
        },
        contentStyle: { backgroundColor: theme.colors.warmCream },
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RecipeDetails"
        component={RecipeDetailsScreen}
        options={{ title: 'Recipe details' }}
      />
    </Stack.Navigator>
  );
}
