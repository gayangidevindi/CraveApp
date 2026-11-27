import AsyncStorage from '@react-native-async-storage/async-storage';
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';
import * as Crypto from 'expo-crypto';
import { z } from 'zod';

import type { AuthUser, RegistrationRequest } from '../types/authTypes';

const LOCAL_USERS_KEY = 'craveapp.auth.local-users.v1';
const PASSWORD_HASH_ITERATIONS = 600_000;
const PASSWORD_HASH_BYTES = 32;
const PASSWORD_SALT_BYTES = 16;

const localUserSchema = z.object({
  id: z.number().int().negative(),
  username: z.string().min(3),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  image: z.string().optional(),
});

const passwordRecordSchema = z.object({
  algorithm: z.literal('PBKDF2-SHA256'),
  iterations: z.number().int().min(100_000).max(1_000_000),
  salt: z.string().regex(/^[0-9a-f]{32}$/),
  hash: z.string().regex(/^[0-9a-f]{64}$/),
});

const localAccountSchema = z.object({
  user: localUserSchema,
  password: passwordRecordSchema,
});

const localAccountsSchema = z.array(localAccountSchema);

const localRegistrationSchema = z.object({
  firstName: z.string().trim().min(1, 'Enter your full name.'),
  lastName: z.string().trim(),
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters.')
    .max(30, 'Username must be 30 characters or fewer.')
    .regex(
      /^[A-Za-z0-9_.-]+$/,
      'Username can contain letters, numbers, dots, underscores and hyphens.',
    ),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Enter a valid email address.')
    .max(254, 'Email must be 254 characters or fewer.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(128, 'Password must be 128 characters or fewer.'),
});

export class LocalAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LocalAuthError';
  }
}

type LocalAccount = z.infer<typeof localAccountSchema>;

async function readLocalAccounts(): Promise<LocalAccount[]> {
  const storedAccounts = await AsyncStorage.getItem(LOCAL_USERS_KEY);

  if (storedAccounts === null) {
    return [];
  }

  let parsedAccounts: unknown;

  try {
    parsedAccounts = JSON.parse(storedAccounts);
  } catch {
    throw new LocalAuthError(
      'Saved local accounts could not be read. Clear this app’s local data and register again.',
    );
  }

  const result = localAccountsSchema.safeParse(parsedAccounts);

  if (!result.success) {
    throw new LocalAuthError(
      'Saved local account data is invalid. Clear this app’s local data and register again.',
    );
  }

  return result.data;
}

async function derivePasswordHash(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<string> {
  const derivedKey = await pbkdf2Async(
    sha256,
    utf8ToBytes(password),
    salt,
    { c: iterations, dkLen: PASSWORD_HASH_BYTES },
  );

  return bytesToHex(derivedKey);
}

function bytesMatchConstantTime(left: Uint8Array, right: Uint8Array): boolean {
  let difference = left.length ^ right.length;
  const length = Math.max(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    difference |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }

  return difference === 0;
}

function createLocalUserId(accounts: LocalAccount[]): number {
  const existingIds = new Set(accounts.map(({ user }) => user.id));
  let id = -1;

  while (existingIds.has(id)) {
    id -= 1;
  }

  return id;
}

export async function registerLocalUser(
  registration: RegistrationRequest,
): Promise<AuthUser> {
  const parsedRegistration = localRegistrationSchema.safeParse(registration);

  if (!parsedRegistration.success) {
    throw new LocalAuthError(
      parsedRegistration.error.issues[0]?.message ??
        'Check the registration details and try again.',
    );
  }

  const normalizedRegistration = parsedRegistration.data;
  const usernameKey = normalizedRegistration.username.toLowerCase();
  const emailKey = normalizedRegistration.email.toLowerCase();
  const accounts = await readLocalAccounts();

  if (
    accounts.some(
      ({ user }) =>
        user.username.toLowerCase() === usernameKey ||
        user.email.toLowerCase() === emailKey,
    )
  ) {
    throw new LocalAuthError(
      'That username or email is already registered on this device.',
    );
  }

  const existingSalts = new Set(
    accounts.map(({ password }) => password.salt),
  );
  let saltHex: string | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const candidate = bytesToHex(
      await Crypto.getRandomBytesAsync(PASSWORD_SALT_BYTES),
    );

    if (!existingSalts.has(candidate)) {
      saltHex = candidate;
      break;
    }
  }

  if (saltHex === null) {
    throw new LocalAuthError(
      'A unique password salt could not be generated. Please try again.',
    );
  }

  const user: AuthUser = {
    id: createLocalUserId(accounts),
    username: normalizedRegistration.username,
    email: normalizedRegistration.email.toLowerCase(),
    firstName: normalizedRegistration.firstName,
    lastName: normalizedRegistration.lastName,
  };
  const account: LocalAccount = {
    user,
    password: {
      algorithm: 'PBKDF2-SHA256',
      iterations: PASSWORD_HASH_ITERATIONS,
      salt: saltHex,
      hash: await derivePasswordHash(
        normalizedRegistration.password,
        hexToBytes(saltHex),
        PASSWORD_HASH_ITERATIONS,
      ),
    },
  };

  await AsyncStorage.setItem(
    LOCAL_USERS_KEY,
    JSON.stringify([...accounts, account]),
  );

  return user;
}

export async function loginWithLocalCredentials(
  credentials: { username: string; password: string },
): Promise<AuthUser | null> {
  const accounts = await readLocalAccounts();
  const usernameKey = credentials.username.trim().toLowerCase();
  const account = accounts.find(
    ({ user }) => user.username.toLowerCase() === usernameKey,
  );

  if (!account) {
    return null;
  }

  const actualHash = await derivePasswordHash(
    credentials.password,
    hexToBytes(account.password.salt),
    account.password.iterations,
  );
  const expectedHash = hexToBytes(account.password.hash);

  return bytesMatchConstantTime(
    hexToBytes(actualHash),
    expectedHash,
  )
    ? account.user
    : null;
}

export async function restoreLocalUser(
  userId: number,
): Promise<AuthUser | null> {
  const accounts = await readLocalAccounts();
  return accounts.find(({ user }) => user.id === userId)?.user ?? null;
}
