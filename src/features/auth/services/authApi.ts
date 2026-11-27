import { z } from 'zod';

import type {
  AuthSession,
  AuthTokens,
  AuthUser,
  RegistrationRequest,
} from '../types/authTypes';
import { userMessages } from '../../../shared/constants/userMessages';

const API_BASE_URL = 'https://dummyjson.com';
const REGISTRATION_REQUEST_TIMEOUT_MS = 5_000;

const authUserSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  image: z.string().optional(),
});

const authTokensSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
});

const loginResponseSchema = authUserSchema.extend({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
});

const registrationResponseSchema = z.object({
  id: z.number(),
  username: z.string(),
});

export class AuthApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

interface ApiRequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  accessToken?: string;
  signal?: AbortSignal;
}

async function requestJson<TSchema extends z.ZodType>(
  path: string,
  schema: TSchema,
  options: ApiRequestOptions = {},
): Promise<z.output<TSchema>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    ...(options.signal === undefined ? {} : { signal: options.signal }),
    ...(options.body === undefined
      ? {}
      : { body: JSON.stringify(options.body) }),
  });

  let responseBody: unknown;

  try {
    responseBody = await response.json();
  } catch {
    throw new AuthApiError(
      response.ok
        ? 'The authentication service returned an invalid response.'
        : `The authentication request failed (${response.status}).`,
      response.status,
    );
  }

  if (!response.ok) {
    const message =
      typeof responseBody === 'object' &&
      responseBody !== null &&
      'message' in responseBody &&
      typeof responseBody.message === 'string'
        ? responseBody.message
        : `The authentication request failed (${response.status}).`;

    throw new AuthApiError(message, response.status);
  }

  const parsedResponse = schema.safeParse(responseBody);

  if (!parsedResponse.success) {
    throw new AuthApiError(
      'The authentication service returned an unexpected response.',
      response.status,
    );
  }

  return parsedResponse.data;
}

function getUser(
  user: z.output<typeof authUserSchema>,
): AuthUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    ...(user.image ? { image: user.image } : {}),
  };
}

export async function loginWithDummyJson(
  credentials: { username: string; password: string },
): Promise<AuthSession> {
  const response = await requestJson('/auth/login', loginResponseSchema, {
    method: 'POST',
    body: {
      ...credentials,
      expiresInMins: 30,
    },
  });

  return {
    user: getUser(response),
    tokens: {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    },
  };
}

export async function registerWithDummyJson(
  registration: RegistrationRequest,
): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    REGISTRATION_REQUEST_TIMEOUT_MS,
  );

  try {
    await requestJson('/users/add', registrationResponseSchema, {
      method: 'POST',
      body: registration,
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new AuthApiError('DummyJSON registration request timed out.');
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function getCurrentUser(accessToken: string): Promise<AuthUser> {
  const user = await requestJson('/auth/me', authUserSchema, {
    accessToken,
  });

  return getUser(user);
}

async function refreshAuthTokens(refreshToken: string): Promise<AuthTokens> {
  return requestJson('/auth/refresh', authTokensSchema, {
    method: 'POST',
    body: {
      refreshToken,
      expiresInMins: 30,
    },
  });
}

function isUnauthorized(error: unknown): boolean {
  return error instanceof AuthApiError &&
    (error.status === 401 || error.status === 403);
}

export async function restoreSavedSession(
  tokens: AuthTokens,
): Promise<AuthSession | null> {
  try {
    const user = await getCurrentUser(tokens.accessToken);
    return { user, tokens };
  } catch (error) {
    if (!isUnauthorized(error)) {
      throw error;
    }
  }

  let refreshedTokens: AuthTokens;

  try {
    refreshedTokens = await refreshAuthTokens(tokens.refreshToken);
  } catch (error) {
    if (isUnauthorized(error)) {
      return null;
    }

    throw error;
  }

  let user: AuthUser;

  try {
    user = await getCurrentUser(refreshedTokens.accessToken);
  } catch (error) {
    if (isUnauthorized(error)) {
      return null;
    }

    throw error;
  }

  return {
    user,
    tokens: refreshedTokens,
  };
}

export function getAuthErrorMessage(
  error: unknown,
  context: 'login' | 'default' = 'default',
): string {
  if (error instanceof AuthApiError) {
    if (
      context === 'login' &&
      (error.status === 400 || error.status === 401)
    ) {
      return 'Incorrect username or password.';
    }

    if (error.status === 401 || error.status === 403) {
      return 'Your session has expired. Please sign in again.';
    }

    return userMessages.unexpectedError;
  }

  if (error instanceof TypeError) {
    return userMessages.connectionUnavailable;
  }

  if (
    error instanceof Error &&
    error.name === 'LocalAuthError' &&
    error.message
  ) {
    return error.message;
  }

  return userMessages.unexpectedError;
}
