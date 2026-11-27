import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { RecipeDetailsScreen } from '../features/recipes/screens/RecipeDetailsScreen';
import { EditProfileScreen } from '../features/profile/screens/EditProfileScreen';
import type { MainStackParamList } from './types';
import { MainTabNavigator } from './MainTabNavigator';
import { useCraveTheme } from '../shared/theme/useCraveTheme';

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainNavigator() {
  const theme = useCraveTheme();

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
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Edit profile' }}
      />
    </Stack.Navigator>
  );
}
