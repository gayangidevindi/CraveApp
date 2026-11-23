import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect } from 'react';

import { useAppDispatch, useAppSelector } from '../store/hooks';
import { restoreAuthSession } from '../features/auth/state/authActions';
import { loadUserFavourites } from '../features/recipes/state/favouritesSlice';
import { loadUserProfile } from '../features/profile/state/profileSlice';
import { LoadingState } from '../shared/components/LoadingState';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const dispatch = useAppDispatch();
  const { status, user } = useAppSelector((state) => state.auth);
  const userId = user === null ? null : String(user.id);

  useEffect(() => {
    void dispatch(restoreAuthSession());
  }, [dispatch]);

  useEffect(() => {
    if (userId !== null) {
      void dispatch(loadUserFavourites(userId));
      void dispatch(loadUserProfile(userId));
    }
  }, [dispatch, userId]);

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
