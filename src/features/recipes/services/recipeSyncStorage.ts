import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';

const LAST_SYNC_KEY = 'craveapp.recipes.last-sync.v1';

const timestampSchema = z.number().int().positive();

export async function readLastRecipeSync(): Promise<number | null> {
  const value = await AsyncStorage.getItem(LAST_SYNC_KEY);
  if (value === null) {
    return null;
  }

  const parsedValue: unknown = Number(value);
  const result = timestampSchema.safeParse(parsedValue);
  return result.success ? result.data : null;
}

export async function saveLastRecipeSync(timestamp: number): Promise<void> {
  const result = timestampSchema.safeParse(timestamp);
  if (!result.success) {
    throw new Error('A valid recipe synchronization time is required.');
  }

  await AsyncStorage.setItem(LAST_SYNC_KEY, String(timestamp));
}
