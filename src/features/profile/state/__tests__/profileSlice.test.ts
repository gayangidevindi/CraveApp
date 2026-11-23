import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureStore } from '@reduxjs/toolkit';

import authReducer, {
  sessionRestoreSucceeded,
} from '../../../../store/authSlice';
import profileReducer, {
  loadUserProfile,
  updateUserProfile,
} from '../profileSlice';
import {
  createDefaultUserProfile,
  type UserProfile,
} from '../../types/profileTypes';

jest.mock('@react-native-async-storage/async-storage', () => {
  const values = new Map<string, string>();

  return {
    __esModule: true,
    default: {
      clear: jest.fn(async () => {
        values.clear();
      }),
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      removeItem: jest.fn(async (key: string) => {
        values.delete(key);
      }),
      setItem: jest.fn(async (key: string, value: string) => {
        values.set(key, value);
      }),
    },
  };
});

function createTestStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      profile: profileReducer,
    },
  });
}

describe('profileSlice', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('restores persisted edits after a fresh store is created', async () => {
    const firstStore = createTestStore();
    await firstStore.dispatch(loadUserProfile('42')).unwrap();

    const editedProfile = {
      ...createDefaultUserProfile('Alex Example'),
      city: 'Toronto',
      bio: 'Always trying a new recipe.',
    };

    await firstStore
      .dispatch(
        updateUserProfile({ userId: '42', profile: editedProfile }),
      )
      .unwrap();

    const restoredStore = createTestStore();
    await restoredStore.dispatch(loadUserProfile('42')).unwrap();

    expect(restoredStore.getState().profile.byUser['42']).toEqual(
      editedProfile,
    );
  });

  it('does not overwrite local profile edits when auth state is restored', async () => {
    const store = createTestStore();
    await store.dispatch(loadUserProfile('42')).unwrap();

    const editedProfile: UserProfile = {
      ...createDefaultUserProfile('Alex Example'),
      city: 'Toronto',
      preferredCuisines: ['Italian'],
    };
    await store
      .dispatch(
        updateUserProfile({ userId: '42', profile: editedProfile }),
      )
      .unwrap();

    store.dispatch(
      sessionRestoreSucceeded({
        id: 42,
        username: 'alex',
        email: 'alex@example.com',
        firstName: 'Alex',
        lastName: 'Account',
      }),
    );

    expect(store.getState().profile.byUser['42']).toEqual(editedProfile);
  });
});
