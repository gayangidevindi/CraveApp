import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import {
  readUserProfile,
  saveUserProfile,
} from '../services/profileStorage';
import type { UserProfile } from '../types/profileTypes';
import { userMessages } from '../../../shared/constants/userMessages';

export interface ProfileState {
  byUser: Record<string, UserProfile>;
  loadedByUser: Record<string, boolean>;
  loadingByUser: Record<string, boolean>;
  savingByUser: Record<string, boolean>;
  errorByUser: Record<string, string | null>;
}

const initialState: ProfileState = {
  byUser: {},
  loadedByUser: {},
  loadingByUser: {},
  savingByUser: {},
  errorByUser: {},
};

interface ProfileThunkConfig {
  state: { profile: ProfileState };
  rejectValue: string;
}

function getProfileErrorMessage(
  _error: unknown,
  operation: 'load' | 'save',
): string {
  return operation === 'load'
    ? userMessages.unableToLoadProfile
    : userMessages.unableToSaveChanges;
}

export const loadUserProfile = createAsyncThunk<
  { userId: string; profile: UserProfile | null },
  string,
  ProfileThunkConfig
>(
  'profile/loadUserProfile',
  async (userId, { rejectWithValue }) => {
    try {
      return { userId, profile: await readUserProfile(userId) };
    } catch (error) {
      return rejectWithValue(getProfileErrorMessage(error, 'load'));
    }
  },
  {
    condition: (userId, { getState }) =>
      getState().profile.loadedByUser[userId] !== true &&
      getState().profile.loadingByUser[userId] !== true,
  },
);

export const updateUserProfile = createAsyncThunk<
  { userId: string; profile: UserProfile },
  { userId: string; profile: UserProfile },
  ProfileThunkConfig
>(
  'profile/updateUserProfile',
  async ({ userId, profile }, { rejectWithValue }) => {
    try {
      await saveUserProfile(userId, profile);
      return { userId, profile };
    } catch (error) {
      return rejectWithValue(getProfileErrorMessage(error, 'save'));
    }
  },
  {
    condition: ({ userId }, { getState }) =>
      getState().profile.loadedByUser[userId] === true &&
      getState().profile.savingByUser[userId] !== true,
  },
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadUserProfile.pending, (state, action) => {
        state.loadingByUser[action.meta.arg] = true;
        state.errorByUser[action.meta.arg] = null;
      })
      .addCase(loadUserProfile.fulfilled, (state, action) => {
        const { userId, profile } = action.payload;
        if (profile !== null) {
          state.byUser[userId] = profile;
        }
        state.loadedByUser[userId] = true;
        state.loadingByUser[userId] = false;
        state.errorByUser[userId] = null;
      })
      .addCase(loadUserProfile.rejected, (state, action) => {
        if (!action.meta.condition) {
          state.loadingByUser[action.meta.arg] = false;
          state.errorByUser[action.meta.arg] =
            action.payload ??
            userMessages.unableToLoadProfile;
        }
      })
      .addCase(updateUserProfile.pending, (state, action) => {
        state.savingByUser[action.meta.arg.userId] = true;
        state.errorByUser[action.meta.arg.userId] = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        const { userId, profile } = action.payload;
        state.byUser[userId] = profile;
        state.savingByUser[userId] = false;
        state.errorByUser[userId] = null;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        const userId = action.meta.arg.userId;
        state.savingByUser[userId] = false;
        if (!action.meta.condition) {
          state.errorByUser[userId] =
            action.payload ??
            userMessages.unableToSaveChanges;
        }
      });
  },
});

export default profileSlice.reducer;
