import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LoginScreen } from '../features/auth/screens/LoginScreen';
import { RegisterScreen } from '../features/auth/screens/RegisterScreen';
import type { AuthStackParamList } from './types';
import { useCraveTheme } from '../shared/theme/useCraveTheme';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  const theme = useCraveTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
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
        name="Login"
        component={LoginScreen}
        options={{ title: 'Log in' }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: 'Create account' }}
      />
    </Stack.Navigator>
  );
}
