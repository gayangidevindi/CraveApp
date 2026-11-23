import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { AuthUser } from '../features/auth/types/authTypes';

export type AuthStatus =
  | 'idle'
  | 'restoring'
  | 'unauthenticated'
  | 'authenticating'
  | 'authenticated'
  | 'error';

export type RegistrationStatus =
  | 'idle'
  | 'loading'
  | 'succeeded'
  | 'failed';

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  error: string | null;
  registrationStatus: RegistrationStatus;
  registrationMessage: string | null;
  registrationError: string | null;
  isSigningOut: boolean;
  signOutError: string | null;
}

const initialState: AuthState = {
  status: 'idle',
  user: null,
  error: null,
  registrationStatus: 'idle',
  registrationMessage: null,
  registrationError: null,
  isSigningOut: false,
  signOutError: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionRestoreStarted(state) {
      state.status = 'restoring';
      state.error = null;
    },
    sessionRestoreSucceeded(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
      state.status = action.payload ? 'authenticated' : 'unauthenticated';
      state.error = null;
    },
    sessionRestoreFailed(state, action: PayloadAction<string>) {
      state.user = null;
      state.status = 'error';
      state.error = action.payload;
    },
    authenticationStarted(state) {
      state.status = 'authenticating';
      state.error = null;
    },
    authenticationSucceeded(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      state.status = 'authenticated';
      state.error = null;
    },
    authenticationFailed(state, action: PayloadAction<string>) {
      state.user = null;
      state.status = 'unauthenticated';
      state.error = action.payload;
    },
    clearAuthError(state) {
      state.error = null;
      if (state.status === 'error') {
        state.status = 'unauthenticated';
      }
    },
    registrationStarted(state) {
      state.registrationStatus = 'loading';
      state.registrationMessage = null;
      state.registrationError = null;
    },
    registrationSucceeded(state, action: PayloadAction<string>) {
      state.registrationStatus = 'succeeded';
      state.registrationMessage = action.payload;
      state.registrationError = null;
    },
    registrationFailed(state, action: PayloadAction<string>) {
      state.registrationStatus = 'failed';
      state.registrationMessage = null;
      state.registrationError = action.payload;
    },
    clearRegistrationFeedback(state) {
      state.registrationStatus = 'idle';
      state.registrationMessage = null;
      state.registrationError = null;
    },
    signOutStarted(state) {
      state.isSigningOut = true;
      state.signOutError = null;
    },
    signOutSucceeded(state) {
      state.user = null;
      state.status = 'unauthenticated';
      state.isSigningOut = false;
      state.signOutError = null;
    },
    signOutFailed(state, action: PayloadAction<string>) {
      state.isSigningOut = false;
      state.signOutError = action.payload;
    },
    clearSignOutError(state) {
      state.signOutError = null;
    },
  },
});

export const {
  sessionRestoreStarted,
  sessionRestoreSucceeded,
  sessionRestoreFailed,
  authenticationStarted,
  authenticationSucceeded,
  authenticationFailed,
  clearAuthError,
  registrationStarted,
  registrationSucceeded,
  registrationFailed,
  clearRegistrationFeedback,
  signOutStarted,
  signOutSucceeded,
  signOutFailed,
  clearSignOutError,
} = authSlice.actions;

export default authSlice.reducer;
