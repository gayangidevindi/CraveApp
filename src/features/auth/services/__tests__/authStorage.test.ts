import * as SecureStore from 'expo-secure-store';

import {
  clearAuthTokens,
  readAuthTokens,
  saveAuthTokens,
} from '../authStorage';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

const getItemAsync = jest.mocked(SecureStore.getItemAsync);
const setItemAsync = jest.mocked(SecureStore.setItemAsync);
const deleteItemAsync = jest.mocked(SecureStore.deleteItemAsync);

describe('authStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('restores a complete token pair from SecureStore', async () => {
    getItemAsync
      .mockResolvedValueOnce('saved-access-token')
      .mockResolvedValueOnce('saved-refresh-token');

    await expect(readAuthTokens()).resolves.toEqual({
      accessToken: 'saved-access-token',
      refreshToken: 'saved-refresh-token',
    });
  });

  it('removes partial credentials rather than restoring an incomplete session', async () => {
    getItemAsync
      .mockResolvedValueOnce('saved-access-token')
      .mockResolvedValueOnce(null);

    await expect(readAuthTokens()).resolves.toBeNull();
    expect(deleteItemAsync).toHaveBeenCalledTimes(3);
  });

  it('stores both tokens in SecureStore', async () => {
    setItemAsync.mockResolvedValue(undefined);

    await saveAuthTokens({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    expect(setItemAsync).toHaveBeenCalledTimes(2);
    expect(setItemAsync).toHaveBeenNthCalledWith(
      1,
      'craveapp.auth.access-token.v1',
      'access-token',
    );
    expect(setItemAsync).toHaveBeenNthCalledWith(
      2,
      'craveapp.auth.refresh-token.v1',
      'refresh-token',
    );
  });

  it('deletes both token keys on sign out', async () => {
    await clearAuthTokens();

    expect(deleteItemAsync).toHaveBeenCalledTimes(3);
  });
});
