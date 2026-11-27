import {
  authenticationFailed,
  authenticationSucceeded,
  registrationFailed,
  registrationStarted,
  registrationSucceeded,
  sessionRestoreSucceeded,
  default as authReducer,
} from '../authSlice';

const user = {
  id: 1,
  username: 'emilys',
  email: 'emily@example.com',
  firstName: 'Emily',
  lastName: 'Johnson',
};

describe('authSlice', () => {
  it('starts in the idle state with no user', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toMatchObject({
      status: 'idle',
      user: null,
    });
  });

  it('restores a user as authenticated', () => {
    expect(authReducer(undefined, sessionRestoreSucceeded(user))).toMatchObject({
      status: 'authenticated',
      user,
    });
  });

  it('keeps failed login attempts unauthenticated with a visible error', () => {
    expect(
      authReducer(undefined, authenticationFailed('Incorrect credentials.')),
    ).toMatchObject({
      status: 'unauthenticated',
      user: null,
      error: 'Incorrect credentials.',
    });
  });

  it('does not authenticate a simulated registration', () => {
    const loadingState = authReducer(undefined, registrationStarted());
    const state = authReducer(
      loadingState,
      registrationSucceeded('Registration is simulated.'),
    );

    expect(state.registrationStatus).toBe('succeeded');
    expect(state.status).toBe('idle');
    expect(state.user).toBeNull();
  });

  it('clears registration loading state and exposes failures', () => {
    const loadingState = authReducer(undefined, registrationStarted());
    const state = authReducer(
      loadingState,
      registrationFailed('Unable to save the account.'),
    );

    expect(state.registrationStatus).toBe('failed');
    expect(state.registrationError).toBe('Unable to save the account.');
  });

  it('stores the returned authenticated user', () => {
    expect(authReducer(undefined, authenticationSucceeded(user))).toMatchObject({
      status: 'authenticated',
      user,
    });
  });
});
