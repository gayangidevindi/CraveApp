import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { DevelopmentEntryScreen } from './DevelopmentEntryScreen';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName={__DEV__ ? 'DevelopmentEntry' : 'Authentication'}
      screenOptions={{ headerShown: false }}
    >
      {__DEV__ ? (
        <Stack.Screen
          name="DevelopmentEntry"
          component={DevelopmentEntryScreen}
        />
      ) : null}
      <Stack.Screen name="Authentication" component={AuthNavigator} />
      <Stack.Screen name="Main" component={MainNavigator} />
    </Stack.Navigator>
  );
}
