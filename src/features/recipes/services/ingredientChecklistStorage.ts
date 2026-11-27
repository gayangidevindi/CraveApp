import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';

const CHECKLIST_PREFIX = 'craveapp.recipes.checklist.v1.';
const checkedItemsSchema = z.array(z.string());

function getStorageKey(userId: string, recipeId: string): string {
  return `${CHECKLIST_PREFIX}${encodeURIComponent(userId)}.${encodeURIComponent(recipeId)}`;
}

export async function readIngredientChecklist(
  userId: string,
  recipeId: string,
): Promise<string[]> {
  const storedValue = await AsyncStorage.getItem(
    getStorageKey(userId, recipeId),
  );
  if (storedValue === null) {
    return [];
  }

  let parsedValue: unknown;
  try {
    parsedValue = JSON.parse(storedValue);
  } catch {
    throw new Error('Saved ingredient checklist could not be read.');
  }

  const result = checkedItemsSchema.safeParse(parsedValue);
  if (!result.success) {
    throw new Error('Saved ingredient checklist has invalid data.');
  }

  return result.data;
}

export async function saveIngredientChecklist(
  userId: string,
  recipeId: string,
  checkedItems: string[],
): Promise<void> {
  await AsyncStorage.setItem(
    getStorageKey(userId, recipeId),
    JSON.stringify(Array.from(new Set(checkedItems))),
  );
}
