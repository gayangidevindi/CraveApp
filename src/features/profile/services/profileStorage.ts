import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  userProfileSchema,
  type UserProfile,
} from '../types/profileTypes';

const PROFILE_KEY_PREFIX = 'craveapp.profile.v1.';

function getStorageKey(userId: string): string {
  return `${PROFILE_KEY_PREFIX}${encodeURIComponent(userId)}`;
}

export async function readUserProfile(
  userId: string,
): Promise<UserProfile | null> {
  const storedProfile = await AsyncStorage.getItem(getStorageKey(userId));

  if (storedProfile === null) {
    return null;
  }

  let parsedProfile: unknown;

  try {
    parsedProfile = JSON.parse(storedProfile);
  } catch {
    throw new Error(
      'Saved profile data could not be read. You can continue editing and save again.',
    );
  }

  const result = userProfileSchema.safeParse(parsedProfile);

  if (!result.success) {
    throw new Error(
      'Saved profile data is invalid. Update your profile and save it again.',
    );
  }

  return result.data;
}

export async function saveUserProfile(
  userId: string,
  profile: UserProfile,
): Promise<void> {
  const result = userProfileSchema.safeParse(profile);

  if (!result.success) {
    throw new Error(
      result.error.issues[0]?.message ??
        'Profile data could not be validated.',
    );
  }

  await AsyncStorage.setItem(
    getStorageKey(userId),
    JSON.stringify(result.data),
  );
}
