import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { readLastRecipeSync } from '../services/recipeSyncStorage';

interface RecipeSyncState {
  lastSyncedAt: number | null;
  hydrated: boolean;
}

const initialState: RecipeSyncState = {
  lastSyncedAt: null,
  hydrated: false,
};

export const hydrateRecipeSync = createAsyncThunk(
  'recipeSync/hydrate',
  async () => readLastRecipeSync(),
);

const recipeSyncSlice = createSlice({
  name: 'recipeSync',
  initialState,
  reducers: {
    recipeSyncUpdated(state, action: PayloadAction<number>) {
      state.lastSyncedAt = action.payload;
      state.hydrated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateRecipeSync.fulfilled, (state, action) => {
        if (
          action.payload !== null &&
          (state.lastSyncedAt === null ||
            action.payload > state.lastSyncedAt)
        ) {
          state.lastSyncedAt = action.payload;
        }
        state.hydrated = true;
      })
      .addCase(hydrateRecipeSync.rejected, (state) => {
        state.hydrated = true;
      });
  },
});

export const { recipeSyncUpdated } = recipeSyncSlice.actions;
export default recipeSyncSlice.reducer;
