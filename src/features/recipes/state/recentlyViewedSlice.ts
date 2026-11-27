import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import type { Meal } from '../services/mealApi';
import {
  readRecentlyViewed,
  saveRecentlyViewed,
} from '../services/recentlyViewedStorage';

interface RecentlyViewedState {
  byUser: Record<string, Meal[]>;
  loadedByUser: Record<string, boolean>;
  loadingByUser: Record<string, boolean>;
  errorByUser: Record<string, string | null>;
}

const initialState: RecentlyViewedState = {
  byUser: {},
  loadedByUser: {},
  loadingByUser: {},
  errorByUser: {},
};

interface ThunkConfig {
  state: { recentlyViewed: RecentlyViewedState };
  rejectValue: string;
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Recently viewed recipes could not be saved.';
}

export const loadRecentlyViewed = createAsyncThunk<
  { userId: string; meals: Meal[] },
  string,
  ThunkConfig
>(
  'recentlyViewed/load',
  async (userId, { rejectWithValue }) => {
    try {
      return { userId, meals: await readRecentlyViewed(userId) };
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
  {
    condition: (userId, { getState }) =>
      !getState().recentlyViewed.loadingByUser[userId],
  },
);

export const recordRecentlyViewed = createAsyncThunk<
  { userId: string; meals: Meal[] },
  { userId: string; meal: Meal },
  ThunkConfig
>(
  'recentlyViewed/record',
  async ({ userId, meal }, { getState, rejectWithValue }) => {
    const current = getState().recentlyViewed.byUser[userId] ?? [];
    const next = [
      meal,
      ...current.filter((item) => item.idMeal !== meal.idMeal),
    ].slice(0, 12);
    try {
      await saveRecentlyViewed(userId, next);
      return { userId, meals: next };
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
  {
    condition: ({ userId }, { getState }) =>
      getState().recentlyViewed.loadedByUser[userId] === true,
  },
);

const recentlyViewedSlice = createSlice({
  name: 'recentlyViewed',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadRecentlyViewed.pending, (state, action) => {
        state.loadingByUser[action.meta.arg] = true;
        state.errorByUser[action.meta.arg] = null;
      })
      .addCase(loadRecentlyViewed.fulfilled, (state, action) => {
        const { userId, meals } = action.payload;
        state.byUser[userId] = meals;
        state.loadedByUser[userId] = true;
        state.loadingByUser[userId] = false;
        state.errorByUser[userId] = null;
      })
      .addCase(loadRecentlyViewed.rejected, (state, action) => {
        if (!action.meta.condition) {
          state.loadingByUser[action.meta.arg] = false;
          state.errorByUser[action.meta.arg] =
            action.payload ?? action.error.message ?? 'History could not load.';
          state.loadedByUser[action.meta.arg] = true;
        }
      })
      .addCase(recordRecentlyViewed.fulfilled, (state, action) => {
        const { userId, meals } = action.payload;
        state.byUser[userId] = meals;
        state.errorByUser[userId] = null;
      })
      .addCase(recordRecentlyViewed.rejected, (state, action) => {
        if (!action.meta.condition) {
          state.errorByUser[action.meta.arg.userId] =
            action.payload ??
            action.error.message ??
            'Recently viewed recipes could not be saved.';
        }
      });
  },
});

export default recentlyViewedSlice.reducer;
