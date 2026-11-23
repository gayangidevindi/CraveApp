import AsyncStorage from '@react-native-async-storage/async-storage';

import { readUserProfile, saveUserProfile } from '../profileStorage';
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

describe('profileStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('persists editable profile fields and a durable image data URI', async () => {
    const profile: UserProfile = {
      ...createDefaultUserProfile('Alex Example'),
      phoneNumber: '+1 555 123 4567',
      city: 'Toronto',
      dateOfBirth: '1990-04-15',
      bio: 'I love homemade pasta.',
      preferredCuisines: ['Italian', 'Japanese'],
      dietaryPreferences: ['Vegetarian'],
      cookingSkill: 'Intermediate',
      avatarDataUri: 'data:image/jpeg;base64,compressed-image-data',
    };

    await saveUserProfile('account-1', profile);

    await expect(readUserProfile('account-1')).resolves.toEqual(profile);
  });

  it('keeps saved profile records isolated by authenticated user ID', async () => {
    await saveUserProfile(
      'account-1',
      createDefaultUserProfile('Alex Example'),
    );
    await saveUserProfile(
      'account-2',
      createDefaultUserProfile('Sam Example'),
    );

    await expect(readUserProfile('account-1')).resolves.toMatchObject({
      fullName: 'Alex Example',
    });
    await expect(readUserProfile('account-2')).resolves.toMatchObject({
      fullName: 'Sam Example',
    });
  });

  it('reports corrupt profile records instead of silently replacing them', async () => {
    await AsyncStorage.setItem(
      'craveapp.profile.v1.account-1',
      '{invalid',
    );

    await expect(readUserProfile('account-1')).rejects.toThrow(
      'Saved profile data could not be read.',
    );
  });
});
