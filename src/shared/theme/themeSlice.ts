import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import {
  getInitialThemePreference,
  loadThemePreference,
  saveThemePreference,
} from './themeStorage';
import type { ThemeMode } from './theme';

export interface ThemeState {
  mode: ThemeMode;
  hydrated: boolean;
  isSaving: boolean;
  error: string | null;
}

const initialPreference = getInitialThemePreference();

const initialState: ThemeState = {
  mode: initialPreference.mode,
  hydrated: initialPreference.hydrated,
  isSaving: false,
  error: null,
};

function getErrorMessage(_error: unknown, fallback: string): string {
  return fallback;
}

export const hydrateThemePreference = createAsyncThunk<
  ThemeMode,
  void,
  { rejectValue: string }
>('theme/hydrate', async (_, { rejectWithValue }) => {
  try {
    return await loadThemePreference();
  } catch (error) {
    return rejectWithValue(
      getErrorMessage(
        error,
        'Unable to load your appearance setting. Please try again.',
      ),
    );
  }
});

export const setThemeMode = createAsyncThunk<
  ThemeMode,
  ThemeMode,
  { state: { theme: ThemeState }; rejectValue: string }
>(
  'theme/setMode',
  async (mode, { dispatch, getState, rejectWithValue }) => {
    const previousMode = getState().theme.mode;
    dispatch(themeModeUpdated(mode));

    try {
      await saveThemePreference(mode);
      return mode;
    } catch (error) {
      if (getState().theme.mode === mode) {
        dispatch(themeModeUpdated(previousMode));
      }
      return rejectWithValue(
        getErrorMessage(
          error,
          'Unable to save your appearance setting. Please try again.',
        ),
      );
    }
  },
);

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    themeModeUpdated(state, action: PayloadAction<ThemeMode>) {
      state.mode = action.payload;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateThemePreference.fulfilled, (state, action) => {
        state.mode = action.payload;
        state.hydrated = true;
        state.error = null;
      })
      .addCase(hydrateThemePreference.rejected, (state, action) => {
        state.hydrated = true;
        state.error =
          action.payload ??
          action.error.message ??
          'Unable to load your appearance setting. Please try again.';
      })
      .addCase(setThemeMode.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(setThemeMode.fulfilled, (state) => {
        state.isSaving = false;
        state.error = null;
      })
      .addCase(setThemeMode.rejected, (state, action) => {
        state.isSaving = false;
        state.error =
          action.payload ??
          action.error.message ??
          'Unable to save your appearance setting. Please try again.';
      });
  },
});

export const { themeModeUpdated } = themeSlice.actions;
export default themeSlice.reducer;
