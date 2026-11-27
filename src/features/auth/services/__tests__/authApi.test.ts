import {
  AuthApiError,
  loginWithDummyJson,
  registerWithDummyJson,
  restoreSavedSession,
} from '../authApi';

const userResponse = {
  id: 1,
  username: 'emilys',
  email: 'emily.johnson@x.dummyjson.com',
  firstName: 'Emily',
  lastName: 'Johnson',
  image: 'https://dummyjson.com/icon/emilys/128',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('authApi', () => {
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    fetchMock = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('posts login credentials and returns the user with session tokens', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        ...userResponse,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }),
    );

    await expect(
      loginWithDummyJson({
        username: 'emilys',
        password: 'emilyspass',
      }),
    ).resolves.toEqual({
      user: userResponse,
      tokens: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://dummyjson.com/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          username: 'emilys',
          password: 'emilyspass',
          expiresInMins: 30,
        }),
      }),
    );
  });

  it('reports invalid login credentials as an API error', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ message: 'Invalid credentials' }, 401),
    );

    await expect(
      loginWithDummyJson({ username: 'wrong', password: 'wrong' }),
    ).rejects.toBeInstanceOf(AuthApiError);
  });

  it('posts registration to the simulated users endpoint', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ id: 209, username: 'taylorc' }, 201),
    );
    const registration = {
      firstName: 'Taylor',
      lastName: 'Crave',
      username: 'taylorc',
      email: 'taylor@example.com',
      password: 'securepass123',
    };

    await expect(registerWithDummyJson(registration)).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith(
      'https://dummyjson.com/users/add',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(registration),
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it('reports registration network failures', async () => {
    const networkError = new TypeError('Network request failed.');
    fetchMock.mockRejectedValue(networkError);

    await expect(
      registerWithDummyJson({
        firstName: 'Taylor',
        lastName: 'Crave',
        username: 'taylorc',
        email: 'taylor@example.com',
        password: 'securepass123',
      }),
    ).rejects.toBe(networkError);
  });

  it('aborts a registration request that exceeds its timeout', async () => {
    jest.useFakeTimers();
    let requestSignal: AbortSignal | undefined;
    fetchMock.mockImplementation((_url, options) => {
      requestSignal = options?.signal ?? undefined;
      return new Promise<Response>((_resolve, reject) => {
        requestSignal?.addEventListener(
          'abort',
          () => reject(new Error('Request aborted.')),
          { once: true },
        );
      });
    });

    const request = registerWithDummyJson({
      firstName: 'Taylor',
      lastName: 'Crave',
      username: 'taylorc',
      email: 'taylor@example.com',
      password: 'securepass123',
    });
    const requestExpectation = expect(request).rejects.toThrow(
      'DummyJSON registration request timed out.',
    );
    await jest.advanceTimersByTimeAsync(5_000);

    await requestExpectation;
    expect(requestSignal?.aborted).toBe(true);
  });

  it('refreshes an expired access token before restoring the user', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ message: 'Invalid/Expired Token' }, 401),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        }),
      )
      .mockResolvedValueOnce(jsonResponse(userResponse));

    await expect(
      restoreSavedSession({
        accessToken: 'expired-access-token',
        refreshToken: 'saved-refresh-token',
      }),
    ).resolves.toEqual({
      user: userResponse,
      tokens: {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      },
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://dummyjson.com/auth/me',
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer expired-access-token',
        },
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://dummyjson.com/auth/refresh',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          refreshToken: 'saved-refresh-token',
          expiresInMins: 30,
        }),
      }),
    );
  });
});
