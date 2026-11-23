import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

import {
  LocalAuthError,
  loginWithLocalCredentials,
  registerLocalUser,
  restoreLocalUser,
} from '../localAuth';
import type { RegistrationRequest } from '../../types/authTypes';

jest.mock(
  '@react-native-async-storage/async-storage',
  () =>
    jest.requireActual(
      '@react-native-async-storage/async-storage/jest/async-storage-mock',
    ),
);

jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn(),
}));

function registration(
  overrides: Partial<RegistrationRequest> = {},
): RegistrationRequest {
  return {
    firstName: 'Alex',
    lastName: 'Crave',
    username: 'alexcrave',
    email: 'alex@example.com',
    password: 'secure-password-1',
    ...overrides,
  };
}

describe('localAuth', () => {
  const getRandomBytesAsync = jest.mocked(Crypto.getRandomBytesAsync);
  let saltCounter = 0;

  beforeEach(async () => {
    await AsyncStorage.clear();
    saltCounter = 0;
    getRandomBytesAsync.mockImplementation(async (byteCount) => {
      saltCounter += 1;
      return new Uint8Array(byteCount).fill(saltCounter);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('registers a local profile with a unique salted password hash', async () => {
    const firstUser = await registerLocalUser(registration());
    const secondUser = await registerLocalUser(
      registration({
        username: 'alexcrave2',
        email: 'alex2@example.com',
      }),
    );
    const storedAccounts = await AsyncStorage.getItem(
      'craveapp.auth.local-users.v1',
    );

    expect(firstUser.id).toBeLessThan(0);
    expect(secondUser.id).not.toBe(firstUser.id);
    expect(storedAccounts).not.toContain('secure-password-1');
    expect(storedAccounts).toContain('"algorithm":"PBKDF2-SHA256"');

    const parsedAccounts = JSON.parse(storedAccounts ?? '[]') as {
      password: { salt: string; hash: string; iterations: number };
    }[];
    expect(parsedAccounts[0]?.password.iterations).toBe(600_000);
    expect(parsedAccounts[0]?.password.salt).not.toBe(
      parsedAccounts[1]?.password.salt,
    );
  });

  it('logs in with the username and password used to register', async () => {
    const user = await registerLocalUser(registration());

    await expect(
      loginWithLocalCredentials({
        username: ' AlexCrave ',
        password: 'secure-password-1',
      }),
    ).resolves.toEqual(user);
  });

  it('restores a locally registered profile by its stable ID', async () => {
    const user = await registerLocalUser(registration());

    await expect(restoreLocalUser(user.id)).resolves.toEqual(user);
  });

  it('rejects duplicate usernames and email addresses without regard to case', async () => {
    await registerLocalUser(registration());

    await expect(
      registerLocalUser(
        registration({ username: 'ALEXCRAVE', email: 'different@example.com' }),
      ),
    ).rejects.toThrow(LocalAuthError);
    await expect(
      registerLocalUser(
        registration({ username: 'anotheruser', email: 'ALEX@example.com' }),
      ),
    ).rejects.toThrow('already registered');
  });

  it('rejects invalid credentials for a registered and an unknown username', async () => {
    await registerLocalUser(registration());

    await expect(
      loginWithLocalCredentials({
        username: 'alexcrave',
        password: 'incorrect-password',
      }),
    ).resolves.toBeNull();
    await expect(
      loginWithLocalCredentials({
        username: 'missing-user',
        password: 'secure-password-1',
      }),
    ).resolves.toBeNull();
  });

  it('validates required fields and password length before creating an account', async () => {
    await expect(
      registerLocalUser(registration({ password: 'short' })),
    ).rejects.toThrow('at least 8 characters');
    await expect(
      registerLocalUser(registration({ email: 'not-an-email' })),
    ).rejects.toThrow('valid email address');
  });
});
