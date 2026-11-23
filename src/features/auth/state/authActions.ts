import type { AppDispatch, RootState } from '../../../store/store';
import {
  authenticationFailed,
  authenticationStarted,
  authenticationSucceeded,
  clearAuthError,
  clearRegistrationFeedback,
  clearSignOutError,
  registrationFailed,
  registrationStarted,
  registrationSucceeded,
  sessionRestoreFailed,
  sessionRestoreStarted,
  sessionRestoreSucceeded,
  signOutFailed,
  signOutStarted,
  signOutSucceeded,
} from '../../../store/authSlice';
import {
  getAuthErrorMessage,
  loginWithDummyJson,
  restoreSavedSession,
} from '../services/authApi';
import {
  loginWithLocalCredentials,
  registerLocalUser,
  restoreLocalUser,
} from '../services/localAuth';
import {
  clearAuthTokens,
  readAuthTokens,
  readLocalSessionUserId,
  saveLocalSessionUserId,
  saveAuthTokens,
} from '../services/authStorage';
import type { LoginFormData } from '../schemas/authSchemas';
import type {
  AuthSession,
  RegistrationRequest,
} from '../types/authTypes';

const REGISTRATION_NOTICE =
  'Account created on this device. Log in with your username and password. This local demo account is separate from DummyJSON.';

export const restoreAuthSession =
  () =>
  async (
    dispatch: AppDispatch,
    getState: () => RootState,
  ): Promise<void> => {
    if (getState().auth.status !== 'idle') {
      return;
    }

    dispatch(sessionRestoreStarted());
    try {
      const localUserId = await readLocalSessionUserId();
      if (localUserId !== null) {
        const localUser = await restoreLocalUser(localUserId);
        if (localUser === null) {
          await clearAuthTokens();
          dispatch(sessionRestoreSucceeded(null));
          return;
        }

        dispatch(sessionRestoreSucceeded(localUser));
        return;
      }

      const tokens = await readAuthTokens();
      if (tokens === null) {
        dispatch(sessionRestoreSucceeded(null));
        return;
      }

      const session = await restoreSavedSession(tokens);

      if (session === null) {
        await clearAuthTokens();
        dispatch(sessionRestoreSucceeded(null));
        return;
      }

      if (
        session.tokens.accessToken !== tokens.accessToken ||
        session.tokens.refreshToken !== tokens.refreshToken
      ) {
        await saveAuthTokens(session.tokens);
      }

      dispatch(sessionRestoreSucceeded(session.user));
    } catch (error) {
      dispatch(sessionRestoreFailed(getAuthErrorMessage(error)));
    }
  };

export const submitLogin =
  (credentials: LoginFormData) =>
  async (dispatch: AppDispatch): Promise<void> => {
    dispatch(authenticationStarted());

    let session: AuthSession | null = null;
    let dummyJsonError: unknown = null;

    try {
      session = await loginWithDummyJson(credentials);
    } catch (error) {
      dummyJsonError = error;
    }

    if (session !== null) {
      try {
      await saveAuthTokens(session.tokens);
      dispatch(authenticationSucceeded(session.user));
      } catch (error) {
      dispatch(authenticationFailed(getAuthErrorMessage(error, 'login')));
      }
      return;
    }

    try {
      const localUser = await loginWithLocalCredentials(credentials);
      if (localUser !== null) {
      await saveLocalSessionUserId(localUser.id);
      dispatch(authenticationSucceeded(localUser));
      return;
      }
    } catch (error) {
      dispatch(authenticationFailed(getAuthErrorMessage(error, 'login')));
      return;
    }

    dispatch(
      authenticationFailed(getAuthErrorMessage(dummyJsonError, 'login')),
    );
  };

export const submitRegistration =
  (registration: RegistrationRequest) =>
  async (dispatch: AppDispatch): Promise<void> => {
    dispatch(registrationStarted());

    try {
      await registerLocalUser(registration);
      dispatch(registrationSucceeded(REGISTRATION_NOTICE));
    } catch (error) {
      dispatch(registrationFailed(getAuthErrorMessage(error)));
    }
  };

export const signOut =
  () =>
  async (dispatch: AppDispatch): Promise<void> => {
    dispatch(signOutStarted());

    try {
      await clearAuthTokens();
      dispatch(signOutSucceeded());
    } catch (error) {
      dispatch(signOutFailed(getAuthErrorMessage(error)));
    }
  };

export {
  clearAuthError,
  clearRegistrationFeedback,
  clearSignOutError,
};
