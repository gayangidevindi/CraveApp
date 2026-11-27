import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import type { Meal } from '../services/mealApi';
import {
  readUserFavouriteEntries,
  saveUserFavouriteEntries,
  type StoredFavourite,
} from '../services/favouritesStorage';

export interface FavouritesState {
  byUser: Record<string, Meal[]>;
  addedAtByUser: Record<string, Record<string, number>>;
  loadedByUser: Record<string, boolean>;
  loadingByUser: Record<string, boolean>;
  savingByUser: Record<string, boolean>;
  errorByUser: Record<string, string | null>;
}

const initialState: FavouritesState = {
  byUser: {},
  addedAtByUser: {},
  loadedByUser: {},
  loadingByUser: {},
  savingByUser: {},
  errorByUser: {},
};

interface FavouritesThunkConfig {
  state: { favourites: FavouritesState };
  rejectValue: string;
}

function getStorageErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Favourites could not be saved. Please try again.';
}

export const loadUserFavourites = createAsyncThunk<
  { userId: string; entries: StoredFavourite[] },
  string,
  FavouritesThunkConfig
>(
  'favourites/loadUserFavourites',
  async (userId, { rejectWithValue }) => {
    try {
      return { userId, entries: await readUserFavouriteEntries(userId) };
    } catch (error) {
      return rejectWithValue(getStorageErrorMessage(error));
    }
  },
  {
    condition: (userId, { getState }) =>
      !getState().favourites.loadedByUser[userId] &&
      !getState().favourites.loadingByUser[userId],
  },
);

export const toggleUserFavourite = createAsyncThunk<
  {
    userId: string;
    meals: Meal[];
    addedAtByMealId: Record<string, number>;
  },
  { userId: string; meal: Meal },
  FavouritesThunkConfig
>(
  'favourites/toggleUserFavourite',
  async ({ userId, meal }, { getState, rejectWithValue }) => {
    const favourites = getState().favourites.byUser[userId] ?? [];
    const addedAt = getState().favourites.addedAtByUser[userId] ?? {};
    const isSaved = favourites.some(
      (favourite) => favourite.idMeal === meal.idMeal,
    );
    const nextFavourites = isSaved
      ? favourites.filter((favourite) => favourite.idMeal !== meal.idMeal)
      : [...favourites, meal];
    const nextAddedAt = { ...addedAt };
    if (isSaved) {
      delete nextAddedAt[meal.idMeal];
    } else {
      nextAddedAt[meal.idMeal] = Date.now();
    }

    try {
      await saveUserFavouriteEntries(
        userId,
        nextFavourites.map((favourite) => ({
          meal: favourite,
          addedAt: nextAddedAt[favourite.idMeal] ?? Date.now(),
        })),
      );
      return { userId, meals: nextFavourites, addedAtByMealId: nextAddedAt };
    } catch (error) {
      return rejectWithValue(getStorageErrorMessage(error));
    }
  },
  {
    condition: ({ userId }, { getState }) =>
      getState().favourites.loadedByUser[userId] === true &&
      getState().favourites.savingByUser[userId] !== true,
  },
);

const favouritesSlice = createSlice({
  name: 'favourites',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadUserFavourites.pending, (state, action) => {
        state.loadingByUser[action.meta.arg] = true;
        state.errorByUser[action.meta.arg] = null;
      })
      .addCase(loadUserFavourites.fulfilled, (state, action) => {
        const { userId, entries } = action.payload;
        state.byUser[userId] = entries.map(({ meal }) => meal);
        state.addedAtByUser[userId] = Object.fromEntries(
          entries.map(({ meal, addedAt }) => [meal.idMeal, addedAt]),
        );
        state.loadedByUser[userId] = true;
        state.loadingByUser[userId] = false;
        state.errorByUser[userId] = null;
      })
      .addCase(loadUserFavourites.rejected, (state, action) => {
        if (!action.meta.condition) {
          state.loadingByUser[action.meta.arg] = false;
          state.errorByUser[action.meta.arg] =
            action.payload ??
            action.error.message ??
            'Favourites could not load.';
        }
      })
      .addCase(toggleUserFavourite.pending, (state, action) => {
        state.savingByUser[action.meta.arg.userId] = true;
        state.errorByUser[action.meta.arg.userId] = null;
      })
      .addCase(toggleUserFavourite.fulfilled, (state, action) => {
        const { userId, meals, addedAtByMealId } = action.payload;
        state.byUser[userId] = meals;
        state.addedAtByUser[userId] = addedAtByMealId;
        state.savingByUser[userId] = false;
        state.errorByUser[userId] = null;
      })
      .addCase(toggleUserFavourite.rejected, (state, action) => {
        const userId = action.meta.arg.userId;
        state.savingByUser[userId] = false;
        if (!action.meta.condition) {
          state.errorByUser[userId] =
            action.payload ?? action.error.message ?? 'Favourites could not save.';
        }
      });
  },
});

export default favouritesSlice.reducer;
