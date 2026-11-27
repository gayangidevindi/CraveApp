import type { UnknownAction } from '@reduxjs/toolkit';

import {
  authenticationFailed,
  authenticationSucceeded,
  registrationFailed,
  registrationSucceeded,
  signOutSucceeded,
} from '../../../../store/authSlice';
import type { AppDispatch, RootState } from '../../../../store/store';
import type { AuthSession, AuthUser } from '../../types/authTypes';
import {
  getAuthErrorMessage,
  loginWithDummyJson,
  registerWithDummyJson,
} from '../../services/authApi';
import {
  loginWithLocalCredentials,
  registerLocalUser,
} from '../../services/localAuth';
import {
  clearAuthTokens,
  saveAuthTokens,
  saveLocalSessionUserId,
} from '../../services/authStorage';
import {
  signOut,
  submitLogin,
  submitRegistration,
} from '../authActions';

jest.mock('../../services/authApi', () => ({
  getAuthErrorMessage: jest.fn((error: unknown) =>
    error instanceof Error ? error.message : 'Authentication failed.',
  ),
  loginWithDummyJson: jest.fn(),
  registerWithDummyJson: jest.fn(),
  restoreSavedSession: jest.fn(),
}));

jest.mock('../../services/localAuth', () => ({
  loginWithLocalCredentials: jest.fn(),
  registerLocalUser: jest.fn(),
  restoreLocalUser: jest.fn(),
}));

jest.mock('../../services/authStorage', () => ({
  clearAuthTokens: jest.fn(),
  readAuthTokens: jest.fn(),
  readLocalSessionUserId: jest.fn(),
  saveAuthTokens: jest.fn(),
  saveLocalSessionUserId: jest.fn(),
}));

const user: AuthUser = {
  id: -1,
  username: 'alexcrave',
  email: 'alex@example.com',
  firstName: 'Alex',
  lastName: 'Crave',
};

const credentials = {
  username: 'alexcrave',
  password: 'secure-password-1',
};

function createDispatch() {
  const actions: UnknownAction[] = [];
  const dispatch = ((action: UnknownAction) => {
    actions.push(action);
    return action;
  }) as AppDispatch;

  return { actions, dispatch };
}

describe('auth actions', () => {
  const dummyLogin = jest.mocked(loginWithDummyJson);
  const simulatedRegistration = jest.mocked(registerWithDummyJson);
  const localLogin = jest.mocked(loginWithLocalCredentials);
  const registerLocal = jest.mocked(registerLocalUser);
  const mapAuthError = jest.mocked(getAuthErrorMessage);
  const saveTokens = jest.mocked(saveAuthTokens);
  const saveLocalUserId = jest.mocked(saveLocalSessionUserId);
  const clearTokens = jest.mocked(clearAuthTokens);

  beforeEach(() => {
    jest.clearAllMocks();
    mapAuthError.mockImplementation((error) =>
      error instanceof Error ? error.message : 'Authentication failed.',
    );
    saveTokens.mockResolvedValue(undefined);
    saveLocalUserId.mockResolvedValue(undefined);
    clearTokens.mockResolvedValue(undefined);
    simulatedRegistration.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not start a second login request while authentication is in progress', async () => {
    const { actions, dispatch } = createDispatch();
    const getState = () =>
      ({
        auth: { status: 'authenticating' },
      }) as unknown as RootState;

    await submitLogin(credentials)(dispatch, getState);

    expect(dummyLogin).not.toHaveBeenCalled();
    expect(localLogin).not.toHaveBeenCalled();
    expect(actions).toHaveLength(0);
  });

  it('keeps DummyJSON demo-account login working', async () => {
    const session: AuthSession = {
      user: { ...user, id: 123 },
      tokens: { accessToken: 'demo-access', refreshToken: 'demo-refresh' },
    };
    dummyLogin.mockResolvedValue(session);
    const { actions, dispatch } = createDispatch();

    await submitLogin(credentials)(dispatch);

    expect(saveTokens).toHaveBeenCalledWith(session.tokens);
    expect(localLogin).not.toHaveBeenCalled();
    expect(actions).toContainEqual(authenticationSucceeded(session.user));
  });

  it('logs in a locally registered user when DummyJSON does not recognize them', async () => {
    dummyLogin.mockRejectedValue(new Error('Invalid credentials.'));
    localLogin.mockResolvedValue(user);
    const { actions, dispatch } = createDispatch();

    await submitLogin(credentials)(dispatch);

    expect(localLogin).toHaveBeenCalledWith(credentials);
    expect(saveLocalUserId).toHaveBeenCalledWith(user.id);
    expect(actions).toContainEqual(authenticationSucceeded(user));
  });

  it('reports invalid credentials when neither login flow accepts them', async () => {
    const error = new Error('Incorrect username or password.');
    dummyLogin.mockRejectedValue(error);
    localLogin.mockResolvedValue(null);
    const { actions, dispatch } = createDispatch();

    await submitLogin(credentials)(dispatch);

    expect(actions).toContainEqual(authenticationFailed(error.message));
  });

  it('keeps local registration successful when DummyJSON is unavailable', async () => {
    registerLocal.mockResolvedValue(user);
    simulatedRegistration.mockRejectedValue(new TypeError('Network request failed.'));
    const { actions, dispatch } = createDispatch();
    const registration = {
      firstName: 'Alex',
      lastName: 'Crave',
      username: user.username,
      email: user.email,
      password: credentials.password,
    };

    await submitRegistration(registration)(dispatch);

    expect(registerLocal).toHaveBeenCalledWith(registration);
    expect(simulatedRegistration).toHaveBeenCalledWith(registration);
    expect(actions).toContainEqual(
      registrationSucceeded(
        'Account created on this device. Log in with your username and password. This local demo account is separate from DummyJSON.',
      ),
    );
  });

  it('returns a duplicate-account error from local registration', async () => {
    registerLocal.mockRejectedValue(
      new Error('That username or email is already registered on this device.'),
    );
    const { actions, dispatch } = createDispatch();

    await submitRegistration({
      firstName: 'Alex',
      lastName: 'Crave',
      username: user.username,
      email: user.email,
      password: credentials.password,
    })(dispatch);

    expect(actions).toContainEqual(
      registrationFailed(
        'That username or email is already registered on this device.',
      ),
    );
  });

  it('clears saved credentials and Redux authentication state on logout', async () => {
    const { actions, dispatch } = createDispatch();

    await signOut()(dispatch);

    expect(clearTokens).toHaveBeenCalledTimes(1);
    expect(actions).toContainEqual(signOutSucceeded());
  });
});
