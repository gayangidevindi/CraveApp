import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { z } from 'zod';

import type { AuthTokens } from '../types/authTypes';

const ACCESS_TOKEN_KEY = 'craveapp.auth.access-token.v1';
const REFRESH_TOKEN_KEY = 'craveapp.auth.refresh-token.v1';
const LOCAL_USER_ID_KEY = 'craveapp.auth.local-user-id.v1';

const authTokensSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
});

function getWebStorage(kind: 'local' | 'session'): Storage {
  if (typeof window === 'undefined') {
    throw new Error('Browser session storage is unavailable.');
  }

  return kind === 'local' ? window.localStorage : window.sessionStorage;
}

async function getItemAsync(
  key: string,
  webStorage: 'local' | 'session' = 'session',
): Promise<string | null> {
  if (Platform.OS === 'web') {
    return getWebStorage(webStorage).getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

async function setItemAsync(
  key: string,
  value: string,
  webStorage: 'local' | 'session' = 'session',
): Promise<void> {
  if (Platform.OS === 'web') {
    getWebStorage(webStorage).setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function deleteItemAsync(
  key: string,
  webStorage: 'local' | 'session' = 'session',
): Promise<void> {
  if (Platform.OS === 'web') {
    getWebStorage(webStorage).removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

export async function readAuthTokens(): Promise<AuthTokens | null> {
  const [accessToken, refreshToken] = await Promise.all([
    getItemAsync(ACCESS_TOKEN_KEY),
    getItemAsync(REFRESH_TOKEN_KEY),
  ]);

  if (accessToken === null && refreshToken === null) return null;

  const parsedTokens = authTokensSchema.safeParse({
    accessToken,
    refreshToken,
  });

  if (!parsedTokens.success) {
    await clearAuthTokens();
    return null;
  }

  return parsedTokens.data;
}

export async function saveAuthTokens(tokens: AuthTokens): Promise<void> {
  try {
    await Promise.all([
      setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken),
      setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken),
      deleteItemAsync(LOCAL_USER_ID_KEY, 'local'),
    ]);
  } catch (error) {
    await clearAuthTokens();
    throw error;
  }
}

export async function readLocalSessionUserId(): Promise<number | null> {
  const storedId = await getItemAsync(LOCAL_USER_ID_KEY, 'local');

  if (storedId === null) {
    return null;
  }

  const userId = Number(storedId);

  if (!Number.isSafeInteger(userId) || userId >= 0) {
    await clearAuthTokens();
    return null;
  }

  return userId;
}

export async function saveLocalSessionUserId(userId: number): Promise<void> {
  if (!Number.isSafeInteger(userId) || userId >= 0) {
    throw new Error('A valid local user ID is required for this session.');
  }

  try {
    await Promise.all([
      deleteItemAsync(ACCESS_TOKEN_KEY),
      deleteItemAsync(REFRESH_TOKEN_KEY),
      setItemAsync(LOCAL_USER_ID_KEY, String(userId), 'local'),
    ]);
  } catch (error) {
    await clearAuthTokens();
    throw error;
  }
}

export async function clearAuthTokens(): Promise<void> {
  await Promise.all([
    deleteItemAsync(ACCESS_TOKEN_KEY),
    deleteItemAsync(REFRESH_TOKEN_KEY),
    deleteItemAsync(LOCAL_USER_ID_KEY, 'local'),
  ]);
}
