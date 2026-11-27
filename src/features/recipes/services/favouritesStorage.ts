import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';

import type { Meal } from './mealApi';

const FAVOURITES_KEY_PREFIX = 'craveapp.favourites.v1.';

const mealSchema = z
  .object({
    idMeal: z.string(),
    strMeal: z.string(),
    strMealThumb: z.string(),
    strCategory: z.string().nullish(),
    strArea: z.string().nullish(),
    strInstructions: z.string().nullish(),
  })
  .passthrough();

const favouritesSchema = z.array(mealSchema);
const storedFavouriteSchema = z.object({
  meal: mealSchema,
  addedAt: z.number().finite(),
});
const versionedFavouritesSchema = z.object({
  version: z.literal(2),
  entries: z.array(storedFavouriteSchema),
});

export interface StoredFavourite {
  meal: Meal;
  addedAt: number;
}

function getStorageKey(userId: string): string {
  return `${FAVOURITES_KEY_PREFIX}${encodeURIComponent(userId)}`;
}

function uniqueMeals(meals: Meal[]): Meal[] {
  const mealsById = new Map<string, Meal>();

  meals.forEach((meal) => {
    mealsById.set(meal.idMeal, meal);
  });

  return Array.from(mealsById.values());
}

export async function readUserFavourites(userId: string): Promise<Meal[]> {
  const entries = await readUserFavouriteEntries(userId);
  return entries.map(({ meal }) => meal);
}

export async function readUserFavouriteEntries(
  userId: string,
): Promise<StoredFavourite[]> {
  const key = getStorageKey(userId);
  const storedFavourites = await AsyncStorage.getItem(key);

  if (storedFavourites === null) {
    return [];
  }

  let parsedFavourites: unknown;

  try {
    parsedFavourites = JSON.parse(storedFavourites);
  } catch {
    throw new Error('Saved favourites could not be read.');
  }

  const versionedResult = versionedFavouritesSchema.safeParse(parsedFavourites);
  if (versionedResult.success) {
    return uniqueEntries(versionedResult.data.entries);
  }

  const legacyResult = favouritesSchema.safeParse(parsedFavourites);
  if (legacyResult.success) {
    const now = Date.now();
    return uniqueEntries(
      legacyResult.data.map((meal, index) => ({
        meal,
        addedAt: now - (legacyResult.data.length - index) * 1000,
      })),
    );
  }

  throw new Error('Saved favourites have invalid data and were not changed.');
}

export async function saveUserFavourites(
  userId: string,
  favourites: Meal[],
): Promise<void> {
  const previousEntries = await readUserFavouriteEntries(userId);
  const addedAtByMealId = new Map(
    previousEntries.map(({ meal, addedAt }) => [meal.idMeal, addedAt]),
  );
  const entries = uniqueMeals(favourites).map((meal) => ({
    meal,
    addedAt: addedAtByMealId.get(meal.idMeal) ?? Date.now(),
  }));
  await saveUserFavouriteEntries(userId, entries);
}

export async function saveUserFavouriteEntries(
  userId: string,
  entries: StoredFavourite[],
): Promise<void> {
  const unique = uniqueEntries(entries);
  await AsyncStorage.setItem(
    getStorageKey(userId),
    JSON.stringify({ version: 2, entries: unique }),
  );
}

function uniqueEntries(entries: StoredFavourite[]): StoredFavourite[] {
  const entriesById = new Map<string, StoredFavourite>();
  entries.forEach((entry) => entriesById.set(entry.meal.idMeal, entry));
  return Array.from(entriesById.values());
}
