import * as SecureStore from 'expo-secure-store';

import {
  clearAuthTokens,
  readAuthTokens,
  readLocalSessionUserId,
  saveAuthTokens,
  saveLocalSessionUserId,
} from '../authStorage';

jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key) {
      return values.get(key) ?? null;
    },
    key(index) {
      return Array.from(values.keys())[index] ?? null;
    },
    removeItem(key) {
      values.delete(key);
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

describe('authStorage web adapter', () => {
  let localStorage: Storage;
  let sessionStorage: Storage;

  beforeEach(() => {
    localStorage = createMemoryStorage();
    sessionStorage = createMemoryStorage();
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { localStorage, sessionStorage },
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'window');
  });

  it('keeps demo tokens tab-scoped, restores local IDs, and clears both on logout', async () => {
    await saveAuthTokens({
      accessToken: 'demo-access',
      refreshToken: 'demo-refresh',
    });
    await expect(readAuthTokens()).resolves.toEqual({
      accessToken: 'demo-access',
      refreshToken: 'demo-refresh',
    });

    await saveLocalSessionUserId(-7);
    await expect(readLocalSessionUserId()).resolves.toBe(-7);
    expect(await readAuthTokens()).toBeNull();

    await clearAuthTokens();
    expect(await readLocalSessionUserId()).toBeNull();
    expect(SecureStore.getItemAsync).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('craveapp.auth.access-token.v1')).toBeNull();
    expect(sessionStorage.getItem('craveapp.auth.refresh-token.v1')).toBeNull();
    expect(localStorage.getItem('craveapp.auth.local-user-id.v1')).toBeNull();
  });
});
