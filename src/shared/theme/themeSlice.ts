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

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message
    ? error.message
    : fallback;
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
        'Your appearance preference could not be loaded.',
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
          'Your appearance preference could not be saved.',
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
          'Your appearance preference could not be loaded.';
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
          'Your appearance preference could not be saved.';
      });
  },
});

export const { themeModeUpdated } = themeSlice.actions;
export default themeSlice.reducer;
