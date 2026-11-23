import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect } from 'react';

import { useAppDispatch, useAppSelector } from '../store/hooks';
import { restoreAuthSession } from '../features/auth/state/authActions';
import { LoadingState } from '../shared/components/LoadingState';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const dispatch = useAppDispatch();
  const { status, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    void dispatch(restoreAuthSession());
  }, [dispatch]);

  if (status === 'idle' || status === 'restoring') {
    return <LoadingState label="Restoring your session..." />;
  }

  return (
    <Stack.Navigator
      key={user ? 'authenticated' : 'unauthenticated'}
      initialRouteName={user ? 'Main' : 'Authentication'}
      screenOptions={{ headerShown: false }}
    >
      {user ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Authentication" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
